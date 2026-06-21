const { schedule } = require('@netlify/functions');
const sourceImport = require('./accounting-source-import');

function autoImportParams(overrides = {}) {
  return {
    source: 'all',
    entity: overrides.entity || process.env.ACCOUNTING_AUTO_IMPORT_ENTITY || 'behavior-school',
    limit: String(overrides.limit || process.env.ACCOUNTING_AUTO_IMPORT_LIMIT || 50),
    sources: overrides.sources || process.env.ACCOUNTING_AUTO_IMPORT_SOURCES || 'stripe,freshbooks',
  };
}

async function runAccountingAutoImport(overrides = {}) {
  const headers = {};
  if (process.env.ADMIN_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.ADMIN_API_TOKEN}`;
  }

  const result = await sourceImport.handler({
    httpMethod: 'GET',
    headers,
    queryStringParameters: autoImportParams(overrides),
  });
  const body = JSON.parse(result.body || '{}');

  return {
    statusCode: result.statusCode >= 500 ? result.statusCode : 200,
    body: {
      success: result.statusCode < 400,
      sourceStatusCode: result.statusCode,
      inserted: body.inserted || 0,
      skipped: body.skipped || 0,
      persisted: Boolean(body.persisted),
      meta: body.meta || {},
      ranAt: new Date().toISOString(),
    },
  };
}

module.exports.runAccountingAutoImport = runAccountingAutoImport;

module.exports.handler = schedule('0 15 * * *', async () => {
  console.log('[accounting-auto-import] Starting scheduled accounting import', new Date().toISOString());
  const result = await runAccountingAutoImport();
  console.log('[accounting-auto-import] Completed scheduled accounting import', JSON.stringify(result.body));
  return {
    statusCode: result.statusCode,
    body: JSON.stringify(result.body),
  };
});
