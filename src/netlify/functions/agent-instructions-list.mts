import { getStore } from '@netlify/blobs';

const ADMIN_TOKEN = '8ebd24bbfa5d0c4fb2cc069c475ee1b80c42368292ea269346ff7060fa09109b';

// List of all agents
const AGENTS = [
  'Neo', 'Scout', 'Writer', 'Analyst', 'Engineer', 'Planner', 'Browser', 'Docs', 'SEO',
  'BAE SIG', 'KCUSD', 'RobSpain.com', 'BehaviorSchool', 'Study App', 'Pro',
  'Supervision', 'Toolchest', 'VideoGen', 'Learning'
];

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

    // Check all agents for pending instructions
    const store = getStore('agent-data');
    const pending = [];

    for (const agentId of AGENTS) {
      const key = `agent-instructions-${agentId}`;
      
      try {
        const instructions = await store.get(key, { type: 'json' });
        if (instructions && Array.isArray(instructions)) {
          // Filter for unprocessed instructions
          const unprocessed = instructions.filter((inst: any) => !inst.processed);
          
          for (const inst of unprocessed) {
            pending.push({
              agentId,
              instructionId: inst.id,
              instruction: inst.instruction,
              timestamp: inst.timestamp,
            });
          }
        }
      } catch (err) {
        // No instructions for this agent, continue
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        count: pending.length,
        instructions: pending,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('agent-instructions-list error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers }
    );
  }
};
