const { getStore } = require('@netlify/blobs');

const EMPTY_ACCOUNTING = {
  activeEntity: 'behavior-school',
  defaultFrappeAccount: 'Expenses',
  reviewQueue: [],
  importedFiles: [],
  importRuns: [],
  frappeRuns: [],
  vendorRules: [],
  frappeSettings: {
    company: '',
    defaultBankAccount: '',
    defaultRevenueAccount: 'Sales',
    defaultExpenseAccount: 'Expenses',
    categoryAccountMap: defaultCategoryAccountMap(),
  },
  cpaNotes: 'Export this package monthly. CPA should confirm entity treatment before business/personal split is finalized.',
  lastSyncedAt: null,
  meta: {
    source: 'empty-fallback',
    reason: 'No accounting blob has been saved yet.',
  },
};

function defaultCategoryAccountMap(settings = {}) {
  const revenue = settings.defaultRevenueAccount || 'Sales';
  const expense = settings.defaultExpenseAccount || 'Expenses';
  return {
    Sales: revenue,
    'Software and subscriptions': 'Software and subscriptions',
    'Merchant fees': 'Bank charges / merchant fees',
    'Advertising and marketing': 'Advertising and marketing',
    'Contract labor': 'Contract labor',
    'Office supplies': 'Office supplies',
    'Taxes and licenses': 'Taxes and licenses',
    Utilities: 'Utilities',
    'Transfer or debt payment': 'Balance sheet / review',
    'Meals or personal review': 'Meals / personal review',
    Uncategorized: expense,
    'Personal / exclude': 'Owner draw / personal',
    'Document needs OCR': 'Document review',
  };
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
}

function response(statusCode, payload, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...headers(), ...extraHeaders },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  };
}

function getBlobStore() {
  try {
    return { store: getStore('admin-data'), error: null };
  } catch (error) {
    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_TOKEN || process.env.NETLIFY_API_TOKEN;
    if (!siteID || !token) {
      return { store: null, error: 'Netlify Blobs is not configured for this deployment.' };
    }
    try {
      return { store: getStore({ name: 'admin-data', siteID, token }), error: null };
    } catch (configError) {
      return { store: null, error: `Netlify Blobs configuration failed: ${configError.message}` };
    }
  }
}

function fallback(reason) {
  return {
    ...EMPTY_ACCOUNTING,
    lastSyncedAt: new Date().toISOString(),
    meta: {
      ...EMPTY_ACCOUNTING.meta,
      reason,
    },
  };
}

function validateAccounting(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Expected JSON object payload.';
  }
  if (!['behavior-school', 'rob-spain', 'household'].includes(payload.activeEntity)) {
    return 'Invalid activeEntity.';
  }
  if (typeof payload.defaultFrappeAccount !== 'string' || !payload.defaultFrappeAccount.trim()) {
    return 'defaultFrappeAccount is required.';
  }
  if (!Array.isArray(payload.reviewQueue)) {
    return 'reviewQueue must be an array.';
  }
  if (!Array.isArray(payload.importedFiles)) {
    return 'importedFiles must be an array.';
  }
  if (payload.importRuns && !Array.isArray(payload.importRuns)) {
    return 'importRuns must be an array when provided.';
  }
  if (payload.frappeRuns && !Array.isArray(payload.frappeRuns)) {
    return 'frappeRuns must be an array when provided.';
  }
  if (payload.vendorRules && !Array.isArray(payload.vendorRules)) {
    return 'vendorRules must be an array when provided.';
  }
  if (payload.frappeSettings && typeof payload.frappeSettings !== 'object') {
    return 'frappeSettings must be an object when provided.';
  }
  if (payload.reviewQueue.length > 10000) {
    return 'reviewQueue is too large for a single admin blob.';
  }
  for (const row of payload.reviewQueue) {
    if (!row || typeof row !== 'object') return 'Each reviewQueue row must be an object.';
    if (typeof row.description !== 'string' || !row.description.trim()) return 'Each row needs a description.';
    if (typeof row.amount !== 'number' || !Number.isFinite(row.amount)) return 'Each row needs a numeric amount.';
    if (typeof row.date !== 'string' || !row.date.trim()) return 'Each row needs a date.';
  }
  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers(), body: '' };
  }

  const { store, error } = getBlobStore();
  const blobKey = 'accounting-hub';

  if (event.httpMethod === 'GET') {
    if (!store) {
      return response(200, fallback(error), { 'X-Accounting-Data-Source': 'empty-fallback' });
    }

    try {
      const raw = await store.get(blobKey);
      if (!raw) {
        return response(200, fallback('No accounting-hub blob exists yet.'), { 'X-Accounting-Data-Source': 'empty-fallback' });
      }
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return response(200, {
        ...EMPTY_ACCOUNTING,
        ...parsed,
        frappeSettings: {
          ...EMPTY_ACCOUNTING.frappeSettings,
          ...(parsed.frappeSettings || {}),
          categoryAccountMap: {
            ...defaultCategoryAccountMap(parsed.frappeSettings || {}),
            ...(parsed.frappeSettings?.categoryAccountMap || {}),
          },
        },
        meta: { source: 'netlify-blobs' },
      }, { 'X-Accounting-Data-Source': 'netlify-blobs' });
    } catch (readError) {
      return response(200, fallback(readError.message || 'Failed to read accounting blob.'), { 'X-Accounting-Data-Source': 'empty-fallback' });
    }
  }

  if (event.httpMethod === 'PUT') {
    const adminToken = process.env.ADMIN_API_TOKEN;
    const auth = event.headers.authorization || event.headers.Authorization;
    if (adminToken && auth !== `Bearer ${adminToken}`) {
      return response(401, { error: 'Unauthorized' });
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return response(400, { error: 'Invalid JSON payload.' });
    }

    const validationError = validateAccounting(payload);
    if (validationError) {
      return response(400, { error: validationError });
    }

    const body = {
      activeEntity: payload.activeEntity,
      defaultFrappeAccount: payload.defaultFrappeAccount,
      reviewQueue: payload.reviewQueue,
      importedFiles: payload.importedFiles,
      importRuns: (payload.importRuns || []).slice(0, 100),
      frappeRuns: (payload.frappeRuns || []).slice(0, 100),
      vendorRules: (payload.vendorRules || []).slice(0, 250),
      frappeSettings: {
        ...EMPTY_ACCOUNTING.frappeSettings,
        ...(payload.frappeSettings || {}),
        categoryAccountMap: {
          ...defaultCategoryAccountMap(payload.frappeSettings || {}),
          ...(payload.frappeSettings?.categoryAccountMap || {}),
        },
      },
      cpaNotes: payload.cpaNotes || EMPTY_ACCOUNTING.cpaNotes,
      lastSyncedAt: new Date().toISOString(),
    };

    if (!store) {
      return response(202, {
        success: true,
        persisted: false,
        note: error || 'Blob store unavailable; browser localStorage still holds the accounting queue.',
        accounting: body,
      });
    }

    try {
      await store.set(blobKey, JSON.stringify(body));
      return response(200, { success: true, persisted: true, accounting: body });
    } catch (writeError) {
      return response(500, { error: String(writeError) });
    }
  }

  return response(405, { error: 'Method not allowed' });
};
