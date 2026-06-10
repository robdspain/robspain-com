const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

const env = (name) => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
};

const sourceStatus = (connected, pendingMessage = 'Source configured; fetch/reconciliation still needs implementation.') => {
  if (!connected) return { status: 'needs_source', value: null, displayValue: 'Not connected' };
  return { status: 'source_configured_fetch_pending', value: null, displayValue: pendingMessage };
};

const metric = ({
  id,
  label,
  dailyMetric,
  requiredSource,
  connected,
  activeSource,
  nextAction,
  sourceFields,
  metricDecision,
}) => ({
  id,
  label,
  dailyMetric,
  requiredSource,
  activeSource: connected ? activeSource : 'Not connected',
  nextAction,
  sourceFields,
  metricDecision,
  ...sourceStatus(connected),
});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: jsonHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const analyticsConnected = Boolean(env('ANALYTICS_EXPORT_URL') || env('GA4_PROPERTY_ID') || env('PLAUSIBLE_SITE_ID'));
  const optInsConnected = Boolean(env('OPT_INS_EXPORT_URL') || env('NEWSLETTER_EXPORT_URL') || env('CRM_OPT_INS_EXPORT_URL'));
  const calendlyConnected = Boolean(env('CALENDLY_API_KEY') || env('CALENDLY_EXPORT_URL'));
  const completedCallQueryConnected = Boolean(env('COMPLETED_FIT_CALL_CALENDAR_QUERY'));
  const invoiceConnected = Boolean(env('INVOICE_EXPORT_URL') || env('INVOICE_API_KEY'));
  const invoiceMetric = env('INVOICE_DAILY_METRIC');
  const salesConnected = Boolean((env('PAYMENT_EXPORT_URL') || env('PAYMENT_API_KEY')) && (env('PIPELINE_EXPORT_URL') || env('CRM_CLOSED_WON_EXPORT_URL')));

  const metrics = [
    metric({
      id: 'visits',
      label: 'Visits',
      dailyMetric: 'Daily verified website visits',
      requiredSource: 'Analytics export or API',
      connected: analyticsConnected,
      activeSource: env('ANALYTICS_EXPORT_URL') || env('GA4_PROPERTY_ID') || env('PLAUSIBLE_SITE_ID'),
      nextAction: 'Connect ANALYTICS_EXPORT_URL, GA4_PROPERTY_ID, or PLAUSIBLE_SITE_ID before reporting visits.',
      sourceFields: ['ANALYTICS_EXPORT_URL', 'GA4_PROPERTY_ID', 'PLAUSIBLE_SITE_ID'],
      metricDecision: 'Report no visit count until one analytics source is connected.',
    }),
    metric({
      id: 'opt_ins',
      label: 'Opt-ins',
      dailyMetric: 'Daily verified email or lead-capture opt-ins',
      requiredSource: 'Active capture source or newsletter provider export',
      connected: optInsConnected,
      activeSource: env('OPT_INS_EXPORT_URL') || env('NEWSLETTER_EXPORT_URL') || env('CRM_OPT_INS_EXPORT_URL'),
      nextAction: 'Connect OPT_INS_EXPORT_URL, NEWSLETTER_EXPORT_URL, or CRM_OPT_INS_EXPORT_URL before reporting opt-ins.',
      sourceFields: ['OPT_INS_EXPORT_URL', 'NEWSLETTER_EXPORT_URL', 'CRM_OPT_INS_EXPORT_URL'],
      metricDecision: 'Report no opt-in count until the active capture source is connected.',
    }),
    metric({
      id: 'calls',
      label: 'Calls',
      dailyMetric: 'Daily completed fit calls',
      requiredSource: 'Calendly API/export or completed-call calendar query',
      connected: calendlyConnected || completedCallQueryConnected,
      activeSource: env('CALENDLY_EXPORT_URL') || env('CALENDLY_API_KEY') || env('COMPLETED_FIT_CALL_CALENDAR_QUERY'),
      nextAction: 'Connect Calendly API/export or define COMPLETED_FIT_CALL_CALENDAR_QUERY before reporting completed fit calls.',
      sourceFields: ['CALENDLY_API_KEY', 'CALENDLY_EXPORT_URL', 'COMPLETED_FIT_CALL_CALENDAR_QUERY'],
      metricDecision: 'Completed calls can come from Calendly or a specific calendar query, but not from manual estimates.',
    }),
    metric({
      id: 'bookings',
      label: 'Bookings',
      dailyMetric: 'Daily booked fit calls',
      requiredSource: 'Calendly API/export',
      connected: calendlyConnected,
      activeSource: env('CALENDLY_EXPORT_URL') || env('CALENDLY_API_KEY'),
      nextAction: 'Connect CALENDLY_API_KEY or CALENDLY_EXPORT_URL before reporting booked calls.',
      sourceFields: ['CALENDLY_API_KEY', 'CALENDLY_EXPORT_URL'],
      metricDecision: 'Booked calls require Calendly as the source of truth.',
    }),
    metric({
      id: 'invoices',
      label: 'Invoices',
      dailyMetric: invoiceMetric ? `Daily ${invoiceMetric} invoices` : 'Daily invoice count after choosing open invoices or sent invoices',
      requiredSource: 'Invoice export or API plus metric definition',
      connected: invoiceConnected && ['open', 'sent'].includes(invoiceMetric),
      activeSource: env('INVOICE_EXPORT_URL') || env('INVOICE_API_KEY'),
      nextAction: 'Connect INVOICE_EXPORT_URL or INVOICE_API_KEY, then set INVOICE_DAILY_METRIC to open or sent.',
      sourceFields: ['INVOICE_EXPORT_URL', 'INVOICE_API_KEY', 'INVOICE_DAILY_METRIC=open|sent'],
      metricDecision: invoiceMetric ? `Daily invoice metric selected: ${invoiceMetric}.` : 'Choose open invoices or sent invoices before reporting this number.',
    }),
    metric({
      id: 'sales',
      label: 'Sales',
      dailyMetric: 'Daily verified closed sales reconciled to pipeline',
      requiredSource: 'Payment export/API plus closed-won pipeline rows',
      connected: salesConnected,
      activeSource: [env('PAYMENT_EXPORT_URL') || env('PAYMENT_API_KEY'), env('PIPELINE_EXPORT_URL') || env('CRM_CLOSED_WON_EXPORT_URL')].filter(Boolean).join(' + '),
      nextAction: 'Connect PAYMENT_EXPORT_URL or PAYMENT_API_KEY, then connect PIPELINE_EXPORT_URL or CRM_CLOSED_WON_EXPORT_URL.',
      sourceFields: ['PAYMENT_EXPORT_URL', 'PAYMENT_API_KEY', 'PIPELINE_EXPORT_URL', 'CRM_CLOSED_WON_EXPORT_URL'],
      metricDecision: 'Sales are not reported until payments reconcile to closed-won pipeline rows.',
    }),
  ];

  return {
    statusCode: 200,
    headers: jsonHeaders,
    body: JSON.stringify({
      generatedAt: new Date().toISOString(),
      policy: 'No source, no number. A metric with no connected source returns null.',
      metrics,
    }),
  };
};
