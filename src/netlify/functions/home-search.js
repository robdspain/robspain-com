const { getStore } = require('@netlify/blobs');

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

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-cache, no-store',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const store = getBlobStore();
  if (!store) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Storage not configured' }) };
  }

  const path = event.path.replace(/^\/api\/home-search\/?/, '');

  // GET /api/home-search — return listings + metadata
  if (event.httpMethod === 'GET') {
    try {
      const [listingsRaw, metaRaw, favoritesRaw] = await Promise.all([
        store.get('listings').catch(() => null),
        store.get('search-meta').catch(() => null),
        store.get('favorites').catch(() => null),
      ]);
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          listings: listingsRaw ? JSON.parse(listingsRaw) : [],
          meta: metaRaw ? JSON.parse(metaRaw) : { lastSearched: null, searchCount: 0 },
          favorites: favoritesRaw ? JSON.parse(favoritesRaw) : [],
        }),
      };
    } catch (e) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ listings: [], meta: { lastSearched: null }, favorites: [] }),
      };
    }
  }

  // PUT /api/home-search — update listings or favorites (auth required)
  if (event.httpMethod === 'PUT') {
    const adminToken = process.env.ADMIN_API_TOKEN;
    const auth = event.headers.authorization || event.headers.Authorization;
    if (!adminToken || auth !== `Bearer ${adminToken}`) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
      const body = JSON.parse(event.body);

      if (body.listings !== undefined) {
        await store.set('listings', JSON.stringify(body.listings));
      }
      if (body.meta !== undefined) {
        await store.set('search-meta', JSON.stringify(body.meta));
      }
      if (body.favorites !== undefined) {
        await store.set('favorites', JSON.stringify(body.favorites));
      }

      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: String(e) }) };
    }
  }

  // DELETE /api/home-search — clear all data (auth required)
  if (event.httpMethod === 'DELETE') {
    const adminToken = process.env.ADMIN_API_TOKEN;
    const auth = event.headers.authorization || event.headers.Authorization;
    if (!adminToken || auth !== `Bearer ${adminToken}`) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
      await Promise.all([
        store.delete('listings'),
        store.delete('search-meta'),
        store.delete('favorites'),
      ]);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: String(e) }) };
    }
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
};
