const ACCOUNTING_CATEGORY_RULES = [
  { match: /openai|anthropic|claude|google|workspace|notion|zoom|calendly|netlify|vercel|github|software|app store|apple\.com\/bill|subscription/i, category: 'Software and subscriptions', taxCategory: 'Office expense', confidence: 0.84 },
  { match: /stripe fee|processing fee|merchant fee|card fee/i, category: 'Merchant fees', taxCategory: 'Bank charges / merchant fees', confidence: 0.92 },
  { match: /stripe|payout|freshbooks|invoice|behavior school|gumroad|teachable|kajabi|customer|client payment|course|cohort|tuition|paid invoice/i, category: 'Sales', taxCategory: 'Gross receipts', confidence: 0.91 },
  { match: /meta|facebook|instagram|google ads|youtube|mailchimp|convertkit|beehiiv|advertising|marketing/i, category: 'Advertising and marketing', taxCategory: 'Advertising', confidence: 0.88 },
  { match: /fiverr|upwork|contractor|assistant|freelance|supporting hands|collier/i, category: 'Contract labor', taxCategory: 'Contract labor', confidence: 0.78 },
  { match: /office depot|staples|amazon|printer|paper|supplies/i, category: 'Office supplies', taxCategory: 'Supplies', confidence: 0.73 },
  { match: /irs|ftb|tax|franchise tax|estimated tax/i, category: 'Taxes and licenses', taxCategory: 'Taxes and licenses', confidence: 0.86 },
  { match: /pge|xfinity|at&t|att|phone|internet|utilities/i, category: 'Utilities', taxCategory: 'Utilities', confidence: 0.65 },
  { match: /eecu|transfer|payment|autopay|credit card|apple card|discover|loan/i, category: 'Transfer or debt payment', taxCategory: 'Balance sheet / review', confidence: 0.7 },
  { match: /costco|target|walmart|grocery|restaurant|doordash|uber eats|starbucks/i, category: 'Meals or personal review', taxCategory: 'Meals / personal review', confidence: 0.52 },
];

const ENTITY_DEFAULT_REVENUE = {
  'behavior-school': 'Sales',
  'rob-spain': 'Sales',
  household: 'Owner Contributions',
};

const ENTITY_LABELS = {
  'behavior-school': 'Behavior School',
  'rob-spain': 'Rob Spain',
  household: 'Household',
};

function defaultCategoryAccountMap(settings = {}) {
  const revenue = settings.defaultRevenueAccount || 'Sales';
  const expense = settings.defaultExpenseAccount || settings.defaultFrappeAccount || 'Expenses';
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

function accountForCategory(category, amount, entity, options = {}) {
  const map = {
    ...defaultCategoryAccountMap(options),
    ...(options.categoryAccountMap || {}),
  };
  if (map[category]) return map[category];
  if (Number(amount) >= 0) return options.defaultRevenueAccount || ENTITY_DEFAULT_REVENUE[entity] || 'Sales';
  return options.defaultExpenseAccount || options.defaultFrappeAccount || 'Expenses';
}

function normalizeDate(value, fallbackYear) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d+$/.test(raw) && Number(raw) > 1000000000) {
    return new Date(Number(raw) * 1000).toISOString().slice(0, 10);
  }
  const monthName = raw.match(/^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,?\s+(\d{2,4}))?$/i);
  if (monthName) {
    const currentYear = new Date().getFullYear();
    const month = monthIndex(monthName[1]);
    const year = monthName[3] ? Number(monthName[3].length === 2 ? '20' + monthName[3] : monthName[3]) : (fallbackYear || currentYear);
    return [year, String(month).padStart(2, '0'), String(monthName[2]).padStart(2, '0')].join('-');
  }
  const mdy = raw.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/);
  if (mdy) {
    const currentYear = new Date().getFullYear();
    const year = mdy[3] ? Number(mdy[3].length === 2 ? '20' + mdy[3] : mdy[3]) : (fallbackYear || currentYear);
    return [year, String(mdy[1]).padStart(2, '0'), String(mdy[2]).padStart(2, '0')].join('-');
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function monthIndex(value) {
  const month = String(value || '').toLowerCase().replace(/\./g, '').slice(0, 3);
  return ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(month) + 1;
}

function inferStatementYear(text, sourceName = '') {
  const haystack = [sourceName, text].filter(Boolean).join('\n');
  const explicitYears = [...haystack.matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));
  if (!explicitYears.length) return new Date().getFullYear();
  const counts = new Map();
  explicitYears.forEach((year) => counts.set(year, (counts.get(year) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

function normalizeAmount(value) {
  if (typeof value === 'number') return value;
  let raw = String(value || '').trim();
  const neg = raw.includes('(') && raw.includes(')');
  raw = raw.replace(/[,$()]/g, '');
  const num = Number.parseFloat(raw);
  if (!Number.isFinite(num)) return NaN;
  return neg ? -Math.abs(num) : num;
}

function inferEntity(text, fallback = 'behavior-school') {
  if (/behavior school|stripe|freshbooks|invoice|rbt|bcba|student|cohort|course|tuition|customer/i.test(text)) return 'behavior-school';
  if (/robspain|speaking|consulting|calaba|website|rob spain/i.test(text)) return 'rob-spain';
  return fallback;
}

function classifyTransaction(description, amount) {
  const rule = ACCOUNTING_CATEGORY_RULES.find((candidate) => candidate.match.test(description));
  if (rule) return rule;
  if (amount > 0) return { category: 'Sales', taxCategory: 'Gross receipts', confidence: 0.6 };
  return { category: 'Uncategorized', taxCategory: 'Needs CPA review', confidence: 0.35 };
}

function normalizePayee(description, amount) {
  const raw = String(description || '').trim();
  if (!raw) return Number(amount) >= 0 ? 'Customer' : 'Vendor';
  const known = [
    [/openai|chatgpt/i, 'OpenAI'],
    [/anthropic|claude/i, 'Anthropic'],
    [/google.*workspace|google/i, 'Google'],
    [/stripe/i, 'Stripe'],
    [/freshbooks/i, 'FreshBooks'],
    [/github/i, 'GitHub'],
    [/netlify/i, 'Netlify'],
    [/vercel/i, 'Vercel'],
    [/zoom/i, 'Zoom'],
    [/calendly/i, 'Calendly'],
    [/apple\.com\/bill|apple/i, 'Apple'],
    [/xfinity|comcast/i, 'Xfinity'],
    [/at&t|att\b/i, 'AT&T'],
    [/eecu|educational employees/i, 'EECU'],
  ];
  const found = known.find(([pattern]) => pattern.test(raw));
  if (found) return found[1];
  const cleaned = raw
    .replace(/\b(pos|debit|credit|card|purchase|checkcard|visa|mastercard|ach|online|mobile|payment|autopay|withdrawal|deposit|transfer)\b/gi, ' ')
    .replace(/\b(auth|trace|ref|id|terminal|term|seq|fitid)[:#]?\s*[a-z0-9-]+\b/gi, ' ')
    .replace(/\b\d{2}\/\d{2}(?:\/\d{2,4})?\b/g, ' ')
    .replace(/\b\d{4,}\b/g, ' ')
    .replace(/[*#_]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const candidate = cleaned || raw;
  return candidate
    .split(/\s+/)
    .slice(0, 6)
    .join(' ')
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    .slice(0, 64);
}

function applyVendorRulesToRow(row, vendorRules = []) {
  if (!row || !Array.isArray(vendorRules) || !vendorRules.length) return row;
  const haystack = [row.payee, row.description, row.sourceAccount].filter(Boolean).join(' ').toLowerCase();
  const rule = vendorRules.find((candidate) => {
    const match = String(candidate.match || candidate.payee || '').trim().toLowerCase();
    return match && haystack.includes(match);
  });
  if (!rule) return row;
  row.payee = row.payee || normalizePayee(row.description, row.amount);
  row.entity = rule.entity || row.entity;
  row.category = rule.category || row.category;
  row.taxCategory = rule.taxCategory || row.taxCategory;
  row.frappeAccount = rule.frappeAccount || row.frappeAccount;
  row.confidence = Math.max(Number(row.confidence || 0), Number(rule.confidence || 0.9));
  row.automationRuleId = rule.id || '';
  row.automationRuleName = rule.payee || rule.match || '';
  if (rule.autoApprove && isVendorRuleAutoApprovalSafe(row)) {
    row.approved = true;
    row.approvedByAutomation = true;
    row.approvedAt = row.approvedAt || new Date().toISOString();
  }
  return row;
}

function isVendorRuleAutoApprovalSafe(row) {
  if (!row.sourceFile || !row.frappeAccount) return false;
  if (!Number.isFinite(Number(row.amount)) || Number(row.amount) === 0) return false;
  if (row.category === 'Document needs OCR' || row.category === 'Personal / exclude') return false;
  if (row.balanceCheck === 'mismatch') return false;
  return Number(row.confidence || 0) >= 0.75 || row.balanceCheck === 'matched' || row.reconciliationStatus === 'matched';
}

function detectStatementProfile(text, sourceName = '') {
  const raw = String(text || '');
  const firstLine = raw.split(/\r?\n/).find((line) => line.trim()) || '';
  const headerHaystack = `${sourceName}\n${firstLine}`.toLowerCase();
  const csvLike = isDelimitedHeader(firstLine);
  const statementDatePattern = String.raw`(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}(?:,?\s+\d{2,4})?)`;
  const transactionLineCount = raw.split(/\r?\n/).filter((line) => (
    new RegExp(`${statementDatePattern}\\s+.+?\\s+-?\\$?\\(?\\d[\\d,]*\\.\\d{2}\\)?\\s*$`, 'i').test(line.trim())
  )).length;

  if (/<OFX|<STMTTRN|\.ofx|\.qfx/i.test(`${sourceName}\n${raw.slice(0, 1000)}`)) {
    return { id: 'ofx-qfx', label: 'OFX/QFX bank export', confidence: 0.88, format: 'ofx' };
  }
  if (/transaction date.*clearing date.*merchant.*amount|amount \(usd\)/i.test(headerHaystack) || /apple card/i.test(String(sourceName || ''))) {
    return { id: 'apple-card', label: 'Apple Card CSV', confidence: 0.9, format: 'csv' };
  }
  if (/balance_transaction|reporting_category|available_on|stripe balance/i.test(headerHaystack) || /stripe/i.test(String(sourceName || '')) && csvLike) {
    return { id: 'stripe-csv', label: 'Stripe CSV export', confidence: 0.9, format: csvLike ? 'csv' : 'text' };
  }
  if (/invoice_number|invoiceid|client_name|customer_name|amount_paid/i.test(headerHaystack) || /freshbooks/i.test(String(sourceName || '')) && csvLike) {
    return { id: 'freshbooks-csv', label: 'FreshBooks export', confidence: 0.86, format: csvLike ? 'csv' : 'text' };
  }
  if (/eecu|educational employees credit union|debit.*credit.*balance|withdrawal.*deposit/i.test(headerHaystack)) {
    return { id: 'eecu', label: 'EECU statement/export', confidence: 0.84, format: csvLike ? 'csv' : 'text' };
  }
  if (csvLike) {
    return { id: 'generic-csv', label: 'Generic CSV statement', confidence: 0.68, format: 'csv' };
  }
  if (transactionLineCount > 0) {
    return { id: 'statement-text', label: 'Statement text', confidence: Math.min(0.75, 0.48 + (transactionLineCount * 0.05)), format: 'text' };
  }
  return { id: 'unknown', label: 'Unknown statement format', confidence: 0.1, format: 'unknown' };
}

function normalizeAccountingRow(row, options = {}) {
  const defaultEntity = options.defaultEntity || 'behavior-school';
  const defaultExpenseAccount = options.defaultFrappeAccount || 'Expenses';
  const sourceFile = row.sourceFile || options.sourceFile || 'source-import';
  const sourceAccount = row.sourceAccount || options.sourceAccount || 'Source import';
  const desc = String(row.description || row.desc || row.memo || row.name || row.label || '').trim();
  const date = normalizeDate(row.date || row.transactionDate || row.postedDate || row.created || row.createdAt || '', options.statementYear);
  const amount = normalizeAmount(row.amount);

  if (!desc || !date || !Number.isFinite(amount) || amount === 0) return null;

  const entity = row.entity || inferEntity(desc, defaultEntity);
  const classified = classifyTransaction(desc, amount);
  const category = row.category || classified.category;
  const taxCategory = row.taxCategory || classified.taxCategory;
  const mappedFrappeAccount = accountForCategory(category, amount, entity, { ...options, defaultFrappeAccount: defaultExpenseAccount });
  const incomingFrappeAccount = String(row.frappeAccount || '').trim();
  const keepIncomingFrappeAccount = incomingFrappeAccount && !['Sales', 'Expenses'].includes(incomingFrappeAccount);
  const importKey = row.importKey || [date, desc.toLowerCase(), amount.toFixed(2), sourceFile].join('|');

  const normalized = {
    id: row.id || `acct_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
    importKey,
    date,
    description: desc,
    payee: row.payee || normalizePayee(desc, amount),
    amount,
    sourceAccount,
    sourceFile,
    sourceFingerprint: row.sourceFingerprint || options.sourceFingerprint || '',
    entity,
    category,
    taxCategory,
    frappeAccount: keepIncomingFrappeAccount ? incomingFrappeAccount : mappedFrappeAccount,
    confidence: row.confidence ?? classified.confidence,
    approved: row.approved ?? ((row.confidence ?? classified.confidence) >= 0.85),
    notes: row.notes || options.notes || '',
    importProfile: row.importProfile || options.importProfile || '',
    bankBalance: Number.isFinite(normalizeAmount(row.bankBalance ?? row.balance)) ? normalizeAmount(row.bankBalance ?? row.balance) : undefined,
    balanceCheck: row.balanceCheck || '',
    importedAt: row.importedAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
  return applyVendorRulesToRow(normalized, options.vendorRules || []);
}

function isDelimitedHeader(line) {
  const delimiter = detectCsvDelimiter(line);
  return Boolean(delimiter) && /date|posted|description|merchant|amount|debit|credit|balance|transaction|invoice|customer|memo/i.test(line);
}

function detectCsvDelimiter(line) {
  const raw = String(line || '');
  const candidates = [',', '\t', ';', '|'];
  let best = '';
  let bestCount = 0;
  candidates.forEach((delimiter) => {
    const count = parseCsvLine(raw, delimiter).length - 1;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  });
  return bestCount > 0 ? best : '';
}

function parseCsvLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvRows(text) {
  const lines = String(text || '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const delimiter = detectCsvDelimiter(lines[0]) || ',';
  const headers = parseCsvLine(lines[0], delimiter).map((header) => header.toLowerCase().trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}

function pick(row, names) {
  for (const name of names) {
    const key = Object.keys(row).find((candidate) => candidate === name || candidate.includes(name));
    if (key && row[key] !== '') return row[key];
  }
  return '';
}

function normalizeCsvAccountingRows(text, options = {}) {
  const statementYear = options.statementYear || inferStatementYear(text, options.sourceFile || options.sourceAccount || '');
  const parsedRows = parseCsvRows(text).map((row) => {
    const debit = normalizeAmount(pick(row, ['debit', 'withdrawal', 'charge']));
    const credit = normalizeAmount(pick(row, ['credit', 'deposit']));
    let amount = normalizeAmount(pick(row, ['amount', 'net', 'total', 'paid']));
    const balance = normalizeAmount(pick(row, ['balance', 'running balance', 'available balance']));
    if (Number.isFinite(debit) && Math.abs(debit) > 0) amount = -Math.abs(debit);
    if (Number.isFinite(credit) && Math.abs(credit) > 0) amount = Math.abs(credit);
    return {
      date: pick(row, ['date', 'posted', 'created']),
      description: pick(row, ['description', 'merchant', 'payee', 'customer', 'name', 'memo', 'invoice']),
      amount,
      bankBalance: Number.isFinite(balance) ? balance : undefined,
      sourceAccount: options.sourceAccount,
      sourceFile: options.sourceFile,
      entity: options.defaultEntity,
      confidence: options.profileConfidence,
      importProfile: options.importProfile,
      notes: options.importProfile ? `Parsed as ${options.importProfile}` : '',
    };
  });
  return applyCsvBalanceValidation(parsedRows)
    .map((row) => normalizeAccountingRow(row, { ...options, statementYear }))
    .filter(Boolean);
}

function applyCsvBalanceValidation(rows) {
  const parsed = rows.filter((row) => row && row.description && Number.isFinite(row.amount) && row.amount !== 0);
  const balanceRows = parsed.filter((row) => Number.isFinite(row.bankBalance));
  if (balanceRows.length < 2) return parsed;

  let forwardMatches = 0;
  let reverseMatches = 0;
  for (let index = 1; index < parsed.length; index += 1) {
    const prev = parsed[index - 1];
    const row = parsed[index];
    if (Number.isFinite(prev.bankBalance) && Number.isFinite(row.bankBalance) && Math.abs((prev.bankBalance + row.amount) - row.bankBalance) < 0.01) {
      forwardMatches += 1;
    }
  }
  for (let index = 0; index < parsed.length - 1; index += 1) {
    const row = parsed[index];
    const next = parsed[index + 1];
    if (Number.isFinite(row.bankBalance) && Number.isFinite(next.bankBalance) && Math.abs((row.bankBalance - row.amount) - next.bankBalance) < 0.01) {
      reverseMatches += 1;
    }
  }
  const order = reverseMatches > forwardMatches ? 'reverse' : 'forward';

  return parsed.map((row, index) => {
    let expected = NaN;
    if (order === 'forward' && index > 0 && Number.isFinite(parsed[index - 1].bankBalance)) {
      expected = parsed[index - 1].bankBalance + row.amount;
    } else if (order === 'reverse' && index < parsed.length - 1 && Number.isFinite(parsed[index + 1].bankBalance)) {
      expected = parsed[index + 1].bankBalance + row.amount;
    }

    if (!Number.isFinite(row.bankBalance) || !Number.isFinite(expected)) {
      return { ...row, balanceCheck: 'unchecked' };
    }
    const mismatch = Math.abs(expected - row.bankBalance) >= 0.01;
    if (!mismatch) return { ...row, balanceCheck: 'matched' };
    const warning = `Running balance mismatch: expected ${expected.toFixed(2)}, saw ${row.bankBalance.toFixed(2)}.`;
    return {
      ...row,
      balanceCheck: 'mismatch',
      confidence: Math.min(row.confidence ?? 0.5, 0.45),
      notes: [row.notes, warning].filter(Boolean).join(' '),
    };
  });
}

function normalizeOfxRows(text, options = {}) {
  const raw = String(text || '');
  const accountId = ofxTag(raw, 'ACCTID') || options.sourceAccount || 'OFX account';
  const blocks = [...raw.matchAll(/<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|<\/CREDITCARDMSGSRSV1>|<\/OFX>|$)/gi)]
    .map((match) => match[1]);
  return blocks.map((block) => {
    const amount = normalizeAmount(ofxTag(block, 'TRNAMT'));
    const date = normalizeOfxDate(ofxTag(block, 'DTPOSTED') || ofxTag(block, 'DTUSER'));
    const name = ofxTag(block, 'NAME');
    const memo = ofxTag(block, 'MEMO');
    const fitid = ofxTag(block, 'FITID');
    const description = [name, memo].filter(Boolean).join(' - ') || ofxTag(block, 'TRNTYPE') || 'OFX transaction';
    if (!description || !date || !Number.isFinite(amount) || amount === 0) return null;
    return normalizeAccountingRow({
      importKey: fitid ? `ofx|${accountId}|${fitid}` : undefined,
      date,
      description,
      amount,
      sourceAccount: options.sourceAccount || `OFX ${accountId}`,
      sourceFile: options.sourceFile,
      entity: options.defaultEntity,
      confidence: options.profileConfidence,
      importProfile: options.importProfile,
      notes: `Parsed as ${options.importProfile || 'ofx-qfx'}${fitid ? `; FITID ${fitid}` : ''}`,
    }, options);
  }).filter(Boolean);
}

function ofxTag(text, tag) {
  const match = String(text || '').match(new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i'));
  return match ? match[1].trim() : '';
}

function normalizeOfxDate(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return '';
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function normalizeStatementLineRows(text, options = {}) {
  const lines = reconstructStatementLines(text);
  const parsedRows = applyCsvBalanceValidation(lines.map((line) => parseStatementLine(line, options)).filter(Boolean));
  return parsedRows.map((row) => normalizeAccountingRow(row, options)).filter(Boolean);
}

function reconstructStatementLines(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const dateStart = /^(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}(?:,?\s+\d{2,4})?)(?:\s+|$)/i;
  const rows = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!dateStart.test(lines[index])) continue;
    let candidate = lines[index];
    let cursor = index + 1;
    while (cursor < lines.length && !dateStart.test(lines[cursor]) && cursor - index <= 8) {
      candidate += ` ${lines[cursor]}`;
      cursor += 1;
    }
    rows.push(candidate);
    index = cursor - 1;
  }

  return rows;
}

function parseStatementLine(line, options = {}) {
  const linePattern = /^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}(?:,?\s+\d{2,4})?)\s+(.+)$/i;
  const match = String(line || '').trim().match(linePattern);
  if (!match) return null;
  const date = match[1];
  const rest = match[2].trim();
  const moneyPattern = /-?\$?\(?\d[\d,]*\.\d{2}\)?/g;
  const moneyMatches = [...rest.matchAll(moneyPattern)];
  if (!moneyMatches.length) return null;

  const lastMoney = moneyMatches[moneyMatches.length - 1];
  const previousMoney = moneyMatches.length > 1 ? moneyMatches[moneyMatches.length - 2] : null;
  const hasPossibleBalance = Boolean(previousMoney && lastMoney.index + lastMoney[0].length === rest.length);
  const amountToken = hasPossibleBalance ? previousMoney[0] : lastMoney[0];
  const balanceToken = hasPossibleBalance ? lastMoney[0] : '';
  const descEnd = hasPossibleBalance ? previousMoney.index : lastMoney.index;
  const desc = rest.slice(0, descEnd).replace(/\s+[-–—]\s*$/, '').trim();
  if (!desc) return null;

  let amount = normalizeAmount(amountToken);
  const bankBalance = normalizeAmount(balanceToken);
  if (amount > 0 && !/deposit|credit|payout|payroll|invoice|stripe|refund|transfer from/i.test(desc)) {
    amount = -Math.abs(amount);
  }

  return {
    date: normalizeDate(date, options.statementYear),
    description: desc,
    amount,
    bankBalance: Number.isFinite(bankBalance) ? bankBalance : undefined,
    sourceAccount: options.sourceAccount,
    sourceFile: options.sourceFile,
    entity: options.defaultEntity,
    confidence: options.profileConfidence,
    importProfile: options.importProfile,
    notes: options.importProfile ? `Parsed as ${options.importProfile}` : '',
  };
}

function normalizeStatementText(text, options = {}) {
  const profile = detectStatementProfile(text, options.sourceFile || options.sourceAccount || '');
  const parserOptions = {
    ...options,
    importProfile: profile.id,
    profileConfidence: options.profileConfidence || profile.confidence,
    statementYear: options.statementYear || inferStatementYear(text, options.sourceFile || options.sourceAccount || ''),
  };
  const rows = profile.format === 'csv'
    ? normalizeCsvAccountingRows(text, parserOptions)
    : profile.format === 'ofx'
      ? normalizeOfxRows(text, parserOptions)
      : normalizeStatementLineRows(text, parserOptions);
  const warnings = [];
  if (!rows.length) warnings.push('No transaction rows were normalized from this statement text.');
  if (profile.id === 'unknown') warnings.push('Unknown statement format; manual review or OCR may be needed.');
  return { rows, profile, warnings };
}

function createOcrNeededRow(options = {}) {
  const sourceFile = options.sourceFile || 'scanned statement';
  const sourceAccount = options.sourceAccount || 'Imported statement';
  const entity = options.defaultEntity || options.entity || 'behavior-school';
  const reason = options.reason || 'PDF appears scanned or image-only; OCR text is needed before transaction import.';
  const now = new Date().toISOString();
  return {
    id: options.id || `ocr_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
    importKey: options.importKey || ['ocr-needed', sourceFile, sourceAccount, entity].join('|').toLowerCase(),
    date: now.slice(0, 10),
    description: `Needs OCR: ${sourceFile}`,
    amount: 0,
    sourceAccount,
    sourceFile,
    entity,
    category: 'Document needs OCR',
    taxCategory: 'Needs document review',
    frappeAccount: 'Document review',
    confidence: 0,
    approved: false,
    notes: reason,
    importProfile: 'ocr-needed',
    importedAt: now,
    updatedAt: now,
  };
}

function isFrappeExportableRow(row) {
  return Boolean(
    row
    && row.approved
    && row.category !== 'Personal / exclude'
    && row.category !== 'Document needs OCR'
    && Number.isFinite(Number(row.amount))
    && Number(row.amount) !== 0
  );
}

function accountForEntity(entity, options = {}) {
  const key = String(entity || '').replace(/-/g, '_').toUpperCase();
  return options[`bankAccount_${entity}`]
    || options[`bankAccount_${key}`]
    || options.defaultBankAccount
    || process.env[`FRAPPE_BANK_ACCOUNT_${key}`]
    || process.env.FRAPPE_DEFAULT_BANK_ACCOUNT
    || 'Bank';
}

function buildFrappeJournalEntry(row, options = {}) {
  if (!isFrappeExportableRow(row)) return null;

  const amount = Math.abs(Number(row.amount));
  const entity = row.entity || options.defaultEntity || 'behavior-school';
  const company = options.company || process.env.FRAPPE_COMPANY || '';
  const bankAccount = row.bankAccount || accountForEntity(entity, options);
  const revenueAccount = row.frappeAccount || options.defaultRevenueAccount || process.env.FRAPPE_DEFAULT_REVENUE_ACCOUNT || ENTITY_DEFAULT_REVENUE[entity] || 'Sales';
  const expenseAccount = row.frappeAccount || options.defaultExpenseAccount || process.env.FRAPPE_DEFAULT_EXPENSE_ACCOUNT || 'Expenses';
  const postingDate = normalizeDate(row.date) || new Date().toISOString().slice(0, 10);
  const payee = row.payee || normalizePayee(row.description, row.amount);
  const remarkParts = [
    'RobSpain Accounting Hub',
    ENTITY_LABELS[entity] || entity,
    payee,
    row.sourceFile || '',
    row.importKey || row.id || '',
  ].filter(Boolean);

  const debitLine = row.amount > 0
    ? {
        account: bankAccount,
        debit_in_account_currency: amount,
        credit_in_account_currency: 0,
      }
    : {
        account: expenseAccount,
        debit_in_account_currency: amount,
        credit_in_account_currency: 0,
      };
  const creditLine = row.amount > 0
    ? {
        account: revenueAccount,
        debit_in_account_currency: 0,
        credit_in_account_currency: amount,
      }
    : {
        account: bankAccount,
        debit_in_account_currency: 0,
        credit_in_account_currency: amount,
      };

  const doc = {
    doctype: 'Journal Entry',
    voucher_type: 'Journal Entry',
    posting_date: postingDate,
    user_remark: `${remarkParts.join(' | ')} | ${row.description || ''}`.slice(0, 1000),
    accounts: [debitLine, creditLine],
  };
  if (company) doc.company = company;
  return {
    importKey: row.importKey || row.id || [row.date, row.description, row.amount].join('|'),
    sourceRowId: row.id || '',
    entity,
    payee,
    amount: Number(row.amount),
    description: row.description || '',
    doc,
  };
}

function buildFrappeJournalEntries(rows, options = {}) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => buildFrappeJournalEntry(row, options))
    .filter(Boolean);
}

function normalizeStripeBalanceTransaction(txn, options = {}) {
  const grossAmount = Number(txn.amount ?? 0) / 100;
  const netAmount = Number(txn.net ?? txn.amount ?? 0) / 100;
  const fee = Number(txn.fee || 0) / 100;
  const isCharge = /charge|payment/.test(String(txn.reporting_category || txn.type || ''));
  const amount = isCharge && grossAmount > 0 ? grossAmount : netAmount;
  const desc = [
    'Stripe',
    txn.reporting_category || txn.type || 'balance transaction',
    txn.description || '',
  ].filter(Boolean).join(' - ');

  const main = normalizeAccountingRow({
    id: `stripe_${txn.id}`,
    importKey: `stripe|${txn.id}|net`,
    date: txn.created,
    description: desc,
    amount,
    sourceAccount: 'Stripe',
    sourceFile: 'Stripe API',
    entity: options.defaultEntity || 'behavior-school',
    category: amount >= 0 ? 'Sales' : 'Stripe adjustment',
    taxCategory: amount >= 0 ? 'Gross receipts' : 'Merchant fees / adjustments',
    frappeAccount: amount >= 0 ? 'Sales' : 'Expenses',
    confidence: 0.94,
    approved: true,
    notes: `Stripe balance transaction ${txn.id}`,
  }, options);

  const rows = main ? [main] : [];
  if (fee > 0) {
    const feeRow = normalizeAccountingRow({
      id: `stripe_${txn.id}_fee`,
      importKey: `stripe|${txn.id}|fee`,
      date: txn.created,
      description: `Stripe processing fee - ${txn.description || txn.id}`,
      amount: -Math.abs(fee),
      sourceAccount: 'Stripe',
      sourceFile: 'Stripe API',
      entity: options.defaultEntity || 'behavior-school',
      category: 'Merchant fees',
      taxCategory: 'Bank charges / merchant fees',
      frappeAccount: 'Expenses',
      confidence: 0.96,
      approved: true,
      notes: `Fee from Stripe balance transaction ${txn.id}`,
    }, options);
    if (feeRow) rows.push(feeRow);
  }
  return rows;
}

function normalizeFreshBooksInvoice(invoice, options = {}) {
  const id = invoice.invoiceid || invoice.id || invoice.invoice_number || invoice.number || 'unknown';
  const customer = invoice.customer_name || invoice.client_name || invoice.organization || invoice.fname || invoice.lname || 'FreshBooks customer';
  const amount = normalizeAmount(invoice.amount_paid?.amount || invoice.paid?.amount || invoice.net_paid_amount?.amount || invoice.amount?.amount || invoice.total?.amount || invoice.paid || invoice.total);
  return normalizeAccountingRow({
    id: `freshbooks_${id}`,
    importKey: `freshbooks|invoice|${id}`,
    date: invoice.date_paid || invoice.paid_date || invoice.create_date || invoice.date || invoice.updated || new Date().toISOString().slice(0, 10),
    description: `FreshBooks invoice ${invoice.invoice_number || id} - ${customer}`,
    amount,
    sourceAccount: 'FreshBooks',
    sourceFile: options.sourceFile || 'FreshBooks export',
    entity: options.defaultEntity || 'behavior-school',
    category: 'Sales',
    taxCategory: 'Gross receipts',
    frappeAccount: 'Sales',
    confidence: 0.9,
    approved: true,
  }, options);
}

module.exports = {
  ACCOUNTING_CATEGORY_RULES,
  normalizeAccountingRow,
  normalizeCsvAccountingRows,
  normalizeOfxRows,
  normalizeStatementText,
  normalizeStatementLineRows,
  applyCsvBalanceValidation,
  reconstructStatementLines,
  detectStatementProfile,
  createOcrNeededRow,
  isFrappeExportableRow,
  buildFrappeJournalEntry,
  buildFrappeJournalEntries,
  normalizeStripeBalanceTransaction,
  normalizeFreshBooksInvoice,
  normalizeDate,
  normalizeAmount,
  normalizePayee,
  applyVendorRulesToRow,
  parseCsvLine,
};
