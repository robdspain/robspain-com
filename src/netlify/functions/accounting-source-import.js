const { getStore } = require('@netlify/blobs');
const {
  normalizeStatementText,
  normalizeAccountingRow,
  applyVendorRulesToRow,
  normalizeStripeBalanceTransaction,
  normalizeFreshBooksInvoice,
} = require('./accounting-normalize');

const STRIPE_API_VERSION = '2026-02-25.clover';
const ACCOUNTING_BLOB_KEY = 'accounting-hub';
const FRESHBOOKS_API_BASE = 'https://api.freshbooks.com';
const DEFAULT_FRAPPE_SETTINGS = {
  company: '',
  defaultBankAccount: '',
  defaultRevenueAccount: 'Sales',
  defaultExpenseAccount: 'Expenses',
  categoryAccountMap: defaultCategoryAccountMap(),
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

function accountForImportedRow(row, accounting) {
  const settings = accounting.frappeSettings || DEFAULT_FRAPPE_SETTINGS;
  const map = {
    ...defaultCategoryAccountMap(settings),
    ...(settings.categoryAccountMap || {}),
  };
  const incomingFrappeAccount = String(row.frappeAccount || '').trim();
  if (incomingFrappeAccount && !['Sales', 'Expenses'].includes(incomingFrappeAccount)) return incomingFrappeAccount;
  if (map[row.category]) return map[row.category];
  if (Number(row.amount) >= 0) return settings.defaultRevenueAccount || 'Sales';
  return settings.defaultExpenseAccount || accounting.defaultFrappeAccount || 'Expenses';
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
}

function response(statusCode, payload) {
  return {
    statusCode,
    headers: headers(),
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  };
}

function requireAdmin(event) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) return null;
  const auth = event.headers.authorization || event.headers.Authorization;
  return auth === `Bearer ${adminToken}` ? null : response(401, { error: 'Unauthorized' });
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

async function loadAccounting(store) {
  if (!store) return null;
  const raw = await store.get(ACCOUNTING_BLOB_KEY);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

function mergeRows(existingAccounting, incomingRows) {
  const accounting = {
    activeEntity: 'behavior-school',
    defaultFrappeAccount: 'Expenses',
    reviewQueue: [],
    importedFiles: [],
    importRuns: [],
    vendorRules: [],
    frappeSettings: DEFAULT_FRAPPE_SETTINGS,
    cpaNotes: 'Export this package monthly. CPA should confirm entity treatment before business/personal split is finalized.',
    ...(existingAccounting || {}),
  };
  accounting.frappeSettings = {
    ...DEFAULT_FRAPPE_SETTINGS,
    ...(existingAccounting?.frappeSettings || {}),
    categoryAccountMap: {
      ...defaultCategoryAccountMap(existingAccounting?.frappeSettings || {}),
      ...(existingAccounting?.frappeSettings?.categoryAccountMap || {}),
    },
  };

  const byKey = new Map();
  accounting.reviewQueue.forEach((row) => {
    byKey.set(row.importKey || row.id || [row.date, row.description, row.amount].join('|'), row);
  });

  let inserted = 0;
  let skipped = 0;
  incomingRows.forEach((row) => {
    const key = row.importKey || row.id || [row.date, row.description, row.amount].join('|');
    if (byKey.has(key)) {
      skipped += 1;
      return;
    }
    const ruledRow = applyVendorRulesToRow({ ...row }, accounting.vendorRules || []);
    byKey.set(key, {
      ...ruledRow,
      frappeAccount: ruledRow.frappeAccount || accountForImportedRow(ruledRow, accounting),
    });
    inserted += 1;
  });

  accounting.reviewQueue = [...byKey.values()];
  accounting.lastSyncedAt = new Date().toISOString();
  return { accounting, inserted, skipped };
}

function buildImportRun({ source, sourceFile, inserted, skipped, rowCount, persisted, fingerprint, errors }) {
  const now = new Date().toISOString();
  const sourceErrors = Array.isArray(errors) ? errors : [];
  return {
    id: `run_${Date.now()}_${simpleFingerprint([source, sourceFile, inserted, skipped, fingerprint, now].join('|')).slice(4)}`,
    source: source || sourceFile || 'source-import',
    sourceFile: sourceFile || source || '',
    status: sourceErrors.length && inserted > 0 ? 'partial' : (sourceErrors.length ? 'failed' : 'success'),
    inserted: Number(inserted || 0),
    skipped: Number(skipped || 0),
    rowCount: Number(rowCount || 0),
    persisted: Boolean(persisted),
    fingerprint: fingerprint || '',
    errors: sourceErrors,
    startedAt: now,
    finishedAt: now,
  };
}

function simpleFingerprint(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `src_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function sourceFingerprintForRows(sourceName, rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const dates = safeRows.map((row) => String(row.date || '').slice(0, 10)).filter(Boolean).sort();
  const total = safeRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  return simpleFingerprint([
    sourceName || 'source-import',
    safeRows.length,
    total.toFixed(2),
    dates[0] || '',
    dates[dates.length - 1] || '',
  ].join('|'));
}

async function fetchStripeRows(params) {
  const secret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
  if (!secret) {
    return { error: 'STRIPE_SECRET_KEY is not configured.', statusCode: 501 };
  }

  const limit = Math.min(Number(params.limit || 25), 100);
  const url = new URL('https://api.stripe.com/v1/balance_transactions');
  url.searchParams.set('limit', String(limit));
  if (params.starting_after) url.searchParams.set('starting_after', params.starting_after);
  if (params.created_gte) url.searchParams.set('created[gte]', String(params.created_gte));

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${secret}`,
      'Stripe-Version': STRIPE_API_VERSION,
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      error: payload.error?.message || `Stripe API error ${res.status}`,
      statusCode: res.status,
    };
  }

  return {
    rows: (payload.data || []).flatMap((txn) => normalizeStripeBalanceTransaction(txn, {
      defaultEntity: params.entity || 'behavior-school',
      defaultFrappeAccount: params.defaultFrappeAccount || 'Expenses',
    })),
    hasMore: Boolean(payload.has_more),
  };
}

async function freshBooksAccessToken() {
  if (process.env.FRESHBOOKS_ACCESS_TOKEN) {
    return {
      accessToken: process.env.FRESHBOOKS_ACCESS_TOKEN,
      tokenSource: 'access-token',
    };
  }

  return {
    error: 'FreshBooks is not configured. Set FRESHBOOKS_ACCESS_TOKEN and FRESHBOOKS_ACCOUNT_ID. FreshBooks refresh tokens rotate on use, so unattended refresh needs a secure token-persistence workflow before enabling.',
    statusCode: 501,
  };
}

async function fetchFreshBooksRows(params) {
  const accountId = params.accountId || params.account_id || process.env.FRESHBOOKS_ACCOUNT_ID;
  if (!accountId) {
    return { error: 'FRESHBOOKS_ACCOUNT_ID is not configured.', statusCode: 501 };
  }

  const token = await freshBooksAccessToken();
  if (token.error) return token;

  const perPage = Math.min(Number(params.per_page || params.limit || 50), 100);
  const page = Math.max(Number(params.page || 1), 1);
  const url = new URL(`${FRESHBOOKS_API_BASE}/accounting/account/${encodeURIComponent(accountId)}/invoices/invoices`);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('page', String(page));
  if (params.updated_since) url.searchParams.set('updated_since', params.updated_since);
  if (params.search) url.searchParams.set('search[email]', params.search);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      error: payload.error || payload.message || `FreshBooks API error ${res.status}`,
      statusCode: res.status,
    };
  }

  const result = payload.response?.result || {};
  const invoices = result.invoices || result.invoice || [];
  const invoiceList = Array.isArray(invoices) ? invoices : [invoices];
  const paidInvoices = invoiceList.filter((invoice) => {
    const paid = Number(invoice.paid?.amount || invoice.amount_paid?.amount || 0);
    return invoice.payment_status === 'paid' || invoice.date_paid || paid > 0;
  });

  return {
    rows: paidInvoices.map((invoice) => normalizeFreshBooksInvoice(invoice, {
      defaultEntity: params.entity || 'behavior-school',
      defaultFrappeAccount: params.defaultFrappeAccount || 'Expenses',
      sourceFile: 'FreshBooks API',
    })).filter(Boolean),
    total: result.total ?? invoiceList.length,
    page: result.page ?? page,
    pages: result.pages ?? 1,
    tokenSource: token.tokenSource,
  };
}

async function fetchConnectedSourceRows(params) {
  const requestedSources = String(params.sources || 'stripe,freshbooks')
    .split(',')
    .map((source) => source.trim().toLowerCase())
    .filter(Boolean);
  const rows = [];
  const sourceErrors = [];
  const sources = [];

  if (requestedSources.includes('stripe')) {
    const stripeResult = await fetchStripeRows(params);
    if (stripeResult.error) {
      sourceErrors.push({ source: 'stripe', error: stripeResult.error, statusCode: stripeResult.statusCode || 500 });
    } else {
      rows.push(...stripeResult.rows);
      sources.push({ source: 'stripe', rows: stripeResult.rows.length, hasMore: stripeResult.hasMore, stripeApiVersion: STRIPE_API_VERSION });
    }
  }

  if (requestedSources.includes('freshbooks')) {
    const freshBooksResult = await fetchFreshBooksRows(params);
    if (freshBooksResult.error) {
      sourceErrors.push({ source: 'freshbooks', error: freshBooksResult.error, statusCode: freshBooksResult.statusCode || 500 });
    } else {
      rows.push(...freshBooksResult.rows);
      sources.push({
        source: 'freshbooks',
        rows: freshBooksResult.rows.length,
        page: freshBooksResult.page,
        pages: freshBooksResult.pages,
        total: freshBooksResult.total,
        tokenSource: freshBooksResult.tokenSource,
      });
    }
  }

  return { rows, sourceErrors, sources };
}

function rowsFromPostedPayload(payload, params) {
  const source = params.source || payload.source || 'manual';
  const sourceFile = payload.sourceFile || `${source}-import`;
  const options = {
    sourceFile,
    sourceAccount: payload.sourceAccount || source,
    defaultEntity: payload.entity || params.entity || 'behavior-school',
    defaultFrappeAccount: payload.defaultFrappeAccount || params.defaultFrappeAccount || 'Expenses',
    defaultRevenueAccount: payload.defaultRevenueAccount || params.defaultRevenueAccount || 'Sales',
    defaultExpenseAccount: payload.defaultExpenseAccount || params.defaultExpenseAccount || payload.defaultFrappeAccount || params.defaultFrappeAccount || 'Expenses',
    categoryAccountMap: payload.categoryAccountMap || {},
  };

  if (typeof payload.csv === 'string') {
    return normalizeStatementText(payload.csv, options).rows;
  }

  if (typeof payload.text === 'string') {
    return normalizeStatementText(payload.text, options).rows;
  }

  if (Array.isArray(payload.rows)) {
    return payload.rows.map((row) => normalizeAccountingRow({
      ...row,
      sourceFile,
      sourceAccount: row.sourceAccount || options.sourceAccount,
      entity: row.entity || options.defaultEntity,
    }, options)).filter(Boolean);
  }

  if (Array.isArray(payload.freshBooksInvoices)) {
    return payload.freshBooksInvoices.map((invoice) => normalizeFreshBooksInvoice(invoice, options)).filter(Boolean);
  }

  return [];
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers(), body: '' };
  }

  const unauthorized = requireAdmin(event);
  if (unauthorized) return unauthorized;

  const params = event.queryStringParameters || {};
  const source = params.source || 'manual';
  let rows = [];
  let sourceMeta = {};

  try {
    if (event.httpMethod === 'GET') {
      if (source === 'stripe') {
        const stripeResult = await fetchStripeRows(params);
        if (stripeResult.error) return response(stripeResult.statusCode || 500, { error: stripeResult.error });
        rows = stripeResult.rows;
        sourceMeta = { source: 'stripe', hasMore: stripeResult.hasMore, stripeApiVersion: STRIPE_API_VERSION };
      } else if (source === 'freshbooks') {
        const freshBooksResult = await fetchFreshBooksRows(params);
        if (freshBooksResult.error) return response(freshBooksResult.statusCode || 500, { error: freshBooksResult.error });
        rows = freshBooksResult.rows;
        sourceMeta = {
          source: 'freshbooks',
          sourceFile: 'FreshBooks API',
          page: freshBooksResult.page,
          pages: freshBooksResult.pages,
          total: freshBooksResult.total,
          tokenSource: freshBooksResult.tokenSource,
        };
      } else if (source === 'all' || source === 'connected') {
        const connectedResult = await fetchConnectedSourceRows(params);
        rows = connectedResult.rows;
        sourceMeta = {
          source: 'connected',
          sourceFile: 'Connected accounting sources',
          sources: connectedResult.sources,
          errors: connectedResult.sourceErrors,
        };
      } else {
        return response(400, { error: 'GET source import supports source=stripe, source=freshbooks, or source=all. Use POST for CSV, JSON rows, or pasted exports.' });
      }
    } else if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      rows = rowsFromPostedPayload(payload, params);
      sourceMeta = { source: payload.source || source, sourceFile: payload.sourceFile || null };
    } else {
      return response(405, { error: 'Method not allowed' });
    }
  } catch (error) {
    return response(400, { error: error.message || String(error) });
  }

  if (!rows.length) {
    const importRun = buildImportRun({
      source: sourceMeta.source || source,
      sourceFile: sourceMeta.sourceFile || sourceMeta.source || source,
      inserted: 0,
      skipped: 0,
      rowCount: 0,
      persisted: false,
      errors: sourceMeta.errors || [],
    });
    return response(200, {
      success: true,
      persisted: false,
      inserted: 0,
      skipped: 0,
      rows: [],
      importRun,
      meta: { ...sourceMeta, note: 'No rows were normalized from this source.' },
    });
  }

  const sourceFingerprint = sourceFingerprintForRows(sourceMeta.sourceFile || sourceMeta.source || source, rows);
  rows = rows.map((row) => ({
    ...row,
    sourceFingerprint: row.sourceFingerprint || sourceFingerprint,
  }));

  const { store, error } = getBlobStore();
  if (!store) {
    const importRun = buildImportRun({
      source: sourceMeta.source || source,
      sourceFile: sourceMeta.sourceFile || sourceMeta.source || source,
      inserted: rows.length,
      skipped: 0,
      rowCount: rows.length,
      persisted: false,
      fingerprint: sourceFingerprint,
      errors: sourceMeta.errors || [],
    });
    return response(202, {
      success: true,
      persisted: false,
      inserted: rows.length,
      skipped: 0,
      rows,
      importRun,
      meta: { ...sourceMeta, note: error || 'Blob store unavailable; client can merge rows locally.' },
    });
  }

  try {
    const existing = await loadAccounting(store);
    const { accounting, inserted, skipped } = mergeRows(existing, rows);
    accounting.importedFiles = [
      ...(accounting.importedFiles || []),
      {
        name: sourceMeta.sourceFile || sourceMeta.source || source,
        importedAt: new Date().toISOString(),
        count: inserted,
        fingerprint: sourceFingerprint,
      },
    ];
    const importRun = buildImportRun({
      source: sourceMeta.source || source,
      sourceFile: sourceMeta.sourceFile || sourceMeta.source || source,
      inserted,
      skipped,
      rowCount: rows.length,
      persisted: true,
      fingerprint: sourceFingerprint,
      errors: sourceMeta.errors || [],
    });
    accounting.importRuns = [importRun, ...(accounting.importRuns || [])].slice(0, 100);
    await store.set(ACCOUNTING_BLOB_KEY, JSON.stringify(accounting));
    return response(200, {
      success: true,
      persisted: true,
      inserted,
      skipped,
      rows,
      importRun,
      accounting,
      meta: sourceMeta,
    });
  } catch (error) {
    return response(500, { error: String(error) });
  }
};
