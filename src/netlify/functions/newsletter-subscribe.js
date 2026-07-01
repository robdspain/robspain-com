const DEFAULT_CONVEX_URL = 'https://quixotic-fox-157.convex.cloud';

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' }, { Allow: 'POST' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const name = String(payload.name || '').trim();
  const source = String(payload.source || 'robspain.com').trim().slice(0, 120);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Please enter a valid email address.' });
  }

  const convexUrl = getConvexUrl();
  if (!convexUrl) {
    return json(503, { error: 'Newsletter database is not configured.' });
  }

  try {
    const response = await fetch(`${convexUrl}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'newsletter:subscribeToNewsletter',
        args: {
          email,
          name: name || undefined,
          source,
          tags: ['robspain.com', 'school-bcba-systems-letter'],
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.error || data?.message || 'Unable to subscribe right now.';
      console.error('Convex newsletter signup failed:', response.status, message);
      return json(response.status, { error: message });
    }

    return json(200, {
      ok: true,
      isNew: data?.value?.isNew ?? true,
      message: data?.value?.isNew === false
        ? 'You are already on the newsletter list.'
        : 'You are in. Watch for the next School BCBA Systems Letter.',
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error.message);
    return json(500, { error: 'Unable to subscribe right now.' });
  }
};

function getConvexUrl() {
  return String(
    process.env.NEWSLETTER_CONVEX_URL ||
    process.env.CONVEX_URL ||
    process.env.NEXT_PUBLIC_CONVEX_URL ||
    DEFAULT_CONVEX_URL
  ).replace(/\/$/, '');
}

function corsHeaders(extraHeaders) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };
}

function json(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: corsHeaders(extraHeaders),
    body: JSON.stringify(body),
  };
}
