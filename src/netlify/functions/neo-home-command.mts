import { getStore } from '@netlify/blobs';

type NeoCommand = {
  id: string;
  command: string;
  source: string;
  person: string;
  device: string;
  href?: string;
  createdAt: string;
  processed: boolean;
  risk: 'safe' | 'review';
};

const JSON_HEADERS = {
  'Access-Control-Allow-Origin': 'https://robspain.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Neo-Home-Key',
  'Content-Type': 'application/json',
};

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

function riskLevel(command: string): 'safe' | 'review' {
  const risky = /\b(unlock|open\s+(garage|door|gate)|buy|purchase|delete|remove|post\s+to|tweet|send\s+(a\s+)?(text|email|message)|announce|drop\s*in)\b/i;
  return risky.test(command) ? 'review' : 'safe';
}

function normalizeText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const expectedKey = process.env.NEO_HOME_COMMAND_KEY || '';
  const providedKey = req.headers.get('X-Neo-Home-Key') || '';

  if (expectedKey && providedKey !== expectedKey) {
    return json(401, { error: 'Unauthorized. Save the private Neo Home access key on this device.' });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const command = normalizeText(body.command, '');
  if (!command) return json(400, { error: 'Missing command' });
  if (command.length > 1600) return json(413, { error: 'Command is too long' });

  const now = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const item: NeoCommand = {
    id,
    command,
    source: normalizeText(body.source, 'manual'),
    person: normalizeText(body.person, 'Rob'),
    device: normalizeText(body.device, 'Web PWA'),
    href: typeof body.href === 'string' ? body.href : undefined,
    createdAt: normalizeText(body.createdAt, now),
    processed: false,
    risk: riskLevel(command),
  };

  const store = getStore('neo-home-commands');
  const queueKey = 'queue-v1';
  let queue: NeoCommand[] = [];

  try {
    const existing = await store.get(queueKey, { type: 'json' });
    if (Array.isArray(existing)) queue = existing as NeoCommand[];
  } catch {
    queue = [];
  }

  queue.unshift(item);
  queue = queue.slice(0, 100);
  await store.setJSON(queueKey, queue);

  return json(202, {
    ok: true,
    mode: item.risk === 'review' ? 'queued-for-review' : 'queued',
    id: item.id,
    risk: item.risk,
  });
};
