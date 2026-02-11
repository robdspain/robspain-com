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
    const { agentId, instruction, token } = body;

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
    if (!agentId || !instruction) {
      return new Response(JSON.stringify({ error: 'Missing agentId or instruction' }), {
        status: 400,
        headers,
      });
    }

    // Store instruction in Netlify Blobs
    const store = getStore('agent-data');
    const key = `agent-instructions-${agentId}`;

    // Get existing instructions or create new array
    let instructions = [];
    try {
      const existing = await store.get(key, { type: 'json' });
      if (existing) {
        instructions = existing;
      }
    } catch (err) {
      // No existing data, start fresh
    }

    // Add new instruction with timestamp
    const newInstruction = {
      id: Date.now().toString(),
      instruction: instruction.trim(),
      timestamp: new Date().toISOString(),
      processed: false,
    };

    instructions.push(newInstruction);

    // Save back to blob storage
    await store.setJSON(key, instructions);

    return new Response(
      JSON.stringify({
        ok: true,
        queued: true,
        instructionId: newInstruction.id,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('agent-instruct error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers }
    );
  }
};
