const { getStore } = require('@netlify/blobs');
const fallbackWeeks = require('../../_data/contentCalendar.json');

function headers() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };
}

function getBlobStore() {
  try {
    return getStore('admin-data');
  } catch (error) {
    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_TOKEN || process.env.NETLIFY_API_TOKEN;
    if (!siteID || !token) return null;
    return getStore({ name: 'admin-data', siteID, token });
  }
}

exports.handler = async (event) => {
  const h = headers();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: h, body: '' };
  }

  const store = getBlobStore();

  if (event.httpMethod === 'GET') {
    if (!store) {
      return { statusCode: 200, headers: h, body: JSON.stringify({ weeks: fallbackWeeks, source: 'static' }) };
    }

    try {
      const blob = await store.get('content-calendar');
      if (!blob) {
        return { statusCode: 200, headers: h, body: JSON.stringify({ weeks: fallbackWeeks, source: 'static' }) };
      }
      const parsed = JSON.parse(blob);
      return { statusCode: 200, headers: h, body: JSON.stringify({ weeks: parsed.weeks || fallbackWeeks, source: 'blob' }) };
    } catch (error) {
      return { statusCode: 200, headers: h, body: JSON.stringify({ weeks: fallbackWeeks, source: 'static' }) };
    }
  }

  if (event.httpMethod === 'PUT') {
    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (error) {
      return { statusCode: 400, headers: h, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    if (!payload || !Array.isArray(payload.weeks)) {
      return { statusCode: 400, headers: h, body: JSON.stringify({ error: 'Expected payload shape: { weeks: [] }' }) };
    }

    if (!store) {
      return { statusCode: 202, headers: h, body: JSON.stringify({ success: true, persisted: false, note: 'Blob store not configured; client localStorage still holds state.' }) };
    }

    try {
      await store.set('content-calendar', JSON.stringify({ weeks: payload.weeks }));
      return { statusCode: 200, headers: h, body: JSON.stringify({ success: true, persisted: true }) };
    } catch (error) {
      return { statusCode: 500, headers: h, body: JSON.stringify({ error: String(error) }) };
    }
  }

  return { statusCode: 405, headers: h, body: JSON.stringify({ error: 'Method not allowed' }) };
};
