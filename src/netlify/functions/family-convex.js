const crypto = require('crypto');

const ADMIN_COOKIE = 'robspain_admin_session';
const COURT_COOKIE = 'court_compliance_auth';
const KEY_PATTERN = /^[a-zA-Z0-9:_-]{1,120}$/;

function json(statusCode, payload, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  };
}

function parseCookies(header) {
  return Object.fromEntries(
    String(header || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        if (index === -1) return [part, ''];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function adminSign(value) {
  const secret = process.env.ADMIN_AUTH_PASSWORD || process.env.GOOGLE_CLIENT_SECRET || process.env.JWT_SECRET;
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function readAdminSession(event) {
  const cookie = parseCookies(event.headers.cookie || event.headers.Cookie)[ADMIN_COOKIE];
  if (!cookie) return null;
  const [payload, signature] = cookie.split('.');
  if (!payload || !signature || adminSign(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const allowedStr = (process.env.ADMIN_ALLOWED_EMAIL || process.env.ADMIN_AUTH_USER || 'robspain@gmail.com').toLowerCase();
    const allowedList = allowedStr.split(',').map((e) => e.trim()).filter(Boolean);
    if (!session.email || !allowedList.includes(session.email.toLowerCase())) return null;
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

function courtSecret() {
  return process.env.COURT_COMPLIANCE_PASSWORD || process.env.ADMIN_API_TOKEN || '';
}

function readCourtSession(event) {
  const secret = courtSecret();
  if (!secret) return null;
  const cookie = parseCookies(event.headers.cookie || event.headers.Cookie)[COURT_COOKIE];
  if (!cookie) return null;
  const expected = crypto.createHmac('sha256', secret).update('authorized').digest('hex');
  const received = Buffer.from(cookie);
  const expectedBuffer = Buffer.from(expected);
  if (received.length !== expectedBuffer.length) return null;
  return crypto.timingSafeEqual(received, expectedBuffer) ? { email: 'court-compliance' } : null;
}

function readApiTokenSession(event) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  const auth = event.headers.authorization || event.headers.Authorization || '';
  if (!adminToken || auth !== `Bearer ${adminToken}`) return null;
  return { email: 'admin-token' };
}

function readSession(event) {
  return readAdminSession(event) || readCourtSession(event) || readApiTokenSession(event);
}

function convexUrl() {
  return (process.env.FAMILY_CONVEX_URL || '').replace(/\/$/, '');
}

async function convexCall(kind, path, args) {
  const url = convexUrl();
  if (!url) {
    const error = new Error('Family Convex is not configured. Set FAMILY_CONVEX_URL in Netlify.');
    error.statusCode = 503;
    throw error;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.FAMILY_CONVEX_DEPLOY_KEY) headers.Authorization = `Convex ${process.env.FAMILY_CONVEX_DEPLOY_KEY}`;

  const accessToken = process.env.FAMILY_CONVEX_ACCESS_TOKEN;
  if (!accessToken) {
    const error = new Error('Family Convex access token is not configured. Set FAMILY_CONVEX_ACCESS_TOKEN in Netlify.');
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(`${url}/api/${kind}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ path, args: { ...args, accessToken }, format: 'json' }),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { errorMessage: text };
  }

  if (!response.ok || data.status === 'error') {
    const error = new Error(data.errorMessage || data.error || `Convex ${kind} failed`);
    error.statusCode = response.status || 502;
    throw error;
  }

  return data.value;
}

function cleanKey(key) {
  const value = String(key || '').trim();
  return KEY_PATTERN.test(value) ? value : '';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});

  const session = readSession(event);
  if (!session) return json(401, { error: 'Unauthorized' });

  if (event.httpMethod === 'GET') {
    const key = cleanKey(event.queryStringParameters?.key);
    if (!key) return json(400, { error: 'Missing or invalid key' });
    const requireConvex = event.queryStringParameters?.requireConvex === '1';
    const isConvexConfigured = Boolean(convexUrl());
    let convexError = null;

    // 1. Try Convex if configured
    if (isConvexConfigured) {
      try {
        const item = await convexCall('query', 'familyItems:get', { key });
        if (item) return json(200, { key, item, source: 'convex', convexConfigured: true });
      } catch (error) {
        convexError = error;
        if (requireConvex) return json(error.statusCode || 502, { error: error.message, source: 'convex' });
        console.warn('Convex GET failed, falling back to Blobs:', error.message);
      }
    } else if (requireConvex) {
      return json(503, { error: 'Family Convex is not configured. Set FAMILY_CONVEX_URL in Netlify.', source: 'convex' });
    }

    // 2. Fallback to Netlify Blobs
    try {
      const { getStore } = require('@netlify/blobs');
      const store = getStore('admin-kv');
      const item = await store.get(key, { type: 'json' });
      return json(200, {
        key,
        item: item || null,
        source: 'blobs',
        convexConfigured: isConvexConfigured,
        convexError: convexError ? convexError.message : 'FAMILY_CONVEX_URL is not set in Netlify',
      });
    } catch (blobsError) {
      return json(500, { error: blobsError.message });
    }
  }

  if (event.httpMethod === 'PUT') {
    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Invalid JSON payload' });
    }

    const key = cleanKey(payload.key || event.queryStringParameters?.key);
    if (!key) return json(400, { error: 'Missing or invalid key' });
    const requireConvex = Boolean(payload.requireConvex || event.queryStringParameters?.requireConvex === '1');
    const isConvexConfigured = Boolean(convexUrl());
    let convexError = null;

    // 1. Try Convex if configured
    if (isConvexConfigured) {
      try {
        const result = await convexCall('mutation', 'familyItems:put', {
          key,
          value: payload.value,
          updatedBy: session.email,
        });
        return json(200, { success: true, ...result, source: 'convex', convexConfigured: true });
      } catch (error) {
        convexError = error;
        if (requireConvex) return json(error.statusCode || 502, { error: error.message, source: 'convex' });
        console.warn('Convex PUT failed, falling back to Blobs:', error.message);
      }
    } else if (requireConvex) {
      return json(503, { error: 'Family Convex is not configured. Set FAMILY_CONVEX_URL in Netlify.', source: 'convex' });
    }

    // 2. Fallback to Netlify Blobs
    try {
      const { getStore } = require('@netlify/blobs');
      const store = getStore('admin-kv');
      const data = {
        value: payload.value,
        updatedAt: new Date().toISOString(),
        updatedBy: session.email
      };
      await store.setJSON(key, data);
      return json(200, {
        success: true,
        updatedAt: data.updatedAt,
        source: 'blobs',
        convexConfigured: isConvexConfigured,
        convexError: convexError ? convexError.message : 'FAMILY_CONVEX_URL is not set in Netlify',
      });
    } catch (blobsError) {
      return json(500, { error: blobsError.message });
    }
  }

  return json(405, { error: 'Method not allowed' });
};
