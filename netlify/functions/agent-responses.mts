import { getStore } from '@netlify/blobs';

const ADMIN_TOKEN = '8ebd24bbfa5d0c4fb2cc069c475ee1b80c42368292ea269346ff7060fa09109b';

export default async (req: Request) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Only GET allowed
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');
    const token = url.searchParams.get('token');

    // Validate token (check both query param and Authorization header)
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.replace('Bearer ', '');
    const providedToken = token || bearerToken;

    if (providedToken !== ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers,
      });
    }

    // Validate input
    if (!agentId) {
      return new Response(JSON.stringify({ error: 'Missing agentId' }), {
        status: 400,
        headers,
      });
    }

    // Retrieve responses from Netlify Blobs
    const store = getStore('agent-data');
    const key = `agent-responses-${agentId}`;

    let responses = [];
    try {
      const data = await store.get(key, { type: 'json' });
      if (data) {
        responses = data;
      }
    } catch (err) {
      // No responses yet
    }

    return new Response(
      JSON.stringify({
        ok: true,
        agentId,
        responses,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('agent-responses error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers }
    );
  }
};
