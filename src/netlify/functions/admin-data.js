const { getStore } = require('@netlify/blobs');

const VALID_KEYS = ['agent-activity', 'tasks', 'blockers'];

const EMPTY_FALLBACKS = {
  'agent-activity': {
    lastUpdated: null,
    agents: {},
    recentActivity: [],
    blockedQueue: [],
    meta: {
      source: 'empty-fallback',
      reason: 'Netlify Blobs is not configured for this deployment',
    },
  },
  tasks: {
    lastUpdated: null,
    tasks: [],
    meta: {
      source: 'empty-fallback',
      reason: 'Netlify Blobs is not configured for this deployment',
    },
  },
  blockers: {
    lastUpdated: null,
    blockers: [],
    meta: {
      source: 'empty-fallback',
      reason: 'Netlify Blobs is not configured for this deployment',
    },
  },
};

function response(statusCode, headers, payload, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...headers, ...extraHeaders },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  };
}

function getFallback(key, reason) {
  return {
    ...EMPTY_FALLBACKS[key],
    lastUpdated: new Date().toISOString(),
    meta: {
      ...EMPTY_FALLBACKS[key].meta,
      reason,
    },
  };
}

function openAdminStore() {
  try {
    return { store: getStore('admin-data'), error: null };
  } catch (e) {
    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_TOKEN || process.env.NETLIFY_API_TOKEN;
    if (!siteID || !token) {
      return { store: null, error: 'Netlify Blobs is not configured for this deployment' };
    }
    try {
      return { store: getStore({ name: 'admin-data', siteID, token }), error: null };
    } catch (configError) {
      return { store: null, error: `Netlify Blobs configuration failed: ${configError.message}` };
    }
  }
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const key = event.queryStringParameters?.key;

  if (!key || !VALID_KEYS.includes(key)) {
    return response(400, headers, { error: `Invalid key. Valid: ${VALID_KEYS.join(', ')}` });
  }

  const { store, error } = openAdminStore();

  if (event.httpMethod === 'GET') {
    if (!store) {
      return response(200, headers, getFallback(key, error), { 'X-Admin-Data-Source': 'empty-fallback' });
    }

    try {
      const data = await store.get(key);
      if (!data) {
        return response(200, headers, getFallback(key, 'No blob record exists for this key yet'), { 'X-Admin-Data-Source': 'empty-fallback' });
      }
      return response(200, headers, data, { 'X-Admin-Data-Source': 'netlify-blobs' });
    } catch (e) {
      return response(200, headers, getFallback(key, e.message || 'Failed to read Netlify Blobs data'), { 'X-Admin-Data-Source': 'empty-fallback' });
    }
  }

  if (event.httpMethod === 'PUT') {
    const adminToken = process.env.ADMIN_API_TOKEN;
    const auth = event.headers.authorization || event.headers.Authorization;
    if (!adminToken || auth !== `Bearer ${adminToken}`) {
      return response(401, headers, { error: 'Unauthorized' });
    }
    if (!store) {
      return response(503, headers, { error });
    }
    try {
      await store.set(key, event.body || '{}');
      return response(200, headers, { success: true, key });
    } catch (e) {
      return response(500, headers, { error: String(e) });
    }
  }

  return response(405, headers, { error: 'Method not allowed' });
};
