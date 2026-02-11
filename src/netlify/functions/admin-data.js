const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const key = event.queryStringParameters?.key;
  const validKeys = ['agent-activity', 'tasks', 'blockers'];

  if (!key || !validKeys.includes(key)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid key. Valid: ${validKeys.join(', ')}` }) };
  }

  // Use Netlify Blobs with explicit config for deploy context
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (!siteID || !token) {
    // Blobs not configured — return 404 so client falls back to static JSON
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Blobs not configured' }) };
  }

  const store = getStore({ name: 'admin-data', siteID, token });

  if (event.httpMethod === 'GET') {
    try {
      const data = await store.get(key);
      if (!data) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      }
      return { statusCode: 200, headers, body: data };
    } catch (e) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
    }
  }

  if (event.httpMethod === 'PUT') {
    const adminToken = process.env.ADMIN_API_TOKEN;
    const auth = event.headers.authorization || event.headers.Authorization;
    if (!adminToken || auth !== `Bearer ${adminToken}`) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    try {
      await store.set(key, event.body);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, key }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: String(e) }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};
