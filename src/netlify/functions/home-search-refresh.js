const { schedule } = require('@netlify/functions');
const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

const ADMIN_COOKIE = 'robspain_admin_session';

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
    body: JSON.stringify(payload),
  };
}

// Daily plus evening refresh: 7am and 6pm Pacific (14:00 and 01:00 UTC during PDT).
// Keeps Fresno County listings fresh, with Fresno High and Tower District promoted first.
const scheduledHandler = schedule('0 14,1 * * *', async (event) => refreshHomeSearch(event));

module.exports.handler = async (event, context) => {
  if (isScheduledEvent(event)) return scheduledHandler(event, context);
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!readAdminSession(event) && !readApiTokenSession(event)) return json(401, { error: 'Unauthorized' });

  const result = await refreshHomeSearch(event, { manual: true });
  return json(result.statusCode || 200, result.payload || {});
};

function isScheduledEvent(event) {
  const headers = event.headers || {};
  return !event.httpMethod || headers['x-netlify-scheduled'] || headers['X-Netlify-Scheduled'];
}

async function refreshHomeSearch(event, options = {}) {
  console.log('[home-search-refresh] Starting scheduled refresh', new Date().toISOString());

  const store = getBlobStore();
  if (!store) {
    console.error('[home-search-refresh] Storage not configured');
    return { statusCode: 500, payload: { error: 'Storage not configured' } };
  }

  try {
    const sourceResult = await fetchListingsFromSources();
    const listings = sourceResult.listings;
    if (!listings || listings.length === 0) {
      console.warn('[home-search-refresh] No listings returned, skipping update');
      return { statusCode: 200, payload: { ok: true, updated: false, listings: 0, message: 'No listings returned' } };
    }

    // Merge with existing data to preserve addedAt timestamps for known listings
    const existingRaw = await store.get('listings').catch(() => null);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const existingMap = new Map(existing.map((l) => [l.id, l]));

    const now = new Date().toISOString();
    const merged = listings.map((listing) => ({
      ...listing,
      addedAt: existingMap.has(listing.id) ? existingMap.get(listing.id).addedAt : now,
    }));

    await store.set('listings', JSON.stringify(merged));

    const metaRaw = await store.get('search-meta').catch(() => null);
    const prevMeta = metaRaw ? JSON.parse(metaRaw) : { searchCount: 0 };
    await store.set(
      'search-meta',
      JSON.stringify({
        lastSearched: now,
        searchCount: (prevMeta.searchCount || 0) + 1,
        source: sourceResult.sourceLabel,
        sources: sourceResult.sources,
        sourceCounts: sourceResult.sourceCounts,
        preferredSource: sourceResult.preferredSource,
      })
    );

    console.log(`[home-search-refresh] Updated ${merged.length} listings`);
    return {
      statusCode: 200,
      payload: {
        ok: true,
        manual: Boolean(options.manual),
        updated: true,
        listings: merged.length,
        source: sourceResult.sourceLabel,
        sourceCounts: sourceResult.sourceCounts,
        refreshedAt: now,
      },
    };
  } catch (err) {
    console.error('[home-search-refresh] Error:', err.message || err);
    return { statusCode: 500, payload: { error: err.message || String(err) } };
  }
}

function parseCookies(header) {
  return Object.fromEntries(
    String(header || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        if (index === -1) return [part, ''];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function adminSign(value) {
  const secret = process.env.ADMIN_AUTH_PASSWORD || process.env.GOOGLE_CLIENT_SECRET || process.env.JWT_SECRET;
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function readAdminSession(event) {
  const cookie = parseCookies(event.headers.cookie || event.headers.Cookie)[ADMIN_COOKIE];
  if (!cookie) return null;
  const [payload, signature] = cookie.split('.');
  if (!payload || !signature || adminSign(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const allowedStr = (process.env.ADMIN_ALLOWED_EMAIL || process.env.ADMIN_AUTH_USER || 'robspain@gmail.com').toLowerCase();
    const allowedList = allowedStr.split(',').map((email) => email.trim()).filter(Boolean);
    if (!session.email || !allowedList.includes(session.email.toLowerCase())) return null;
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

function readApiTokenSession(event) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  const auth = event.headers.authorization || event.headers.Authorization || '';
  if (!adminToken || auth !== `Bearer ${adminToken}`) return null;
  return { email: 'admin-token' };
}

function getBlobStore() {
  try {
    return getStore('home-search');
  } catch (e) {
    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_TOKEN || process.env.NETLIFY_API_TOKEN;
    if (!siteID || !token) return null;
    return getStore({ name: 'home-search', siteID, token });
  }
}

// --- Multi-source home search configuration ---

const SEARCH_LIMITS = {
  minPrice: 350000,
  maxPrice: 1500000,
  minBeds: 3,
};

async function fetchListingsFromSources() {
  const checkedAt = new Date().toISOString();
  const sources = [];
  const batches = [];

  const idx = await fetchIdxListings(checkedAt);
  if (idx.configured) {
    sources.push({
      name: 'idx',
      label: 'IDX / MLS feed',
      configured: true,
      count: idx.listings.length,
      error: idx.error || null,
    });
    batches.push(...idx.listings);
  } else {
    sources.push({
      name: 'idx',
      label: 'IDX / MLS feed',
      configured: false,
      count: 0,
      error: 'Set HOME_SEARCH_IDX_FEED_URL to enable primary MLS/IDX ingestion.',
    });
  }

  const redfin = await fetchRedfinListings(checkedAt);
  sources.push({
    name: 'redfin',
    label: 'Redfin public search',
    configured: true,
    count: redfin.listings.length,
    error: redfin.error || null,
  });
  batches.push(...redfin.listings);

  const listings = dedupeListings(batches);
  const sourceCounts = listings.reduce((acc, listing) => {
    acc[listing.source] = (acc[listing.source] || 0) + 1;
    return acc;
  }, {});
  const hasIdxListings = listings.some((listing) => listing.source === 'idx');

  return {
    listings: sortListings(listings),
    sources,
    sourceCounts,
    preferredSource: hasIdxListings ? 'idx' : 'redfin',
    sourceLabel: hasIdxListings
      ? 'IDX / MLS primary with Redfin fallback'
      : 'Redfin public search fallback; IDX / MLS not yet configured',
  };
}

async function fetchIdxListings(checkedAt) {
  const feedUrl = process.env.HOME_SEARCH_IDX_FEED_URL || '';
  if (!feedUrl) return { configured: false, listings: [] };

  try {
    const headers = { Accept: 'application/json' };
    if (process.env.HOME_SEARCH_IDX_FEED_TOKEN) {
      headers.Authorization = `Bearer ${process.env.HOME_SEARCH_IDX_FEED_TOKEN}`;
    }
    const response = await fetch(feedUrl, { headers });
    if (!response.ok) throw new Error(`IDX feed returned ${response.status}`);
    const payload = await response.json();
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.listings)
        ? payload.listings
        : Array.isArray(payload.data)
          ? payload.data
          : [];
    const listings = rows
      .map((row) => mapIdxListing(row, checkedAt))
      .filter(Boolean)
      .filter(matchesSearchLimits);
    return { configured: true, listings };
  } catch (error) {
    console.warn('[home-search-refresh] IDX feed failed:', error.message);
    return { configured: true, listings: [], error: error.message };
  }
}

function mapIdxListing(row, checkedAt) {
  const source = row && typeof row === 'object' ? row : {};
  const mlsId = firstString(source.mlsId, source.mlsNumber, source.listingId, source.id);
  const street = firstString(source.street, source.streetAddress, source.address, source.addressLine1);
  const city = firstString(source.city, 'Fresno');
  const state = firstString(source.state, 'CA');
  const zip = firstString(source.zip, source.postalCode, source.postcode);
  const address = firstString(
    source.fullAddress,
    [street, city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  );
  if (!address) return null;

  const lat = firstNumber(source.lat, source.latitude, source.geo?.lat, source.location?.lat);
  const lon = firstNumber(source.lng, source.lon, source.longitude, source.geo?.lng, source.location?.lng);
  const area = classifyArea({ latitude: lat, longitude: lon }, zip);
  const remarks = firstString(source.remarks, source.description, source.publicRemarks, source.marketingRemarks).toLowerCase();
  const price = firstNumber(source.price, source.listPrice, source.currentPrice);
  const beds = firstNumber(source.beds, source.bedrooms);
  const baths = firstNumber(source.baths, source.bathrooms);
  const sqft = firstNumber(source.sqft, source.livingArea, source.livingAreaSqft);
  const lotSize = firstNumber(source.lotSize, source.lotSizeSqft, source.lotSqft);
  const yearBuilt = firstNumber(source.yearBuilt);
  const hasPool = /pool/.test(remarks) || Boolean(source.hasPool);
  const isFixer = /fixer|as-is|handyman|tlc|needs work|investor|cosmetic|potential|diamond in the rough/.test(remarks);

  const descParts = [];
  if (beds) descParts.push(`${beds} bed`);
  if (baths) descParts.push(`${baths} bath`);
  if (sqft) descParts.push(`${sqft.toLocaleString()} sqft`);
  if (yearBuilt) descParts.push(`built ${yearBuilt}`);
  if (lotSize >= 20000) descParts.push(`${(lotSize / 43560).toFixed(2)} acres`);
  if (area === 'fresno-high') descParts.push('Fresno High area');
  if (area === 'tower') descParts.push('Tower District');
  if (isFixer) descParts.push('potential fixer-upper');
  if (hasPool) descParts.push('pool');

  return {
    id: `idx-${mlsId || slugify(address)}`,
    mlsId,
    address,
    price,
    beds,
    baths,
    sqft,
    area,
    areaPriority: priorityForArea(area),
    targetArea: isTargetArea(area),
    hasPool,
    isFixer,
    description: descParts.join(', ') + '.',
    listingUrl: firstString(source.url, source.listingUrl, source.detailsUrl),
    imageUrl: firstString(source.imageUrl, source.primaryPhoto, source.photoUrl, source.photos?.[0]?.url, source.photos?.[0]),
    lat,
    lon,
    source: 'idx',
    sourceLabel: 'IDX / MLS',
    sourceCheckedAt: checkedAt,
    addedAt: checkedAt,
  };
}

function firstString() {
  for (const value of arguments) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function firstNumber() {
  for (const value of arguments) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function matchesSearchLimits(listing) {
  return (
    listing.price >= SEARCH_LIMITS.minPrice &&
    listing.price <= SEARCH_LIMITS.maxPrice &&
    listing.beds >= SEARCH_LIMITS.minBeds
  );
}

function dedupeListings(listings) {
  const byKey = new Map();
  listings.forEach((listing) => {
    const key = listing.mlsId
      ? `mls:${String(listing.mlsId).toLowerCase()}`
      : `address:${normalizeAddress(listing.address)}`;
    const existing = byKey.get(key);
    if (!existing || sourceRank(listing.source) > sourceRank(existing.source)) {
      byKey.set(key, existing ? mergeListing(existing, listing) : listing);
    }
  });
  return Array.from(byKey.values());
}

function mergeListing(existing, preferred) {
  return {
    ...existing,
    ...preferred,
    addedAt: existing.addedAt || preferred.addedAt,
    alternateSources: Array.from(new Set([existing.source, preferred.source].filter(Boolean))),
  };
}

function sourceRank(source) {
  return source === 'idx' ? 3 : source === 'redfin' ? 2 : 1;
}

function normalizeAddress(address) {
  return String(address || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function slugify(value) {
  return normalizeAddress(value).replace(/\s+/g, '-').slice(0, 80);
}

function sortListings(listings) {
  return [...listings].sort((a, b) => {
    const priorityDelta = (b.areaPriority || 0) - (a.areaPriority || 0);
    if (priorityDelta) return priorityDelta;
    const sourceDelta = sourceRank(b.source) - sourceRank(a.source);
    if (sourceDelta) return sourceDelta;
    return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
  });
}

function isTargetArea(area) {
  return area === 'fresno-high' || area === 'tower';
}

function priorityForArea(area) {
  if (isTargetArea(area)) return 2;
  if (area === 'old-fig') return 1;
  return 0;
}

// --- Redfin search configuration ---

// Zip-to-area mapping for categorization
const ZIP_AREA_MAP = {
  '93728': 'tower',
  '93704': 'fresno-high',
  '93711': 'old-fig',
  '93705': 'old-fig',
  '93706': 'sunnyside',
  '93727': 'sunnyside',
  '93654': 'rural', // Reedley
  '93602': 'rural', // Auberry
  '93234': 'rural', // Huron
  '93737': 'rural',
  '93631': 'rural', // Kingsburg
  '93242': 'rural', // Laton
  '93657': 'rural', // Sanger
};

// Search polygons covering target areas in Fresno County
// Each polygon is a viewport bounding box: west lat_south, east lat_south, east lat_north, west lat_north, close
const SEARCH_POLYGONS = [
  {
    name: 'Fresno High / Old Fig',
    // Palm, Van Ness, Fresno High, and nearby Old Fig corridors
    poly: '-119.835 36.748,-119.770 36.748,-119.770 36.790,-119.835 36.790,-119.835 36.748',
  },
  {
    name: 'Tower District',
    // Tower District and adjacent 93728 blocks
    poly: '-119.835 36.725,-119.780 36.725,-119.780 36.765,-119.835 36.765,-119.835 36.725',
  },
  {
    name: 'Fresno City',
    // Covers the entire Fresno city limits (OSM bounds)
    poly: '-119.985 36.633,-119.603 36.633,-119.603 36.924,-119.985 36.924,-119.985 36.633',
  },
  {
    name: 'East/Rural Fresno County',
    // Covers Reedley, Sanger, Auberry, east Fresno
    poly: '-119.68 36.55,-119.25 36.55,-119.25 37.10,-119.68 37.10,-119.68 36.55',
  },
  {
    name: 'West/South Rural',
    // Covers Huron, Laton, Kingsburg, west county
    poly: '-120.20 36.20,-119.68 36.20,-119.68 36.68,-120.20 36.68,-120.20 36.20',
  },
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.redfin.com/',
};

async function fetchRedfinListings(checkedAt) {
  const allListings = [];
  let error = null;

  for (const search of SEARCH_POLYGONS) {
    try {
      const homes = await searchRedfinPoly(search.poly);
      const mapped = homes
        .filter(
          (h) =>
            h.propertyId &&
            h.uiPropertyType <= 3 && // houses, condos, townhouses
            (h.price?.value || 0) >= 350000 &&
            (h.price?.value || 0) <= 1500000 &&
            (h.beds || 0) >= 3
        )
        .map((home) => mapRedfinHome(home, checkedAt));
      allListings.push(...mapped);
      // Polite delay between requests
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      error = err.message;
      console.warn(`[home-search-refresh] Failed ${search.name}:`, err.message);
    }
  }
  return { listings: dedupeListings(allListings), error };
}

async function searchRedfinPoly(poly) {
  const params = new URLSearchParams({
    al: '1',
    include_nearby_homes: 'false',
    market: 'fresno',
    num_homes: '100',
    ord: 'redfin-recommended-asc',
    page_number: '1',
    poly,
    sf: '1,2,3,5,6,7',
    status: '9', // for sale
    uipt: '1,2,3', // house, condo, townhouse
    v: '8',
    min_price: '350000',
    max_price: '1500000',
    min_beds: '3',
  });

  const url = `https://www.redfin.com/stingray/api/gis?${params.toString()}`;
  const res = await fetch(url, { headers: HEADERS });

  if (!res.ok) {
    throw new Error(`Redfin returned ${res.status}`);
  }

  const text = await res.text();
  // Redfin wraps JSON in {}&&{...} prefix
  const jsonStr = text.replace(/^{}&&/, '');
  const data = JSON.parse(jsonStr);

  return data.payload?.homes || [];
}

function mapRedfinHome(home, checkedAt) {
  const zip = home.zip || home.postalCode?.value || '';
  const area = classifyArea(home, zip);
  const remarks = (home.listingRemarks || '').toLowerCase();
  const tags = (home.listingTags || []).map((t) => t.toLowerCase());

  const isFixer =
    /fixer|as-is|handyman|tlc|needs work|investor|cosmetic|potential|diamond in the rough/.test(
      remarks
    );
  const hasPool =
    /pool/.test(remarks) || tags.some((t) => t.includes('pool')) || home.skPoolType === 0;

  const city = home.city || '';
  const state = home.state || 'CA';
  const street = home.streetLine?.value || '';
  const address = [street, city, `${state} ${zip}`].filter(Boolean).join(', ');

  const descParts = [];
  if (home.beds) descParts.push(`${home.beds} bed`);
  if (home.baths) descParts.push(`${home.baths} bath`);
  if (home.sqFt?.value) descParts.push(`${home.sqFt.value.toLocaleString()} sqft`);
  if (home.yearBuilt?.value) descParts.push(`built ${home.yearBuilt.value}`);
  if (home.lotSize?.value >= 20000)
    descParts.push(`${(home.lotSize.value / 43560).toFixed(2)} acres`);
  if (city && city !== 'Fresno') descParts.push(city);
  if (area === 'fresno-high') descParts.push('Fresno High area');
  if (area === 'tower') descParts.push('Tower District');
  if (isFixer) descParts.push('potential fixer-upper');
  if (hasPool) descParts.push('pool');

  const imageUrl = buildRedfinImageUrl(home);

  return {
    id: `rf-${home.propertyId}`,
    address,
    price: home.price?.value || 0,
    beds: home.beds || 0,
    baths: home.baths || 0,
    sqft: home.sqFt?.value || 0,
    area,
    mlsId: String(home.mlsId?.value || '').trim(),
    areaPriority: priorityForArea(area),
    targetArea: isTargetArea(area),
    hasPool,
    isFixer,
    description: descParts.join(', ') + '.',
    listingUrl: home.url ? `https://www.redfin.com${home.url}` : '',
    imageUrl,
    source: 'redfin',
    sourceLabel: 'Redfin',
    sourceCheckedAt: checkedAt,
    addedAt: checkedAt,
  };
}

function classifyArea(home, zip) {
  const lon = Number(
    home.latLong?.value?.longitude ??
    home.latLong?.longitude ??
    home.longitude ??
    home.centroid?.longitude
  );
  const lat = Number(
    home.latLong?.value?.latitude ??
    home.latLong?.latitude ??
    home.latitude ??
    home.centroid?.latitude
  );

  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    if (inBox(lat, lon, 36.725, 36.765, -119.835, -119.780)) return 'tower';
    if (inBox(lat, lon, 36.748, 36.790, -119.835, -119.770)) return 'fresno-high';
  }

  return ZIP_AREA_MAP[zip] || 'other';
}

function inBox(lat, lon, south, north, west, east) {
  return lat >= south && lat <= north && lon >= west && lon <= east;
}

function buildRedfinImageUrl(home) {
  if (home.primaryPhotoDisplayLevel !== 1 || !home.photos?.value) {
    return '';
  }

  const mlsId = String(home.mlsId?.value || '').trim();
  if (!mlsId) {
    return '';
  }

  const dataSourceId = home.dataSourceId || 123;
  const shard = mlsId.slice(-3).padStart(3, '0');
  const format = home.photoFormat || 'webp';

  return `https://ssl.cdn-redfin.com/photo/${dataSourceId}/islphoto/${shard}/genIslnoResize.${mlsId}_0.${format}`;
}
