# RobSpain Accounting Hub

Purpose: make `/admin/finance/` the single intake and review surface for Rob Spain, Behavior School, and household finance records before they are exported to Frappe Books or sent to the CPA.

## System Boundary

- Robspain.com admin is the operating dashboard and review queue.
- Frappe Books is the ledger and reporting destination, not the live website backend.
- BehaviorSchool.com, Stripe, FreshBooks, bank/card exports, and statement PDFs should feed accounting-ready rows into the Robspain.com admin review queue.
- The CPA package is generated from reviewed rows plus source notes, not from ad hoc spreadsheets.

## Entity Model

Current entities:

- `behavior-school`: business income and expenses tied to Behavior School, subscriptions, invoices, software, marketing, contractors, and customer payments.
- `rob-spain`: professional RobSpain.com activity, speaking/consulting, website operations, and shared admin costs.
- `household`: household cash-flow and debt tracking. This should stay separate from business books unless the CPA directs otherwise.

## Import Workflow

1. Import CSV, TXT, PDF, OFX/QFX, pasted statement text, Stripe exports, or FreshBooks invoice exports.
2. Normalize rows into:
   - date
   - entity
   - source account
   - description
   - normalized payee/vendor/customer
   - amount
   - bank balance when present
   - balance check status when present
   - category
   - tax category
   - Frappe Books account
   - category-to-Frappe account map value
   - source file
   - source fingerprint
   - existing-finance reconciliation status
   - import profile
   - confidence
   - review status
3. Auto-classify using rules in `src/admin/finance.njk`.
4. Reconcile against existing bills, recorded payments, and income estimates when amount/date/text evidence is strong enough.
5. Normalize raw bank descriptors into payee/vendor/customer names so Frappe party names and CPA review files are usable.
6. Save vendor rules from reviewed rows so future matching bank/PDF/import rows inherit the same entity, category, tax category, and Frappe account.
7. Apply the configured category-to-Frappe account map so common rows land in the intended ledger accounts before manual review.
8. Allow row-level Frappe account edits in the review queue for exceptions and CPA-specific handling.
9. Use `Approve automation-ready rows` to approve only rows with source file evidence, a Frappe account, nonzero amount, no OCR/personal category, no balance mismatch, and either high confidence or matched balance/reconciliation evidence.
10. Require manual review for low-confidence rows, balance mismatches, OCR placeholders, personal/business ambiguity, and anything without source evidence.
11. Export approved rows to Frappe Books CSV.
12. Preview or sync approved rows as Frappe Journal Entry payloads when a Frappe API backend is configured.
13. Export the CPA package, which downloads the review CSV, summary Markdown, and manifest JSON together.
14. Use the latest-period close readiness panel to resolve blockers before handing the month to the CPA.
15. Save CPA handoff notes in the Accounting Hub for entity treatment questions, source caveats, and month-end decisions.

## Source Connectors

Current source endpoint:

- `/.netlify/functions/accounting-source-import`

Supported flows:

- `GET ?source=all&limit=50`: imports every configured live source in one run. Currently this attempts Stripe and FreshBooks, merges successful rows, and reports per-source setup/API errors without failing the whole run.
- `GET ?source=stripe&limit=50`: imports recent Stripe balance transactions when `STRIPE_SECRET_KEY` or `STRIPE_API_KEY` is configured on the server. Uses Stripe API version `2026-02-25.clover`.
- `GET ?source=freshbooks&limit=50`: imports paid FreshBooks invoices when FreshBooks API credentials are configured.
- `POST { source, csv, entity, sourceAccount, sourceFile }`: normalizes CSV exports from banks, Stripe, FreshBooks, or invoices.
- `POST { source: "freshbooks", freshBooksInvoices: [...] }`: normalizes FreshBooks invoice JSON/export rows.
- Returned rows use the same Accounting Hub review queue shape and are merged into Netlify Blobs when available.
- Browser imports, pasted text, OCR placeholders, and live source imports attach a deterministic `sourceFingerprint` so repeated statement/import batches can be recognized without storing raw bank documents in the repo.
- Browser and server imports preserve explicit non-generic row accounts, but generic `Sales`/`Expenses` defaults are upgraded through the Accounting Hub category-to-Frappe account map before review/export.
- Browser and server imports also append an import-run audit entry with source, source file, inserted/skipped counts, persistence status, source fingerprint, errors, and timestamps. The admin renders the latest runs in `Import Run History`.
- Browser and server imports apply saved vendor rules when available. A rule can be created from a reviewed row and then reused for future raw descriptors such as `CHECKCARD FRESNO PRINT LAB 998812`.
- Vendor-rule auto-approval is guarded: it only applies when the row still has source evidence, a nonzero amount, no OCR/personal category, no balance mismatch, and enough confidence or matched evidence.

Current scheduled import:

- `src/netlify/functions/accounting-auto-import.js`
- Runs daily at `0 15 * * *` UTC on published Netlify deploys.
- Calls the same `source=all` path, so duplicate detection and Netlify Blobs merging stay identical to manual connected-source imports.
- Uses `ADMIN_API_TOKEN` internally when the write/import endpoints are protected.
- Optional env:
  - `ACCOUNTING_AUTO_IMPORT_ENTITY` defaults to `behavior-school`
  - `ACCOUNTING_AUTO_IMPORT_LIMIT` defaults to `50`
  - `ACCOUNTING_AUTO_IMPORT_SOURCES` defaults to `stripe,freshbooks`

Current status endpoint:

- `/.netlify/functions/accounting-status`
- Reports setup state for Admin Data Store, admin write token, Stripe import, FreshBooks import, Frappe sync, and browser OCR.
- Does not expose secret values; it only reports whether required environment variables/capabilities are present.
- The Accounting Hub renders this as the `Automation Health` checklist.

Current Frappe endpoint:

- `/.netlify/functions/accounting-frappe-sync`
- `POST { dryRun: true, rows: [...], company, defaultBankAccount, defaultRevenueAccount, defaultExpenseAccount }`: returns the exact `Journal Entry` payloads that would be sent to Frappe.
- `POST { dryRun: false, rows: [...], company, defaultBankAccount, defaultRevenueAccount, defaultExpenseAccount }`: creates `Journal Entry` documents only when `FRAPPE_BASE_URL`, `FRAPPE_API_KEY`, and `FRAPPE_API_SECRET` are configured.
- The endpoint uses Frappe REST token auth and `POST /api/resource/Journal Entry`; this is for a Frappe/ERPNext-style backend. Desktop Frappe Books CSV export remains the fallback path when no API backend is configured.
- The Accounting Hub stores Frappe company, bank, revenue, and expense account names with the accounting file and sends them on every preview/sync request. Environment variables are server-side defaults and fallbacks, not the only place to configure account names.
- The Accounting Hub also stores a category-to-Frappe account map. Changing the `Sales`, `Uncategorized`, or category-specific account mapping remaps matching review queue rows and is persisted with the accounting blob.
- Frappe preview and sync attempts append a Frappe run audit entry with mode, status, configured/dry-run state, row count, Journal Entry count, created/failed/skipped counts, note, errors, and timestamps.

Frappe env configuration:

- `FRAPPE_BASE_URL`
- `FRAPPE_API_KEY`
- `FRAPPE_API_SECRET`
- `FRAPPE_COMPANY` optional default when the Accounting Hub request does not include `company`
- `FRAPPE_DEFAULT_BANK_ACCOUNT` optional default when the Accounting Hub request does not include `defaultBankAccount`
- `FRAPPE_DEFAULT_EXPENSE_ACCOUNT` optional default when the Accounting Hub request does not include `defaultExpenseAccount`
- `FRAPPE_DEFAULT_REVENUE_ACCOUNT` optional default when the Accounting Hub request does not include `defaultRevenueAccount`
- `FRAPPE_SUBMIT_JOURNAL_ENTRIES=true` only when auto-submitting entries is desired.

Stripe handling:

- Charge/payment rows use gross Stripe amount as `Sales`.
- Stripe fees are emitted as separate negative expense rows under `Bank charges / merchant fees`.
- Transfers/payouts and adjustments are kept as source-account rows for review rather than hidden.

Classification guardrails:

- Plain software subscriptions such as OpenAI, Google Workspace, Netlify, GitHub, Zoom, and Calendly classify as `Software and subscriptions`, not `Sales`.
- Customer/invoice/cohort/course payments classify as `Sales`.
- Stripe processing fees classify as `Merchant fees` and map to `Bank charges / merchant fees`.

FreshBooks handling:

- Paid invoice exports normalize as `Sales` / `Gross receipts`.
- Live FreshBooks API import supports paid invoices from `accounting/account/<accountId>/invoices/invoices`.
- Configure `FRESHBOOKS_ACCESS_TOKEN` and `FRESHBOOKS_ACCOUNT_ID`.
- FreshBooks refresh tokens rotate on use. Do not enable unattended refresh until there is a secure token-persistence workflow that can replace the stored refresh token every time a new access token is issued.

## PDF Statement Handling

The admin page first tries browser-side PDF text extraction using PDF.js. If the PDF text layer is sparse or image-only, it attempts browser OCR on rendered PDF pages with Tesseract.js before falling back to document review. If OCR is unavailable, fails, or still produces no transaction rows, the import flow creates a `Document needs OCR` review item with the source filename and reason. These placeholder rows are included in the CPA package and excluded from Frappe Books ledger exports.

OCR guardrails:

- OCR runs in the browser so raw statement images are not sent through the repo or the Netlify function.
- OCR is best-effort and limited to the first 8 PDF pages per import to avoid locking the admin page on large statements.
- OCR output still goes through parser confidence, balance validation, and review before export.

Current parser profiles:

- `apple-card`: Apple Card-style CSV exports.
- `eecu`: EECU/bank-style exports with debit, credit, or balance columns.
- `ofx-qfx`: OFX/QFX bank exports with `STMTTRN`, `DTPOSTED`, `TRNAMT`, `FITID`, `NAME`, and `MEMO` fields.
- `stripe-csv`: Stripe exports with Stripe-specific headers or filenames.
- `freshbooks-csv`: FreshBooks invoice/export rows.
- `generic-csv`: delimited statements with standard date, description, and amount columns. The parser accepts comma, tab, semicolon, and pipe-delimited exports when the header row is recognizable.
- `statement-text`: copied statement text with date/description/amount lines.
- `ocr-needed`: a scanned/image-only PDF or unparsed PDF that still needs manual OCR/review after automatic attempts fail.

Bank/card statement validation:

- CSV imports with running balance columns preserve `bankBalance`.
- CSV/delimited imports auto-detect comma, tab, semicolon, and pipe separators from the header row.
- PDF/text imports with lines shaped like `date description amount balance` also preserve `bankBalance`.
- PDF/text imports recognize numeric dates and month-name dates such as `Jun 01, 2026`.
- PDF/text imports also reconstruct split extracted rows such as `date` / `description` / `amount` / `balance` before parsing, including month-name dates split onto their own line.
- When statement rows omit the year, the parser infers it from the statement text or filename, such as `Statement Period Jun 01, 2025 - Jun 30, 2025` or `EECU June 2025.pdf`, before falling back to the current year.
- If adjacent balances reconcile with transaction amounts, rows are marked `balanceCheck: matched`.
- If balances do not reconcile, affected rows are marked `balanceCheck: mismatch`, confidence is lowered, and the row note records the expected and observed balance.
- Balance validation supports both oldest-first and newest-first exports/text.

Future upgrade path:

- Add server-side private OCR queue for large scanned PDFs if browser OCR is too slow.
- Add deeper statement-specific parsers for more bank/card layouts and better running-balance validation.
- Add live FreshBooks API import once token storage and account selection are confirmed.
- Persist imported source files to a private storage bucket with hashes instead of storing raw bank documents in the repo.
- Move the local review queue to Convex once the schema is finalized.

## Export Contract

Frappe Books CSV columns:

- Date
- Party
- Account
- Debit
- Credit
- Description
- Reference
- Entity
- Tax Category

The `Account` value is the row-level Frappe account. By default it comes from the Accounting Hub category map, and it can be overridden per transaction in the review queue.

The `Party` value comes from the normalized payee field. Known raw descriptors such as `POS DEBIT OPENAI *CHATGPT 123456` are normalized to stable names such as `OpenAI` before CSV export or sync preview.

Frappe Journal Entry payload shape:

- `doctype`: `Journal Entry`
- `voucher_type`: `Journal Entry`
- `posting_date`: transaction date
- `company`: from configured company/env when present
- `user_remark`: source trace with RobSpain import key
- `accounts`: two balanced rows; income debits bank and credits revenue, expenses debit expense and credit bank

CPA package CSV columns:

- Date
- Entity
- Source Account
- Description
- Payee
- Amount
- Bank Balance
- Balance Check
- Category
- Tax Category
- Frappe Account
- Approved
- Approved By Automation
- Approved At
- Confidence
- Source File
- Source Fingerprint
- Reconciliation Status
- Reconciliation Type
- Reconciliation Name
- Reconciliation Confidence
- Import Profile
- Frappe Journal Entry
- Notes

`Frappe Account` should be reviewed before CPA handoff because it is the ledger account that will be used by both the Frappe CSV export and the Frappe Journal Entry sync preview.

CPA summary Markdown sections:

- Generated timestamp, row count, approval count, review exception count, OCR-needed count, balance mismatch count, and Frappe sync count.
- Automation-approved row count so the CPA can separate manually approved rows from rows approved by Accounting Hub guardrails.
- Existing-finance reconciliation counts for matched, possible, and unmatched rows.
- Entity totals with income, expenses, net, and row counts.
- Category totals with income, expenses, net, and row counts.
- Review exceptions for unapproved, low-confidence, balance mismatch, and OCR-needed rows.
- Source file list.
- Source fingerprints grouped by source file.
- Saved CPA notes from the Accounting Hub.
- CPA handoff notes are editable in the admin and flow into both the summary Markdown and manifest JSON.

CPA manifest JSON fields:

- Package name and generated timestamp.
- Latest accounting period and `readyForCpa` boolean.
- The exact generated package filenames.
- Summary counts for rows, approvals, review exceptions, OCR-needed rows, balance mismatches, Frappe sync, and reconciliation.
- Automation-approved row count.
- Close-readiness income, expenses, net, Frappe-pending count, source-missing count, and blockers.
- Source files with fingerprints.
- Import-run history remains in the accounting data store and helps explain how the package was assembled.
- Frappe run history remains in the accounting data store and shows what was previewed or synced to the ledger.
- Entity/category totals.
- Frappe company, bank account, default accounts, and category account map.
- Vendor rules with match text, normalized payee, entity, category, tax category, Frappe account, confidence, and guarded auto-approval flag.
- Saved CPA notes.

Close readiness panel:

- Uses the latest transaction month in the review queue.
- Shows period income, expenses, net, row count, and pending Frappe export count.
- Blocks readiness for missing rows, unapproved or low-confidence rows, balance mismatches, OCR/document review rows, missing source files, and approved Frappe-exportable rows that have not been synced or marked with a Frappe journal entry.

Verification:

- `npm run test:accounting` exercises parser profiles, bank balance validation, source imports, Frappe dry-run payloads, status endpoints, scheduled auto-import, CPA summary generation, close readiness, and a VM-rendered Accounting Hub smoke flow.
- `npm run test:accounting:smoke` is an alias for the same Accounting Hub verification gate.

## Guardrails

- Do not commit raw statements, account numbers, receipts, tax returns, or bank/card PDFs.
- Keep source documents in private storage or local secure folders only.
- Do not mix household and business rows without explicit CPA review.
- Treat auto-classification as a review aid, not final tax advice.
