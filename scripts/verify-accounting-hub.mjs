import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  normalizeCsvAccountingRows,
  normalizeStatementText,
  detectStatementProfile,
  createOcrNeededRow,
  buildFrappeJournalEntries,
  reconstructStatementLines,
  normalizeStripeBalanceTransaction,
  normalizeFreshBooksInvoice,
  normalizeOfxRows,
  normalizePayee,
} = require('../src/netlify/functions/accounting-normalize.js');

const source = fs.readFileSync('src/admin/family.njk', 'utf8');
const scripts = [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
const accountingScript = scripts.find((script) => script.includes('function parseStatementText'));
const protectedHeaders = () => (
  process.env.ADMIN_API_TOKEN ? { authorization: `Bearer ${process.env.ADMIN_API_TOKEN}` } : {}
);

if (!accountingScript) {
  throw new Error('Could not find Accounting Hub inline script.');
}

const elements = new Map();

function element(id = '') {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      value: id === 'statementAccount' ? 'Behavior School Bank' : id === 'statementEntity' ? 'behavior-school' : '',
      innerHTML: '',
      textContent: '',
      style: {},
      className: '',
      title: '',
      addEventListener() {},
      appendChild() {},
      remove() {},
      click() {},
      classList: {
        add() {},
        remove() {},
      },
    });
  }
  return elements.get(id);
}

const sandbox = {
  console,
  URLSearchParams,
  Blob: class Blob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  },
  URL: {
    createObjectURL() {
      return 'blob:verify';
    },
    revokeObjectURL() {},
  },
  window: {
    location: {
      search: '',
      hash: '',
    },
  },
  document: {
    getElementById: element,
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return element('query');
    },
    createElement(tagName) {
      return element(tagName + '-' + Math.random().toString(16).slice(2));
    },
    body: element('body'),
  },
  localStorage: {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {},
  },
  fetch: async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'empty-fallback' },
    json: async () => ({
      activeEntity: 'behavior-school',
      defaultFrappeAccount: 'Expenses',
      reviewQueue: [],
      importedFiles: [],
      meta: { source: 'empty-fallback' },
    }),
  }),
  setTimeout,
  clearTimeout,
  confirm: () => true,
  prompt: () => null,
  Date,
  Math,
  Number,
  String,
  parseFloat,
  parseInt,
  isNaN,
};

vm.createContext(sandbox);
vm.runInContext(accountingScript, sandbox, { filename: 'family-accounting-inline.js' });

const fallbackStatus = sandbox.fallbackAutomationStatus('offline');
assert.equal(fallbackStatus.services.some((item) => item.id === 'browser-ocr' && item.configured), true);
assert.equal(fallbackStatus.services.some((item) => item.id === 'status-endpoint' && !item.configured), true);
assert.match(element('accountingRules').innerHTML, /Sales/);
assert.match(element('accountingSummary').innerHTML, /Transactions/);
assert.match(element('accountingCloseStatus').innerHTML, /Close/);

const smokeImported = sandbox.addAccountingTransactions([{
  date: '2026-08-01',
  description: 'Stripe cohort payment smoke test',
  amount: 300,
  sourceAccount: 'Stripe',
  entity: 'behavior-school',
}], 'smoke-stripe.csv');
assert.equal(smokeImported.length, 1);
assert.match(smokeImported[0].sourceFingerprint, /^src_[0-9a-f]{8}$/);
assert.match(element('accountingReviewQueue').innerHTML, /Stripe cohort payment smoke test/);
assert.match(element('accountingCloseStatus').innerHTML, /Frappe export pending/);
assert.match(element('accountingImportRuns').innerHTML, /smoke-stripe\.csv/);
assert.match(element('statementParseLog').textContent, /Imported 1 new transaction/);
assert.match(element('statementParseLog').textContent, /Source fingerprint: src_[0-9a-f]{8}/);

const reconciledImport = sandbox.addAccountingTransactions([{
  date: '2026-03-29',
  description: 'Toggle Insurance debit card payment',
  amount: -204,
  sourceAccount: 'EECU Debit',
  entity: 'household',
}], 'reconcile-smoke.csv');
assert.equal(reconciledImport.length, 1);
assert.equal(reconciledImport[0].reconciliationStatus, 'matched');
assert.equal(reconciledImport[0].reconciliationType, 'payment');
assert.equal(reconciledImport[0].reconciliationName, 'Toggle Insurance');
assert.match(element('accountingReviewQueue').innerHTML, /reconcile matched: Toggle Insurance/);

assert.equal(JSON.stringify(sandbox.frappeSyncSettingsPayload()), JSON.stringify({
  company: '',
  defaultBankAccount: '',
  defaultRevenueAccount: 'Sales',
  defaultExpenseAccount: 'Expenses',
}));
sandbox.updateFrappeSetting('company', 'Behavior School LLC');
sandbox.updateFrappeSetting('defaultBankAccount', 'Checking - BS');
sandbox.updateFrappeSetting('defaultRevenueAccount', 'Sales - BS');
sandbox.updateFrappeSetting('defaultExpenseAccount', 'Expenses - BS');
sandbox.updateFrappeAccountMapping('Software and subscriptions', 'Software - BS');
sandbox.updateFrappeSetting('notAllowed', 'Ignored');
assert.equal(JSON.stringify(sandbox.frappeSyncSettingsPayload()), JSON.stringify({
  company: 'Behavior School LLC',
  defaultBankAccount: 'Checking - BS',
  defaultRevenueAccount: 'Sales - BS',
  defaultExpenseAccount: 'Expenses - BS',
}));
const accountingPayloadWithSettings = sandbox.accountingPayload();
assert.equal(accountingPayloadWithSettings.frappeSettings.company, 'Behavior School LLC');
assert.equal(accountingPayloadWithSettings.frappeSettings.notAllowed, undefined);
assert.equal(accountingPayloadWithSettings.importRuns.length >= 2, true);
assert.equal(accountingPayloadWithSettings.importRuns.some((run) => run.sourceFile === 'smoke-stripe.csv' && run.inserted === 1), true);
sandbox.recordFrappeSyncRun({
  mode: 'preview',
  status: 'success',
  configured: false,
  rowCount: 1,
  entryCount: 1,
  skipped: 0,
  company: 'Behavior School LLC',
  defaultBankAccount: 'Checking - BS',
  note: 'Verifier preview',
  startedAt: '2026-06-30T12:00:00.000Z',
  finishedAt: '2026-06-30T12:00:00.000Z',
});
assert.match(element('frappeSyncRuns').innerHTML, /Frappe preview/);
assert.equal(sandbox.accountingPayload().frappeRuns.length, 1);
sandbox.updateCpaNotes('Ask CPA whether Behavior School software subscriptions are fully deductible this month.');
assert.equal(sandbox.accountingPayload().cpaNotes, 'Ask CPA whether Behavior School software subscriptions are fully deductible this month.');
assert.equal(element('cpaNotesInput').value, 'Ask CPA whether Behavior School software subscriptions are fully deductible this month.');
assert.equal(accountingPayloadWithSettings.frappeSettings.categoryAccountMap.Sales, 'Sales - BS');
assert.equal(accountingPayloadWithSettings.frappeSettings.categoryAccountMap.Uncategorized, 'Expenses - BS');
assert.equal(accountingPayloadWithSettings.frappeSettings.categoryAccountMap['Software and subscriptions'], 'Software - BS');
assert.equal(accountingPayloadWithSettings.frappeSettings.categoryAccountMap['Merchant fees'], 'Bank charges / merchant fees');
assert.match(element('frappeAccountMap').innerHTML, /Software - BS/);
assert.match(element('frappeAccountMap').innerHTML, /Merchant fees/);
assert.match(element('frappeAccountOptions').innerHTML, /Software - BS/);

const mappedImport = sandbox.addAccountingTransactions([{
  date: '2026-08-02',
  description: 'OpenAI API usage account map smoke',
  amount: -20,
  sourceAccount: 'EECU Checking',
  entity: 'behavior-school',
}], 'mapping-smoke.csv');
assert.equal(mappedImport.length, 1);
assert.equal(mappedImport[0].category, 'Software and subscriptions');
assert.equal(mappedImport[0].frappeAccount, 'Software - BS');
assert.match(element('accountingReviewQueue').innerHTML, /Frappe Account/);
assert.match(element('accountingReviewQueue').innerHTML, /Software - BS/);

const subscriptionImport = sandbox.addAccountingTransactions([{
  date: '2026-08-03',
  description: 'OpenAI subscription regression',
  amount: -20,
  sourceAccount: 'EECU Checking',
  entity: 'behavior-school',
}], 'subscription-regression.csv');
assert.equal(subscriptionImport.length, 1);
assert.equal(subscriptionImport[0].category, 'Software and subscriptions');
assert.equal(subscriptionImport[0].taxCategory, 'Office expense');
assert.equal(subscriptionImport[0].frappeAccount, 'Software - BS');
assert.equal(subscriptionImport[0].payee, 'OpenAI');
assert.equal(sandbox.normalizePayee('POS DEBIT OPENAI *CHATGPT 123456 SAN FRANCISCO CA', -20), 'OpenAI');

const vendorRuleSeed = sandbox.addAccountingTransactions([{
  date: '2026-08-04',
  description: 'POS DEBIT FRESNO PRINT LAB 442321',
  amount: -48,
  sourceAccount: 'EECU Checking',
  entity: 'behavior-school',
  confidence: 0.55,
  approved: false,
}], 'vendor-rule-seed.csv');
assert.equal(vendorRuleSeed.length, 1);
assert.equal(vendorRuleSeed[0].payee, 'Fresno Print Lab');
sandbox.updateAccountingTxn(vendorRuleSeed[0].id, 'category', 'Office supplies');
sandbox.updateAccountingTxn(vendorRuleSeed[0].id, 'frappeAccount', 'Office Supplies - BS');
sandbox.toggleAccountingApproval(vendorRuleSeed[0].id);
const vendorRule = sandbox.createVendorRuleFromTransaction(vendorRuleSeed[0].id);
assert.equal(vendorRule.payee, 'Fresno Print Lab');
assert.equal(vendorRule.category, 'Office supplies');
assert.equal(vendorRule.frappeAccount, 'Office Supplies - BS');
assert.equal(sandbox.accountingPayload().vendorRules.length >= 1, true);
assert.match(element('accountingVendorRules').innerHTML, /Fresno Print Lab/);

const vendorRuleApplied = sandbox.addAccountingTransactions([{
  date: '2026-08-06',
  description: 'CHECKCARD FRESNO PRINT LAB 998812',
  amount: -52,
  sourceAccount: 'EECU Checking',
  entity: 'behavior-school',
  confidence: 0.55,
  approved: false,
}], 'vendor-rule-apply.csv');
assert.equal(vendorRuleApplied.length, 1);
assert.equal(vendorRuleApplied[0].category, 'Office supplies');
assert.equal(vendorRuleApplied[0].taxCategory, 'Supplies');
assert.equal(vendorRuleApplied[0].frappeAccount, 'Office Supplies - BS');
assert.equal(vendorRuleApplied[0].automationRuleName, 'Fresno Print Lab');
assert.equal(vendorRuleApplied[0].approved, true);
assert.equal(vendorRuleApplied[0].approvedByAutomation, true);

const automationReadyImport = sandbox.addAccountingTransactions([{
  date: '2026-08-07',
  description: 'Stripe invoice payment automation approval',
  amount: 200,
  sourceAccount: 'Stripe',
  entity: 'behavior-school',
  confidence: 0.8,
  balanceCheck: 'matched',
  approved: false,
}], 'auto-approval.csv');
const automationBlockedImport = sandbox.addAccountingTransactions([{
  date: '2026-08-08',
  description: 'Unclear statement row manual review',
  amount: -10,
  sourceAccount: 'EECU Checking',
  entity: 'behavior-school',
  confidence: 0.7,
  balanceCheck: 'unchecked',
  approved: false,
}], 'manual-review.csv');
assert.equal(automationReadyImport.length, 1);
assert.equal(automationBlockedImport.length, 1);
assert.equal(automationReadyImport[0].approved, false);
assert.equal(automationBlockedImport[0].approved, false);
assert.match(element('accountingSummary').innerHTML, /Automation ready/);
assert.equal(sandbox.approveAutomationReadyRows(), 1);
assert.equal(automationReadyImport[0].approved, true);
assert.equal(automationReadyImport[0].approvedByAutomation, true);
assert.match(automationReadyImport[0].approvedAt, /^20\d\d-/);
assert.equal(automationBlockedImport[0].approved, false);
assert.equal(sandbox.isAutomationReadyForApproval(automationBlockedImport[0]), false);

const csv = [
  'Date,Description,Amount',
  '2026-06-01,Stripe payout,1997.00',
  '2026-06-02,OpenAI API usage,-20.00',
  '2026-06-03,Apple Card Payment,100.00',
].join('\n');

const csvRows = sandbox.parseStatementText(csv, 'sample.csv');
assert.equal(csvRows.length, 3);
assert.equal(csvRows[0].description, 'Stripe payout');
assert.equal(csvRows[0].amount, 1997);
assert.equal(csvRows[1].amount, -20);
assert.equal(csvRows[0].importProfile, 'generic-csv');

const tabDelimitedRows = sandbox.parseStatementText([
  'Date\tDescription\tDebit\tCredit\tBalance',
  '06/01/2026\tOpening deposit\t\t100.00\t100.00',
  '06/02/2026\tOpenAI subscription\t20.00\t\t80.00',
].join('\n'), 'bank-export.tsv');
assert.equal(tabDelimitedRows.length, 2);
assert.equal(tabDelimitedRows[0].importProfile, 'eecu');
assert.equal(tabDelimitedRows[0].amount, 100);
assert.equal(tabDelimitedRows[1].amount, -20);
assert.equal(tabDelimitedRows[1].balanceCheck, 'matched');

const balancedBankCsv = [
  'Date,Description,Debit,Credit,Balance',
  '06/01/2026,Opening deposit,,100.00,100.00',
  '06/02/2026,OpenAI subscription,20.00,,80.00',
  '06/03/2026,Stripe payout,,50.00,130.00',
].join('\n');
const balancedRows = sandbox.parseStatementText(balancedBankCsv, 'EECU export.csv');
assert.equal(balancedRows.length, 3);
assert.equal(balancedRows[1].amount, -20);
assert.equal(balancedRows[1].bankBalance, 80);
assert.equal(balancedRows[1].balanceCheck, 'matched');

const mismatchedBankCsv = [
  'Date,Description,Debit,Credit,Balance',
  '06/01/2026,Opening deposit,,100.00,100.00',
  '06/02/2026,OpenAI subscription,20.00,,81.00',
].join('\n');
const mismatchedRows = sandbox.parseStatementText(mismatchedBankCsv, 'EECU export.csv');
assert.equal(mismatchedRows[1].balanceCheck, 'mismatch');
assert.equal(mismatchedRows[1].confidence <= 0.45, true);
assert.match(mismatchedRows[1].notes, /Running balance mismatch/);

const textRows = sandbox.parseStatementText([
  '06/04/2026 FreshBooks invoice payment 697.00',
  '06/05/2026 Google Workspace 14.99',
].join('\n'), 'statement.txt');
assert.equal(textRows.length, 2);
assert.equal(textRows[0].amount, 697);
assert.equal(textRows[1].amount, -14.99);

const pdfTextRows = sandbox.parseStatementText([
  '06/01/2026 Opening deposit 100.00 100.00',
  '06/02/2026 OpenAI subscription 20.00 80.00',
  '06/03/2026 Stripe payout 50.00 130.00',
].join('\n'), 'statement.pdf');
assert.equal(sandbox.hasTransactionSignals('06/01/2026 Opening deposit 100.00 100.00'), true);
assert.equal(sandbox.hasTransactionSignals('Statement image page without useful numbers'), false);
assert.equal(pdfTextRows.length, 3);
assert.equal(pdfTextRows[0].amount, 100);
assert.equal(pdfTextRows[1].amount, -20);
assert.equal(pdfTextRows[2].bankBalance, 130);
assert.equal(pdfTextRows[2].balanceCheck, 'matched');

const pdfMismatchRows = sandbox.parseStatementText([
  '06/01/2026 Opening deposit 100.00 100.00',
  '06/02/2026 OpenAI subscription 20.00 81.00',
].join('\n'), 'statement.pdf');
assert.equal(pdfMismatchRows[1].balanceCheck, 'mismatch');

const splitPdfText = [
  'Transactions',
  '06/01/2026',
  'Opening deposit',
  '100.00',
  '100.00',
  '06/02/2026',
  'OpenAI subscription',
  '20.00',
  '80.00',
  '06/03/2026',
  'Stripe payout',
  '50.00',
  '130.00',
].join('\n');
const reconstructed = sandbox.reconstructStatementLines(splitPdfText);
assert.equal(JSON.stringify(reconstructed), JSON.stringify([
  '06/01/2026 Opening deposit 100.00 100.00',
  '06/02/2026 OpenAI subscription 20.00 80.00',
  '06/03/2026 Stripe payout 50.00 130.00',
]));
const splitPdfRows = sandbox.parseStatementText(splitPdfText, 'statement.pdf');
assert.equal(splitPdfRows.length, 3);
assert.equal(splitPdfRows[1].amount, -20);
assert.equal(splitPdfRows[2].balanceCheck, 'matched');

const monthNamePdfText = [
  'Transactions',
  'Jun 01, 2026',
  'Opening deposit',
  '100.00',
  '100.00',
  'Jun 02, 2026',
  'OpenAI API usage',
  '20.00',
  '80.00',
  'Jun 03, 2026 Stripe payout 50.00 130.00',
].join('\n');
assert.equal(sandbox.hasTransactionSignals('Jun 01, 2026 Opening deposit 100.00 100.00'), true);
assert.equal(JSON.stringify(sandbox.reconstructStatementLines(monthNamePdfText)), JSON.stringify([
  'Jun 01, 2026 Opening deposit 100.00 100.00',
  'Jun 02, 2026 OpenAI API usage 20.00 80.00',
  'Jun 03, 2026 Stripe payout 50.00 130.00',
]));
const monthNamePdfRows = sandbox.parseStatementText(monthNamePdfText, 'statement.pdf');
assert.equal(monthNamePdfRows.length, 3);
assert.equal(monthNamePdfRows[0].date, '2026-06-01');
assert.equal(monthNamePdfRows[1].amount, -20);
assert.equal(monthNamePdfRows[2].balanceCheck, 'matched');

const yearlessStatementText = [
  'Statement Period Jun 01, 2025 - Jun 30, 2025',
  'Jun 01 Opening deposit 100.00 100.00',
  'Jun 02 OpenAI subscription 20.00 80.00',
  'Jun 03 Stripe payout 50.00 130.00',
].join('\n');
const yearlessRows = sandbox.parseStatementText(yearlessStatementText, 'EECU June 2025.pdf');
assert.equal(yearlessRows.length, 3);
assert.equal(yearlessRows[0].date, '2025-06-01');
assert.equal(yearlessRows[1].date, '2025-06-02');
assert.equal(yearlessRows[2].balanceCheck, 'matched');

const appleProfile = sandbox.parseStatementWithProfile([
  'Transaction Date,Clearing Date,Description,Merchant,Category,Type,Amount (USD),Purchased By',
  '06/12/2026,06/13/2026,OpenAI,OPENAI,Software,Purchase,20.00,Rob',
].join('\n'), 'Apple Card.csv');
assert.equal(appleProfile.profile.id, 'apple-card');
assert.equal(appleProfile.rows[0].importProfile, 'apple-card');

const ofxSample = [
  'OFXHEADER:100',
  '<OFX>',
  '<BANKACCTFROM><ACCTID>123456789',
  '<BANKTRANLIST>',
  '<STMTTRN>',
  '<TRNTYPE>DEBIT',
  '<DTPOSTED>20260615120000[-8:PST]',
  '<TRNAMT>-20.00',
  '<FITID>fit-openai-1',
  '<NAME>OpenAI',
  '<MEMO>Subscription',
  '<STMTTRN>',
  '<TRNTYPE>CREDIT',
  '<DTPOSTED>20260616120000[-8:PST]',
  '<TRNAMT>697.00',
  '<FITID>fit-freshbooks-1',
  '<NAME>FreshBooks payment',
  '<MEMO>Invoice FB-100',
  '</BANKTRANLIST>',
  '</OFX>',
].join('\n');
const ofxProfile = sandbox.parseStatementWithProfile(ofxSample, 'bank.qfx');
assert.equal(ofxProfile.profile.id, 'ofx-qfx');
assert.equal(ofxProfile.rows.length, 2);
assert.equal(ofxProfile.rows[0].date, '2026-06-15');
assert.equal(ofxProfile.rows[0].amount, -20);
assert.equal(ofxProfile.rows[0].importKey, 'ofx|123456789|fit-openai-1');
assert.equal(ofxProfile.rows[1].amount, 697);

const escaped = sandbox.toCsv([
  ['Date', 'Description'],
  ['2026-06-01', 'Vendor, with comma'],
]);
assert.equal(escaped, 'Date,Description\n2026-06-01,"Vendor, with comma"');

const cpaRows = [
  {
    date: '2026-06-01',
    entity: 'behavior-school',
    description: 'Stripe cohort payment',
    amount: 500,
    payee: 'Stripe',
    category: 'Sales',
    approved: true,
    approvedByAutomation: true,
    approvedAt: '2026-06-30T12:00:00.000Z',
    confidence: 0.95,
    sourceFile: 'Stripe API',
    sourceFingerprint: 'src_income123',
    reconciliationStatus: 'matched',
    frappeJournalEntry: 'JV-0001',
  },
  {
    date: '2026-06-02',
    entity: 'behavior-school',
    description: 'OpenAI subscription',
    payee: 'OpenAI',
    amount: -20,
    category: 'Software and subscriptions',
    approved: false,
    confidence: 0.7,
    balanceCheck: 'mismatch',
    sourceFile: 'EECU statement.pdf',
    sourceFingerprint: 'src_eecu123',
    reconciliationStatus: 'unmatched',
  },
  {
    date: '2026-06-03',
    entity: 'rob-spain',
    description: 'Needs OCR: Apple Card.pdf',
    amount: 0,
    category: 'Document needs OCR',
    approved: false,
    confidence: 0,
    sourceFile: 'Apple Card.pdf',
    sourceFingerprint: 'src_apple123',
    reconciliationStatus: 'possible',
  },
];
const cpaSummary = sandbox.summarizeCpaRows(cpaRows);
assert.equal(cpaSummary.rowCount, 3);
assert.equal(cpaSummary.approvedCount, 1);
assert.equal(cpaSummary.automationApprovedCount, 1);
assert.equal(cpaSummary.needsReviewCount, 2);
assert.equal(cpaSummary.ocrNeededCount, 1);
assert.equal(cpaSummary.balanceMismatchCount, 1);
assert.equal(cpaSummary.frappeSyncedCount, 1);
assert.equal(cpaSummary.reconciledCount, 1);
assert.equal(cpaSummary.possibleReconciliationCount, 1);
assert.equal(cpaSummary.unmatchedReconciliationCount, 1);
const blockedClose = sandbox.accountingCloseReadiness(cpaRows);
assert.equal(blockedClose.period, '2026-06');
assert.equal(blockedClose.ready, false);
assert.equal(blockedClose.blockers.some((item) => /review exception/.test(item)), true);
assert.equal(blockedClose.blockers.some((item) => /balance mismatch/.test(item)), true);
assert.equal(blockedClose.blockers.some((item) => /OCR/.test(item)), true);
const readyClose = sandbox.accountingCloseReadiness([{
  date: '2026-07-01',
  entity: 'behavior-school',
  description: 'Stripe cohort payment',
  amount: 500,
  category: 'Sales',
  approved: true,
  confidence: 0.95,
  sourceFile: 'Stripe API',
  frappeJournalEntry: 'JV-0002',
}]);
assert.equal(readyClose.period, '2026-07');
assert.equal(readyClose.ready, true);
assert.equal(readyClose.blockers.length, 0);
const cpaMarkdown = sandbox.buildCpaSummaryMarkdown(cpaRows);
assert.match(cpaMarkdown, /# CPA Accounting Summary/);
assert.match(cpaMarkdown, /Behavior School/);
assert.match(cpaMarkdown, /Approved by automation: 1/);
assert.match(cpaMarkdown, /balance mismatch/);
assert.match(cpaMarkdown, /Document needs OCR/);
assert.match(cpaMarkdown, /src_income123/);
assert.match(cpaMarkdown, /Ask CPA whether Behavior School software subscriptions are fully deductible this month/);
const cpaReviewCsv = sandbox.buildCpaReviewCsv(cpaRows);
assert.match(cpaReviewCsv, /Reconciliation Status/);
assert.match(cpaReviewCsv, /Approved By Automation/);
assert.match(cpaReviewCsv, /Payee/);
assert.match(cpaReviewCsv, /OpenAI/);
assert.match(cpaReviewCsv, /src_eecu123/);
const cpaManifest = sandbox.buildCpaPackageManifest(cpaRows, '2026-06-30T12:00:00.000Z');
assert.equal(cpaManifest.package, 'robspain-accounting-cpa-handoff');
assert.equal(cpaManifest.period, '2026-06');
assert.equal(cpaManifest.readyForCpa, false);
assert.equal(cpaManifest.files.length, 3);
assert.equal(cpaManifest.files[0].name, 'cpa-accounting-review-20260630.csv');
assert.equal(cpaManifest.summary.rows, 3);
assert.equal(cpaManifest.summary.approvedByAutomation, 1);
assert.equal(cpaManifest.summary.balanceMismatches, 1);
assert.equal(cpaManifest.closeReadiness.ready, false);
assert.equal(cpaManifest.closeReadiness.blockers.some((item) => /OCR/.test(item)), true);
assert.equal(cpaManifest.sourceFiles.some((file) => file.name === 'Stripe API' && file.fingerprints.includes('src_income123')), true);
assert.match(cpaManifest.notes, /Behavior School software subscriptions/);

const helperRows = normalizeCsvAccountingRows(csv, {
  sourceFile: 'helper-sample.csv',
  sourceAccount: 'Stripe export',
  defaultEntity: 'behavior-school',
  defaultRevenueAccount: 'Sales - BS',
  defaultExpenseAccount: 'Expenses - BS',
  categoryAccountMap: {
    Sales: 'Sales - BS',
    'Software and subscriptions': 'Software - BS',
  },
});
assert.equal(helperRows.length, 3);
assert.equal(helperRows[0].category, 'Sales');
assert.equal(helperRows[0].frappeAccount, 'Sales - BS');
assert.equal(helperRows[1].frappeAccount, 'Software - BS');
assert.equal(helperRows[1].category, 'Software and subscriptions');
assert.equal(helperRows[1].taxCategory, 'Office expense');
assert.equal(helperRows[1].payee, 'OpenAI');
assert.equal(normalizePayee('POS DEBIT OPENAI *CHATGPT 123456 SAN FRANCISCO CA', -20), 'OpenAI');

const helperVendorRuleRows = normalizeCsvAccountingRows([
  'Date,Description,Amount',
  '2026-06-04,POS DEBIT FRESNO PRINT LAB 442321,-48.00',
].join('\n'), {
  sourceFile: 'vendor-rule-helper.csv',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
  vendorRules: [{
    id: 'rule_print_lab',
    match: 'Fresno Print Lab',
    payee: 'Fresno Print Lab',
    entity: 'behavior-school',
    category: 'Office supplies',
    taxCategory: 'Supplies',
    frappeAccount: 'Office Supplies - BS',
    autoApprove: true,
    confidence: 0.9,
  }],
});
assert.equal(helperVendorRuleRows.length, 1);
assert.equal(helperVendorRuleRows[0].payee, 'Fresno Print Lab');
assert.equal(helperVendorRuleRows[0].category, 'Office supplies');
assert.equal(helperVendorRuleRows[0].frappeAccount, 'Office Supplies - BS');
assert.equal(helperVendorRuleRows[0].automationRuleName, 'Fresno Print Lab');
assert.equal(helperVendorRuleRows[0].approved, true);

const helperBalancedRows = normalizeCsvAccountingRows(balancedBankCsv, {
  sourceFile: 'EECU export.csv',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
  importProfile: 'eecu',
  profileConfidence: 0.84,
});
assert.equal(helperBalancedRows[2].balanceCheck, 'matched');
assert.equal(helperBalancedRows[2].bankBalance, 130);

const detected = detectStatementProfile('Date,Description,Debit,Credit,Balance\n06/01/2026,EECU transfer,10.00,,100.00', 'EECU export.csv');
assert.equal(detected.id, 'eecu');

const normalizedStatement = normalizeStatementText([
  '06/04/2026 FreshBooks invoice payment 697.00',
  '06/05/2026 Google Workspace 14.99',
].join('\n'), {
  sourceFile: 'statement.txt',
  sourceAccount: 'Behavior School Bank',
  defaultEntity: 'behavior-school',
});
assert.equal(normalizedStatement.rows.length, 2);
assert.equal(normalizedStatement.rows[0].importProfile, 'statement-text');

const normalizedSubscription = normalizeStatementText('06/06/2026 OpenAI subscription 20.00', {
  sourceFile: 'statement.txt',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
  categoryAccountMap: {
    'Software and subscriptions': 'Software - BS',
  },
});
assert.equal(normalizedSubscription.rows.length, 1);
assert.equal(normalizedSubscription.rows[0].category, 'Software and subscriptions');
assert.equal(normalizedSubscription.rows[0].frappeAccount, 'Software - BS');

const helperPdfRows = normalizeStatementText([
  '06/01/2026 Opening deposit 100.00 100.00',
  '06/02/2026 OpenAI subscription 20.00 80.00',
  '06/03/2026 Stripe payout 50.00 130.00',
].join('\n'), {
  sourceFile: 'statement.pdf',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
});
assert.equal(helperPdfRows.rows.length, 3);
assert.equal(helperPdfRows.rows[1].balanceCheck, 'matched');
assert.equal(helperPdfRows.rows[1].bankBalance, 80);

assert.deepEqual(reconstructStatementLines(splitPdfText), [
  '06/01/2026 Opening deposit 100.00 100.00',
  '06/02/2026 OpenAI subscription 20.00 80.00',
  '06/03/2026 Stripe payout 50.00 130.00',
]);
const helperSplitPdfRows = normalizeStatementText(splitPdfText, {
  sourceFile: 'statement.pdf',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
});
assert.equal(helperSplitPdfRows.rows.length, 3);
assert.equal(helperSplitPdfRows.rows[2].amount, 50);
assert.equal(helperSplitPdfRows.rows[2].balanceCheck, 'matched');

assert.deepEqual(reconstructStatementLines(monthNamePdfText), [
  'Jun 01, 2026 Opening deposit 100.00 100.00',
  'Jun 02, 2026 OpenAI API usage 20.00 80.00',
  'Jun 03, 2026 Stripe payout 50.00 130.00',
]);
const helperMonthNamePdfRows = normalizeStatementText(monthNamePdfText, {
  sourceFile: 'statement.pdf',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
});
assert.equal(helperMonthNamePdfRows.profile.id, 'statement-text');
assert.equal(helperMonthNamePdfRows.rows.length, 3);
assert.equal(helperMonthNamePdfRows.rows[0].date, '2026-06-01');
assert.equal(helperMonthNamePdfRows.rows[1].amount, -20);
assert.equal(helperMonthNamePdfRows.rows[2].balanceCheck, 'matched');

const helperYearlessRows = normalizeStatementText(yearlessStatementText, {
  sourceFile: 'EECU June 2025.pdf',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
});
assert.equal(helperYearlessRows.rows.length, 3);
assert.equal(helperYearlessRows.rows[0].date, '2025-06-01');
assert.equal(helperYearlessRows.rows[1].date, '2025-06-02');
assert.equal(helperYearlessRows.rows[2].balanceCheck, 'matched');

const yearlessCsvRows = normalizeCsvAccountingRows([
  'Date,Description,Debit,Credit,Balance',
  '06/01,Opening deposit,,100.00,100.00',
  '06/02,OpenAI subscription,20.00,,80.00',
].join('\n'), {
  sourceFile: 'EECU June 2025.csv',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
});
assert.equal(yearlessCsvRows.length, 2);
assert.equal(yearlessCsvRows[0].date, '2025-06-01');
assert.equal(yearlessCsvRows[1].date, '2025-06-02');

const helperTabRows = normalizeCsvAccountingRows([
  'Date\tDescription\tDebit\tCredit\tBalance',
  '06/01/2026\tOpening deposit\t\t100.00\t100.00',
  '06/02/2026\tOpenAI subscription\t20.00\t\t80.00',
].join('\n'), {
  sourceFile: 'bank-export.tsv',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
});
assert.equal(helperTabRows.length, 2);
assert.equal(helperTabRows[1].amount, -20);
assert.equal(helperTabRows[1].balanceCheck, 'matched');

const helperSemicolonRows = normalizeCsvAccountingRows([
  'Date;Description;Debit;Credit;Balance',
  '06/01/2026;Opening deposit;;100.00;100.00',
  '06/02/2026;OpenAI subscription;20.00;;80.00',
].join('\n'), {
  sourceFile: 'bank-export-semicolon.csv',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
});
assert.equal(helperSemicolonRows.length, 2);
assert.equal(helperSemicolonRows[0].amount, 100);
assert.equal(helperSemicolonRows[1].balanceCheck, 'matched');

const helperPipeRows = normalizeCsvAccountingRows([
  'Date|Description|Debit|Credit|Balance',
  '06/01/2026|Opening deposit||100.00|100.00',
  '06/02/2026|OpenAI subscription|20.00||80.00',
].join('\n'), {
  sourceFile: 'bank-export-pipe.txt',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
});
assert.equal(helperPipeRows.length, 2);
assert.equal(helperPipeRows[1].amount, -20);

const helperOfxRows = normalizeOfxRows(ofxSample, {
  sourceFile: 'bank.qfx',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
  importProfile: 'ofx-qfx',
  profileConfidence: 0.88,
});
assert.equal(helperOfxRows.length, 2);
assert.equal(helperOfxRows[0].importKey, 'ofx|123456789|fit-openai-1');
assert.equal(helperOfxRows[0].sourceAccount, 'EECU Checking');
const helperOfxStatement = normalizeStatementText(ofxSample, {
  sourceFile: 'bank.qfx',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
});
assert.equal(helperOfxStatement.profile.id, 'ofx-qfx');
assert.equal(helperOfxStatement.rows[1].amount, 697);

const ocrRow = createOcrNeededRow({
  sourceFile: 'scanned-bank-statement.pdf',
  sourceAccount: 'EECU Checking',
  defaultEntity: 'behavior-school',
});
assert.equal(ocrRow.category, 'Document needs OCR');
assert.equal(ocrRow.approved, false);
assert.equal(ocrRow.amount, 0);

const frappeEntries = buildFrappeJournalEntries([
  {
    id: 'income-row',
    importKey: 'income-key',
    date: '2026-06-12',
    description: 'Behavior School payment',
    amount: 100,
    approved: true,
    category: 'Sales',
    entity: 'behavior-school',
    sourceFile: 'stripe.csv',
    frappeAccount: 'Sales - BS',
  },
  {
    id: 'expense-row',
    importKey: 'expense-key',
    date: '2026-06-13',
    description: 'OpenAI subscription',
    amount: -20,
    approved: true,
    category: 'Software and subscriptions',
    entity: 'behavior-school',
    sourceFile: 'bank.csv',
    frappeAccount: 'Software - BS',
  },
  ocrRow,
], {
  company: 'Behavior School LLC',
  defaultBankAccount: 'Checking - BS',
});
assert.equal(frappeEntries.length, 2);
assert.equal(frappeEntries[0].doc.doctype, 'Journal Entry');
assert.equal(frappeEntries[0].doc.accounts[0].account, 'Checking - BS');
assert.equal(frappeEntries[0].doc.accounts[0].debit_in_account_currency, 100);
assert.equal(frappeEntries[0].doc.accounts[1].credit_in_account_currency, 100);
assert.equal(frappeEntries[1].payee, 'OpenAI');
assert.match(frappeEntries[1].doc.user_remark, /OpenAI/);
assert.equal(frappeEntries[1].doc.accounts[0].account, 'Software - BS');
assert.equal(frappeEntries[1].doc.accounts[1].account, 'Checking - BS');

const stripeRows = normalizeStripeBalanceTransaction({
  id: 'txn_test_123',
  created: 1780272000,
  reporting_category: 'charge',
  description: 'Behavior School cohort',
  amount: 199700,
  fee: 6091,
  net: 193609,
}, { defaultEntity: 'behavior-school' });
assert.equal(stripeRows.length, 2);
assert.equal(stripeRows[0].amount, 1997);
assert.equal(stripeRows[1].amount, -60.91);
assert.equal(stripeRows[1].category, 'Merchant fees');
assert.equal(stripeRows[1].taxCategory, 'Bank charges / merchant fees');
assert.equal(stripeRows[1].frappeAccount, 'Bank charges / merchant fees');

const invoiceRow = normalizeFreshBooksInvoice({
  invoiceid: '42',
  invoice_number: 'FB-42',
  customer_name: 'District Office',
  date_paid: '2026-06-10',
  amount_paid: { amount: '1997.00' },
}, { defaultEntity: 'behavior-school' });
assert.equal(invoiceRow.amount, 1997);
assert.match(invoiceRow.description, /FB-42/);

const sourceImport = require('../src/netlify/functions/accounting-source-import.js');
const sourceResponse = await sourceImport.handler({
  httpMethod: 'POST',
  headers: protectedHeaders(),
  queryStringParameters: {},
  body: JSON.stringify({
    source: 'freshbooks',
    sourceFile: 'verify-freshbooks.json',
    entity: 'behavior-school',
    defaultRevenueAccount: 'Sales - BS',
    categoryAccountMap: {
      Sales: 'Sales - BS',
    },
    freshBooksInvoices: [{
      invoiceid: '99',
      invoice_number: 'FB-99',
      customer_name: 'SELPA',
      date_paid: '2026-06-11',
      amount_paid: { amount: '697.00' },
    }],
  }),
});
assert.equal([200, 202].includes(sourceResponse.statusCode), true);
const sourceBody = JSON.parse(sourceResponse.body);
assert.equal(sourceBody.rows.length, 1);
assert.equal(sourceBody.rows[0].amount, 697);
assert.equal(sourceBody.rows[0].frappeAccount, 'Sales - BS');
assert.equal(sourceBody.importRun.source, 'freshbooks');
assert.equal(sourceBody.importRun.inserted, 1);
assert.match(sourceBody.importRun.fingerprint, /^src_[0-9a-f]{8}$/);

const accountingData = require('../src/netlify/functions/accounting-data.js');
const accountingDataResponse = await accountingData.handler({
  httpMethod: 'PUT',
  headers: protectedHeaders(),
  queryStringParameters: {},
  body: JSON.stringify({
    activeEntity: 'behavior-school',
    defaultFrappeAccount: 'Expenses',
    reviewQueue: [],
    importedFiles: [],
    importRuns: [{
      id: 'run_verify_1',
      source: 'verify',
      sourceFile: 'verify.csv',
      status: 'success',
      inserted: 1,
      skipped: 0,
      rowCount: 1,
      persisted: true,
      fingerprint: 'src_verify',
      startedAt: '2026-06-30T12:00:00.000Z',
      finishedAt: '2026-06-30T12:00:00.000Z',
    }],
    frappeRuns: [{
      id: 'frappe_verify_1',
      mode: 'preview',
      status: 'success',
      configured: false,
      rowCount: 1,
      entryCount: 1,
      created: 0,
      failed: 0,
      skipped: 0,
      company: 'Behavior School LLC',
      defaultBankAccount: 'Checking - BS',
      startedAt: '2026-06-30T12:00:00.000Z',
      finishedAt: '2026-06-30T12:00:00.000Z',
    }],
    vendorRules: [{
      id: 'rule_verify_print_lab',
      match: 'Fresno Print Lab',
      payee: 'Fresno Print Lab',
      entity: 'behavior-school',
      category: 'Office supplies',
      taxCategory: 'Supplies',
      frappeAccount: 'Office Supplies - BS',
      autoApprove: true,
      confidence: 0.9,
      createdAt: '2026-06-30T12:00:00.000Z',
      updatedAt: '2026-06-30T12:00:00.000Z',
    }],
    frappeSettings: {
      company: 'Behavior School LLC',
      defaultBankAccount: 'Checking - BS',
      defaultRevenueAccount: 'Sales - BS',
      defaultExpenseAccount: 'Expenses - BS',
      categoryAccountMap: {
        Sales: 'Sales - BS',
        'Software and subscriptions': 'Software - BS',
      },
    },
  }),
});
assert.equal([200, 202].includes(accountingDataResponse.statusCode), true);
const accountingDataBody = JSON.parse(accountingDataResponse.body);
assert.equal(accountingDataBody.accounting.frappeSettings.company, 'Behavior School LLC');
assert.equal(accountingDataBody.accounting.frappeSettings.defaultBankAccount, 'Checking - BS');
assert.equal(accountingDataBody.accounting.importRuns.length, 1);
assert.equal(accountingDataBody.accounting.importRuns[0].sourceFile, 'verify.csv');
assert.equal(accountingDataBody.accounting.frappeRuns.length, 1);
assert.equal(accountingDataBody.accounting.frappeRuns[0].mode, 'preview');
assert.equal(accountingDataBody.accounting.vendorRules.length, 1);
assert.equal(accountingDataBody.accounting.vendorRules[0].payee, 'Fresno Print Lab');
assert.equal(accountingDataBody.accounting.frappeSettings.categoryAccountMap.Sales, 'Sales - BS');
assert.equal(accountingDataBody.accounting.frappeSettings.categoryAccountMap['Software and subscriptions'], 'Software - BS');

const originalEnv = { ...process.env };
process.env.FRESHBOOKS_ACCESS_TOKEN = 'freshbooks_test_token';
process.env.FRESHBOOKS_ACCOUNT_ID = 'acct_test';
process.env.STRIPE_SECRET_KEY = 'sk_test_accounting';
const originalFetch = global.fetch;
global.fetch = async (url, options = {}) => {
  if (String(url).includes('api.stripe.com')) {
    assert.match(String(url), /stripe\.com\/v1\/balance_transactions/);
    assert.equal(options.headers.Authorization, 'Bearer sk_test_accounting');
    assert.equal(options.headers['Stripe-Version'], '2026-02-25.clover');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: [{
          id: 'txn_auto_123',
          created: 1780704000,
          reporting_category: 'charge',
          description: 'Behavior School automated import',
          amount: 50000,
          fee: 1525,
          net: 48475,
        }],
        has_more: false,
      }),
    };
  }
  if (String(url).includes('freshbooks.com')) {
    assert.match(String(url), /freshbooks\.com\/accounting\/account\/acct_test\/invoices\/invoices/);
    assert.equal(options.headers.Authorization, 'Bearer freshbooks_test_token');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        response: {
          result: {
            invoices: [{
              invoiceid: '123',
              invoice_number: 'FB-123',
              organization: 'District Office',
              date_paid: '2026-06-15',
              payment_status: 'paid',
              paid: { amount: '997.00' },
            }],
            page: 1,
            pages: 1,
            total: 1,
          },
        },
      }),
    };
  }
  throw new Error('Unexpected fetch URL in accounting verifier: ' + url);
};
const freshBooksLiveResponse = await sourceImport.handler({
  httpMethod: 'GET',
  headers: protectedHeaders(),
  queryStringParameters: { source: 'freshbooks', entity: 'behavior-school', limit: '10' },
});
assert.equal([200, 202].includes(freshBooksLiveResponse.statusCode), true);
const freshBooksLiveBody = JSON.parse(freshBooksLiveResponse.body);
assert.equal(freshBooksLiveBody.rows.length, 1);
assert.equal(freshBooksLiveBody.rows[0].amount, 997);
assert.equal(freshBooksLiveBody.rows[0].sourceAccount, 'FreshBooks');

const connectedImportResponse = await sourceImport.handler({
  httpMethod: 'GET',
  headers: protectedHeaders(),
  queryStringParameters: { source: 'all', entity: 'behavior-school', limit: '10' },
});
assert.equal([200, 202].includes(connectedImportResponse.statusCode), true);
const connectedImportBody = JSON.parse(connectedImportResponse.body);
assert.equal(connectedImportBody.rows.length, 3);
assert.equal(connectedImportBody.rows.some((row) => row.importKey === 'stripe|txn_auto_123|net'), true);
assert.equal(connectedImportBody.rows.some((row) => row.importKey === 'stripe|txn_auto_123|fee'), true);
assert.equal(connectedImportBody.rows.some((row) => row.importKey === 'freshbooks|invoice|123'), true);
assert.equal(connectedImportBody.rows.every((row) => /^src_[0-9a-f]{8}$/.test(row.sourceFingerprint)), true);
assert.equal(connectedImportBody.meta.source, 'connected');
assert.equal(connectedImportBody.meta.errors.length, 0);

const autoImport = require('../src/netlify/functions/accounting-auto-import.js');
const autoImportResponse = await autoImport.runAccountingAutoImport({
  entity: 'behavior-school',
  limit: '10',
  sources: 'stripe,freshbooks',
});
assert.equal(autoImportResponse.statusCode, 200);
assert.equal(autoImportResponse.body.success, true);
assert.equal(autoImportResponse.body.inserted, 3);
assert.equal(autoImportResponse.body.meta.source, 'connected');
global.fetch = originalFetch;
process.env = originalEnv;

const frappeSync = require('../src/netlify/functions/accounting-frappe-sync.js');
const frappeResponse = await frappeSync.handler({
  httpMethod: 'POST',
  headers: protectedHeaders(),
  queryStringParameters: {},
  body: JSON.stringify({
    dryRun: false,
    rows: [{
      id: 'sync-row',
      importKey: 'sync-key',
      date: '2026-06-14',
      description: 'Behavior School invoice payment',
      amount: 697,
      approved: true,
      category: 'Sales',
      entity: 'behavior-school',
      sourceFile: 'verify.csv',
      frappeAccount: 'Sales - BS',
    }],
    company: 'Behavior School LLC',
    defaultBankAccount: 'Checking - BS',
  }),
});
assert.equal(frappeResponse.statusCode, 202);
const frappeBody = JSON.parse(frappeResponse.body);
assert.equal(frappeBody.dryRun, true);
assert.equal(frappeBody.entries.length, 1);
assert.equal(frappeBody.entries[0].doc.accounts.length, 2);
assert.equal(frappeBody.frappeRun.mode, 'preview');
assert.equal(frappeBody.frappeRun.entryCount, 1);
assert.equal(frappeBody.frappeRun.rowCount, 1);

const accountingStatus = require('../src/netlify/functions/accounting-status.js');
const statusResponse = await accountingStatus.handler({
  httpMethod: 'GET',
  headers: protectedHeaders(),
  queryStringParameters: {},
});
assert.equal(statusResponse.statusCode, 200);
const statusBody = JSON.parse(statusResponse.body);
assert.equal(Array.isArray(statusBody.services), true);
assert.equal(statusBody.services.some((item) => item.id === 'stripe'), true);
assert.equal(statusBody.services.some((item) => item.id === 'scheduled-imports'), true);
assert.equal(statusBody.services.some((item) => item.id === 'browser-ocr' && item.configured), true);

console.log('Accounting Hub parser/export verification passed.');
