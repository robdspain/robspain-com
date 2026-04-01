const { schedule } = require('@netlify/functions');
const { getStore } = require('@netlify/blobs');

// Twice daily: 7am and 6pm Pacific (14:00 and 01:00 UTC during PDT)
module.exports.handler = schedule('0 14,1 * * *', async (event) => {
  console.log('[home-search-refresh] Starting scheduled refresh', new Date().toISOString());

  const store = getBlobStore();
  if (!store) {
    console.error('[home-search-refresh] Storage not configured');
    return { statusCode: 500 };
  }

  try {
    const listings = await fetchRedfinListings();
    if (!listings || listings.length === 0) {
      console.warn('[home-search-refresh] No listings returned, skipping update');
      return { statusCode: 200 };
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
        source: 'Redfin - Fresno County (auto)',
      })
    );

    console.log(`[home-search-refresh] Updated ${merged.length} listings`);
    return { statusCode: 200 };
  } catch (err) {
    console.error('[home-search-refresh] Error:', err.message || err);
    return { statusCode: 500 };
  }
});

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

// --- Redfin search configuration ---

// Zip-to-area mapping for categorization
const ZIP_AREA_MAP = {
  '93711': 'old-fig',
  '93704': 'old-fig',
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
    name: 'Fresno City',
    // Covers central Fresno including Old Fig, Sunnyside, and general areas
    poly: '-119.92 36.68,-119.68 36.68,-119.68 36.84,-119.92 36.84,-119.92 36.68',
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

async function fetchRedfinListings() {
  const allListings = [];

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
        .map(mapRedfinHome);
      allListings.push(...mapped);
      // Polite delay between requests
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      console.warn(`[home-search-refresh] Failed ${search.name}:`, err.message);
    }
  }

  // Deduplicate by listing id
  const seen = new Set();
  const unique = [];
  for (const listing of allListings) {
    if (!seen.has(listing.id)) {
      seen.add(listing.id);
      unique.push(listing);
    }
  }

  return unique;
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

function mapRedfinHome(home) {
  const zip = home.zip || home.postalCode?.value || '';
  const area = ZIP_AREA_MAP[zip] || 'other';
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
  if (isFixer) descParts.push('potential fixer-upper');
  if (hasPool) descParts.push('pool');

  // Build image URL from Redfin's photo CDN
  let imageUrl = '';
  if (home.primaryPhotoDisplayLevel === 1 && home.photos?.value) {
    const propertyId = home.propertyId;
    const listingId = home.listingId;
    if (listingId) {
      imageUrl = `https://ssl.cdn-redfin.com/photo/123/islphoto/${String(listingId).slice(-3)}/genIslnoResize.${String(listingId).slice(-6)}_0.webp`;
    }
  }

  return {
    id: `rf-${home.propertyId}`,
    address,
    price: home.price?.value || 0,
    beds: home.beds || 0,
    baths: home.baths || 0,
    sqft: home.sqFt?.value || 0,
    area,
    hasPool,
    isFixer,
    description: descParts.join(', ') + '.',
    listingUrl: home.url ? `https://www.redfin.com${home.url}` : '',
    imageUrl,
    addedAt: new Date().toISOString(),
  };
}
