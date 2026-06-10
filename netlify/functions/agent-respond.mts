import { getStore } from '@netlify/blobs';

const ADMIN_TOKEN = '8ebd24bbfa5d0c4fb2cc069c475ee1b80c42368292ea269346ff7060fa09109b';

export default async (req: Request) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  try {
    const body = await req.json();
    const { agentId, message, from, instructionId, token } = body;

    // Validate token (check both body and Authorization header)
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
    if (!agentId || !message) {
      return new Response(JSON.stringify({ error: 'Missing agentId or message' }), {
        status: 400,
        headers,
      });
    }

    // Store response in Netlify Blobs
    const store = getStore('agent-data');
    const key = `agent-responses-${agentId}`;

    // Get existing responses or create new array
    let responses = [];
    try {
      const existing = await store.get(key, { type: 'json' });
      if (existing) {
        responses = existing;
      }
    } catch (err) {
      // No existing responses, start fresh
    }

    // Add new response with timestamp
    const newResponse = {
      id: Date.now().toString(),
      message: message.trim(),
      from: from || 'Neo',
      timestamp: new Date().toISOString(),
      instructionId: instructionId || null,
    };

    responses.push(newResponse);

    // Keep only last 50 responses to avoid bloat
    if (responses.length > 50) {
      responses = responses.slice(-50);
    }

    // Save back to blob storage
    await store.setJSON(key, responses);

    // Optionally mark the instruction as processed
    if (instructionId) {
      const instructionsKey = `agent-instructions-${agentId}`;
      try {
        const instructions = await store.get(instructionsKey, { type: 'json' });
        if (instructions && Array.isArray(instructions)) {
          const updated = instructions.map((inst: any) => {
            if (inst.id === instructionId) {
              return { ...inst, processed: true };
            }
            return inst;
          });
          await store.setJSON(instructionsKey, updated);
        }
      } catch (err) {
        // Instruction not found or error - not critical
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        responseId: newResponse.id,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('agent-respond error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers }
    );
  }
};
