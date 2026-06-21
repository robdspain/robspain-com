const { getStore } = require('@netlify/blobs');

function headers() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

function service(id, label, configured, detail, nextStep = '') {
  return {
    id,
    label,
    configured: Boolean(configured),
    status: configured ? 'ready' : 'setup-needed',
    detail,
    nextStep,
  };
}

function getBlobStatus() {
  try {
    getStore('admin-data');
    return service('netlify-blobs', 'Admin Data Store', true, 'Netlify Blobs store is available for durable review queue sync.');
  } catch (error) {
    const hasManualConfig = Boolean(
      (process.env.SITE_ID || process.env.NETLIFY_SITE_ID)
      && (process.env.NETLIFY_TOKEN || process.env.NETLIFY_API_TOKEN)
    );
    return service(
      'netlify-blobs',
      'Admin Data Store',
      hasManualConfig,
      hasManualConfig ? 'Manual Netlify Blobs credentials are present.' : 'Using browser localStorage fallback until Netlify Blobs is configured.',
      'Set SITE_ID and NETLIFY_TOKEN, or run inside Netlify with Blobs enabled.'
    );
  }
}

function accountingStatus() {
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY);
  const freshBooksReady = Boolean(process.env.FRESHBOOKS_ACCESS_TOKEN && process.env.FRESHBOOKS_ACCOUNT_ID);
  const connectedImportsReady = stripeReady || freshBooksReady;
  const frappeReady = Boolean(process.env.FRAPPE_BASE_URL && process.env.FRAPPE_API_KEY && process.env.FRAPPE_API_SECRET);
  const frappeBankReady = Boolean(process.env.FRAPPE_DEFAULT_BANK_ACCOUNT);
  const adminTokenReady = Boolean(process.env.ADMIN_API_TOKEN);

  const services = [
    getBlobStatus(),
    service(
      'admin-token',
      'Admin Write Protection',
      adminTokenReady,
      adminTokenReady ? 'ADMIN_API_TOKEN is set for protected write actions.' : 'Write endpoints are currently open to the deployed admin surface.',
      'Set ADMIN_API_TOKEN and store the same token in browser localStorage as robspainAdminApiToken.'
    ),
    service(
      'connected-imports',
      'Connected Source Imports',
      connectedImportsReady,
      connectedImportsReady ? 'At least one live accounting source is configured for one-click import.' : 'No live Stripe or FreshBooks source is configured yet.',
      'Set STRIPE_SECRET_KEY and/or FRESHBOOKS_ACCESS_TOKEN with FRESHBOOKS_ACCOUNT_ID.'
    ),
    service(
      'scheduled-imports',
      'Scheduled Auto Import',
      connectedImportsReady,
      connectedImportsReady ? 'Daily scheduled accounting import can pull configured live sources into the review queue.' : 'Scheduled accounting import is deployed, but needs at least one configured live source.',
      'Set ACCOUNTING_AUTO_IMPORT_SOURCES if you want to limit the daily run; defaults to stripe,freshbooks.'
    ),
    service(
      'stripe',
      'Stripe Import',
      stripeReady,
      stripeReady ? 'Stripe API key is configured for recent balance transaction imports.' : 'Stripe import button will return a setup-needed response.',
      'Set STRIPE_SECRET_KEY.'
    ),
    service(
      'freshbooks',
      'FreshBooks Import',
      freshBooksReady,
      freshBooksReady ? 'FreshBooks access token and account ID are configured for paid invoice imports.' : 'FreshBooks live import requires an access token and account ID.',
      'Set FRESHBOOKS_ACCESS_TOKEN and FRESHBOOKS_ACCOUNT_ID.'
    ),
    service(
      'frappe',
      'Frappe Sync',
      frappeReady,
      frappeReady
        ? (frappeBankReady ? 'Frappe API credentials and env default bank account are configured.' : 'Frappe API credentials exist; set a bank account in Accounting Hub before creating live Journal Entries.')
        : 'Frappe sync will run in dry-run preview mode until API credentials are configured.',
      'Set FRAPPE_BASE_URL, FRAPPE_API_KEY, and FRAPPE_API_SECRET. Then set FRAPPE_DEFAULT_BANK_ACCOUNT or fill the Frappe settings in Accounting Hub.'
    ),
    service(
      'browser-ocr',
      'Browser OCR',
      true,
      'PDF.js text extraction and best-effort Tesseract.js browser OCR are wired in the admin page.',
      ''
    ),
  ];

  return {
    generatedAt: new Date().toISOString(),
    readyCount: services.filter((item) => item.configured).length,
    totalCount: services.length,
    services,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers(), body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return response(405, { error: 'Method not allowed' });
  }
  return response(200, accountingStatus());
};
