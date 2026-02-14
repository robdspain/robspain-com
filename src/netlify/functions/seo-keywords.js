const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Use Netlify Blobs with explicit config for deploy context
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (!siteID || !token) {
    // Blobs not configured - return empty array for GET, error for POST
    if (event.httpMethod === 'GET') {
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ keywords: [] }) 
      };
    }
    return { 
      statusCode: 503, 
      headers, 
      body: JSON.stringify({ error: 'Blobs not configured' }) 
    };
  }

  const store = getStore({ name: 'seo-keywords', siteID, token });

  if (event.httpMethod === 'GET') {
    try {
      const data = await store.get('keywords');
      if (!data) {
        return { 
          statusCode: 200, 
          headers, 
          body: JSON.stringify({ keywords: [] }) 
        };
      }
      return { statusCode: 200, headers, body: data };
    } catch (e) {
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ keywords: [] }) 
      };
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      
      if (!body.keywords || !Array.isArray(body.keywords)) {
        return { 
          statusCode: 400, 
          headers, 
          body: JSON.stringify({ error: 'Invalid request: keywords array required' }) 
        };
      }

      // Validate keyword structure
      const validatedKeywords = body.keywords.map(kw => ({
        keyword: String(kw.keyword || ''),
        targetPage: String(kw.targetPage || ''),
        rank: kw.rank ? parseInt(kw.rank) : null,
        volume: kw.volume ? parseInt(kw.volume) : null,
        lastChecked: kw.lastChecked || new Date().toISOString()
      }));

      const dataToStore = JSON.stringify({ keywords: validatedKeywords });
      await store.set('keywords', dataToStore);

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ success: true, count: validatedKeywords.length }) 
      };
    } catch (e) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: String(e) }) 
      };
    }
  }

  return { 
    statusCode: 405, 
    headers, 
    body: JSON.stringify({ error: 'Method not allowed' }) 
  };
};
