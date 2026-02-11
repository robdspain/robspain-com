const { getStore } = require('@netlify/blobs');

// Simple admin data API - stores/retrieves JSON blobs
// GET  /.netlify/functions/admin-data?key=agent-activity → returns JSON
// PUT  /.netlify/functions/admin-data?key=agent-activity → stores JSON
// Auth: Bearer token must match ADMIN_API_TOKEN env var

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
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Invalid key. Valid: ${validKeys.join(', ')}` })
    };
  }

  const store = getStore('admin-data');

  if (event.httpMethod === 'GET') {
    try {
      const data = await store.get(key);
      if (!data) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      }
      return { statusCode: 200, headers, body: data };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: String(e) }) };
    }
  }

  if (event.httpMethod === 'PUT') {
    // Auth check for writes
    const token = process.env.ADMIN_API_TOKEN;
    const auth = event.headers.authorization || event.headers.Authorization;
    if (!token || auth !== `Bearer ${token}`) {
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
