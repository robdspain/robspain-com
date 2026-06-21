const {
  buildFrappeJournalEntries,
} = require('./accounting-normalize');

function headers() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
}

function response(statusCode, payload) {
  return {
    statusCode,
    headers: headers(),
    body: JSON.stringify(payload),
  };
}

function requireAdmin(event) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) return null;
  const auth = event.headers.authorization || event.headers.Authorization;
  return auth === `Bearer ${adminToken}` ? null : response(401, { error: 'Unauthorized' });
}

function frappeConfig() {
  const baseUrl = String(process.env.FRAPPE_BASE_URL || '').replace(/\/+$/, '');
  const apiKey = process.env.FRAPPE_API_KEY || '';
  const apiSecret = process.env.FRAPPE_API_SECRET || '';
  return {
    baseUrl,
    apiKey,
    apiSecret,
    company: process.env.FRAPPE_COMPANY || '',
    defaultBankAccount: process.env.FRAPPE_DEFAULT_BANK_ACCOUNT || '',
    defaultExpenseAccount: process.env.FRAPPE_DEFAULT_EXPENSE_ACCOUNT || '',
    defaultRevenueAccount: process.env.FRAPPE_DEFAULT_REVENUE_ACCOUNT || '',
    submitJournalEntries: process.env.FRAPPE_SUBMIT_JOURNAL_ENTRIES === 'true',
    configured: Boolean(baseUrl && apiKey && apiSecret),
  };
}

async function postFrappe(config, path, body) {
  const res = await fetch(`${config.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.exception || payload.exc_type || payload.message || payload.error || `Frappe HTTP ${res.status}`);
  }
  return payload;
}

async function createJournalEntry(config, entry) {
  const created = await postFrappe(config, `/api/resource/${encodeURIComponent('Journal Entry')}`, entry.doc);
  if (!config.submitJournalEntries) return created;
  const doc = created.data || created.message || created;
  return postFrappe(config, '/api/method/frappe.client.submit', { doc });
}

function buildFrappeRun({ dryRun, configured, rows, entries, created, failed, skipped, company, defaultBankAccount, note, errors, startedAt }) {
  const finishedAt = new Date().toISOString();
  const rowCount = Array.isArray(rows) ? rows.length : Number(rows || 0);
  const entryCount = Array.isArray(entries) ? entries.length : Number(entries || 0);
  const errorList = Array.isArray(errors) ? errors : [];
  return {
    id: `frappe_${Date.now()}`,
    mode: dryRun ? 'preview' : 'sync',
    status: errorList.length ? (Number(created || 0) > 0 ? 'partial' : 'failed') : 'success',
    configured: Boolean(configured),
    rowCount,
    entryCount,
    created: Number(created || 0),
    failed: Number(failed || errorList.length || 0),
    skipped: Number(skipped || 0),
    company: company || '',
    defaultBankAccount: defaultBankAccount || '',
    note: note || '',
    errors: errorList,
    startedAt: startedAt || finishedAt,
    finishedAt,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  const unauthorized = requireAdmin(event);
  if (unauthorized) return unauthorized;

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return response(400, { error: 'Invalid JSON payload.' });
  }

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const config = frappeConfig();
  const startedAt = new Date().toISOString();
  const company = payload.company || config.company;
  const defaultBankAccount = payload.defaultBankAccount || config.defaultBankAccount;
  const entries = buildFrappeJournalEntries(rows, {
    company,
    defaultBankAccount,
    defaultExpenseAccount: payload.defaultExpenseAccount || config.defaultExpenseAccount,
    defaultRevenueAccount: payload.defaultRevenueAccount || config.defaultRevenueAccount,
  });

  if (!entries.length) {
    const note = 'No approved, exportable rows were provided.';
    return response(200, {
      success: true,
      configured: config.configured,
      dryRun: true,
      created: 0,
      skipped: rows.length,
      entries: [],
      note,
      frappeRun: buildFrappeRun({
        dryRun: true,
        configured: config.configured,
        rows,
        entries,
        created: 0,
        skipped: rows.length,
        company,
        defaultBankAccount,
        note,
        startedAt,
      }),
    });
  }

  const hasBankAccount = Boolean(defaultBankAccount);
  const dryRun = payload.dryRun !== false || !config.configured;
  if (dryRun) {
    const note = config.configured
      ? 'Dry run only. Send dryRun=false to create Journal Entry documents.'
      : 'FRAPPE_BASE_URL, FRAPPE_API_KEY, and FRAPPE_API_SECRET are not configured; returning Journal Entry payload preview.';
    return response(config.configured ? 200 : 202, {
      success: true,
      configured: config.configured,
      dryRun: true,
      created: 0,
      skipped: rows.length - entries.length,
      entries,
      note,
      frappeRun: buildFrappeRun({
        dryRun: true,
        configured: config.configured,
        rows,
        entries,
        created: 0,
        skipped: rows.length - entries.length,
        company,
        defaultBankAccount,
        note,
        startedAt,
      }),
    });
  }

  if (!hasBankAccount) {
    const error = 'FRAPPE_DEFAULT_BANK_ACCOUNT or request defaultBankAccount is required before creating Journal Entries.';
    return response(400, {
      success: false,
      configured: true,
      dryRun: false,
      error,
      frappeRun: buildFrappeRun({
        dryRun: false,
        configured: true,
        rows,
        entries,
        created: 0,
        failed: entries.length,
        skipped: rows.length - entries.length,
        company,
        defaultBankAccount,
        errors: [{ error }],
        startedAt,
      }),
    });
  }

  const results = [];
  const errors = [];
  for (const entry of entries) {
    try {
      const result = await createJournalEntry(config, entry);
      results.push({
        importKey: entry.importKey,
        sourceRowId: entry.sourceRowId,
        name: result.data?.name || result.message?.name || result.name || null,
        result,
      });
    } catch (error) {
      errors.push({
        importKey: entry.importKey,
        sourceRowId: entry.sourceRowId,
        error: error.message || String(error),
      });
    }
  }

  return response(errors.length ? 207 : 200, {
    success: errors.length === 0,
    configured: true,
    dryRun: false,
    created: results.length,
    failed: errors.length,
    skipped: rows.length - entries.length,
    results,
    errors,
    frappeRun: buildFrappeRun({
      dryRun: false,
      configured: true,
      rows,
      entries,
      created: results.length,
      failed: errors.length,
      skipped: rows.length - entries.length,
      company,
      defaultBankAccount,
      errors,
      startedAt,
    }),
  });
};
