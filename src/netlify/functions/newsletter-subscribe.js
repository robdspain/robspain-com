const crypto = require('crypto');

const DEFAULT_PORTAL_URL = 'https://behaviorschool.com/#/portal/signup';

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' }, { Allow: 'POST' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, { error: 'Invalid JSON body' });
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const name = String(payload.name || '').trim();
  const source = String(payload.source || 'robspain.com').trim().slice(0, 120);
  const page = String(payload.page || '').trim().slice(0, 300);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Please enter a valid email address.' });
  }

  const ghostUrl = normalizeGhostUrl(process.env.GHOST_ADMIN_API_URL || process.env.GHOST_API_URL || process.env.GHOST_URL);
  const adminKey = process.env.GHOST_ADMIN_API_KEY;
  const portalUrl = process.env.GHOST_PORTAL_SIGNUP_URL || DEFAULT_PORTAL_URL;

  if (!ghostUrl || !adminKey) {
    return json(501, {
      error: 'Newsletter signup is not configured on this site yet.',
      portalUrl,
    });
  }

  let token;
  try {
    token = createGhostToken(adminKey);
  } catch (error) {
    console.error('Ghost token error:', error.message);
    return json(500, { error: 'Newsletter signup is misconfigured.' });
  }

  const member = {
    email,
    labels: [
      { name: 'robspain.com' },
      { name: `source:${source || 'unknown'}` },
    ],
    note: page ? `Subscribed from ${page}` : 'Subscribed from robspain.com',
  };

  if (name) member.name = name;
  if (process.env.GHOST_NEWSLETTER_ID) {
    member.newsletters = [{ id: process.env.GHOST_NEWSLETTER_ID }];
  }

  const endpoint = `${ghostUrl}/ghost/api/admin/members/?send_email=true&email_type=subscribe`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Ghost ${token}`,
        'Content-Type': 'application/json',
        'Accept-Version': process.env.GHOST_API_VERSION || 'v5.0',
      },
      body: JSON.stringify({ members: [member] }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = getGhostError(data);
      if (response.status === 422 && /already|exists|duplicate/i.test(message)) {
        return json(200, {
          ok: true,
          duplicate: true,
          message: 'You are already on the newsletter list.',
        });
      }

      console.error('Ghost member signup failed:', response.status, message);
      return json(response.status, { error: message || 'Unable to subscribe right now.' });
    }

    return json(200, {
      ok: true,
      message: 'Check your email to confirm your subscription.',
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error.message);
    return json(500, { error: 'Unable to subscribe right now.' });
  }
};

function createGhostToken(key) {
  const [id, secret] = key.split(':');
  if (!id || !secret) {
    throw new Error('Ghost Admin API key must be id:secret');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT', kid: id };
  const payload = {
    iat: now,
    exp: now + 5 * 60,
    aud: '/admin/',
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function normalizeGhostUrl(url) {
  if (!url) return '';
  return String(url).trim().replace(/\/$/, '');
}

function getGhostError(data) {
  if (data && Array.isArray(data.errors) && data.errors[0]) {
    return data.errors[0].message || data.errors[0].context || 'Ghost API error';
  }
  return data && data.error ? data.error : '';
}

function json(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders || {}),
    },
    body: JSON.stringify(body),
  };
}
