# Accounting Hub Handoff

Status: local implementation ready for deploy review. Live credential-backed imports and Frappe sync still need production verification.

## What Is Built

- `/admin/finance/` includes an Accounting Hub tab for Rob Spain, Behavior School, and household accounting workflows.
- Statement imports support CSV, TXT, pasted statement text, OFX/QFX, browser PDF text extraction, and browser OCR fallback for scanned PDFs.
- Imports normalize date, entity, source account, description, payee, amount, bank balance, category, tax category, Frappe account, source fingerprint, import profile, confidence, and review status.
- Existing bills, payments, and income are used to reconcile imported rows when amount/date/text evidence is strong enough.
- Learned vendor rules can be created from reviewed rows and reused on future imports with guarded auto-approval.
- Frappe Books export is available as CSV, and Frappe/ERPNext-style Journal Entry payloads can be previewed or synced through the Netlify function.
- CPA package export includes review CSV, Markdown summary, and manifest JSON with source fingerprints, readiness blockers, Frappe settings, vendor rules, import runs, sync runs, and notes.
- Netlify functions cover accounting storage, source imports, scheduled imports, Frappe sync, normalization, and automation status.
- Convex schema/functions include accounting transaction and vendor-rule structures for a future Convex-backed store.

## Operating Flow

1. Open `/admin/finance/` and use the Accounting Hub tab.
2. Configure Frappe company, bank, revenue, expense, and category account mapping.
3. Import bank/card statements, pasted statement text, OFX/QFX, Stripe/FreshBooks exports, or connected sources.
4. Review low-confidence, OCR, balance mismatch, personal, and ambiguous rows.
5. Create vendor rules from recurring reviewed rows.
6. Use `Approve automation-ready rows` after reviewing parser output.
7. Preview Frappe sync or export Frappe Books CSV.
8. Resolve close-readiness blockers.
9. Export the CPA package for handoff.

## Required Production Environment

- `ADMIN_API_TOKEN` for protected writes/imports.
- Netlify Blobs configured through the deployed site context, or `SITE_ID`/`NETLIFY_TOKEN`.
- Stripe import: `STRIPE_SECRET_KEY` or `STRIPE_API_KEY`.
- FreshBooks import: `FRESHBOOKS_ACCESS_TOKEN` and `FRESHBOOKS_ACCOUNT_ID`.
- Frappe sync: `FRAPPE_BASE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`.
- Optional Frappe defaults: `FRAPPE_COMPANY`, `FRAPPE_DEFAULT_BANK_ACCOUNT`, `FRAPPE_DEFAULT_EXPENSE_ACCOUNT`, `FRAPPE_DEFAULT_REVENUE_ACCOUNT`.
- Optional live submit: `FRAPPE_SUBMIT_JOURNAL_ENTRIES=true`.

## Final Verification Run

Local gates to run before deploy:

```sh
npm run test:accounting
npm run test:accounting:smoke
npm run build
node -e "const fs=require('fs'); const html=fs.readFileSync('_site/admin/finance/index.html','utf8'); const vm=require('vm'); const scripts=[...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)].map(m=>m[1]); scripts.forEach((s,i)=>new vm.Script(s,{filename:'finance-inline-'+i+'.js'})); console.log('checked', scripts.length, 'inline scripts');"
```

Production checks after deploy:

- Open Accounting Hub and confirm Automation Health reports admin store, Stripe, FreshBooks, Frappe, scheduled import, and browser OCR status.
- Run a dry-run Frappe preview with one approved test row and confirm the Journal Entry payload matches expected accounts.
- Run connected source import with live credentials and confirm import history records inserted/skipped counts.
- Do not run live Frappe sync until the dry-run payload is reviewed.

## Not Yet Proven

- Live Frappe credentials and live Journal Entry creation.
- Live Stripe/FreshBooks import against production credentials.
- Browser OCR performance on large real scanned statement PDFs.
- CPA approval of category/entity/account treatment.
