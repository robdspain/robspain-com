# Transformation Program Fit-Call and PO/Invoice Path

Last updated: 2026-05-31

## Locked Offer

- Program: Behavior School Transformation Program, July 2026 founding cohort
- Start: Wednesday, July 1, 2026
- Schedule: weekly 6:00-8:00 PM Pacific for 6 weeks, July 1 through August 5
- Tuition: $1,997 founding tuition
- Payment plan: 3 payments of $697
- Seats: 12 maximum
- Refund window: five calendar days after payment
- PO/invoice: district purchase orders and invoices allowed through `support@behaviorschool.com`
- Primary CTA: Book a fit call
- Secondary CTA: Join founding cohort waitlist
- Fit-call URL: `https://calendly.com/robspain/behavior-school-transformation-system-phone-call`

## Intake Questions

Use these fields on the booking form, application form, CRM row, or manual call notes.

Required:

- Full name
- Email
- Phone
- Current role/title
- District or organization
- State/time zone
- BCBA certification status
- Current school setting: single school, district-wide, contractor, clinic-to-school transition, other
- Caseload size and school count
- Main bottleneck: FBA backlog, BIP quality, staff implementation, data collection, admin pressure, ethics conflict, burnout, other
- Weekly availability for the July 1 cohort
- Payment path: self-pay, district card, district PO/invoice, unsure
- What would make the cohort worth it by August 5?

Optional but useful:

- Urgency date: IEP deadline, FBA due date, start-of-year planning, district PD deadline
- Staff implementation problem in one sentence
- Current data system/tooling
- Biggest objection: time, money, approval, fit, CEUs, not ready

## Booking Flow

1. Public CTA sends to Calendly fit call.
2. Calendly event collects the required intake fields.
3. Confirmation email includes:
   - call time and meeting link
   - one-line reminder of July 1 start
   - request to bring payment path status: self-pay, district card, or PO/invoice
4. After booking, create or update a CRM/pipeline row.
5. If the prospect selects district PO/invoice, send the district approval packet and ask for billing contact, PO requirements, and W-9 needs.

Do not send invoices automatically until Rob approves the prospect and payment path.

## Fit-Call Script

Call goal: decide fit, payment path, and next action in 15 minutes.

1. Confirm context.
   - "What role are you in right now, and what does your caseload look like?"
2. Locate the painful bottleneck.
   - "Where is the work breaking down most: assessment, BIP design, staff implementation, data, or admin pressure?"
3. Confirm urgency.
   - "Why solve this before August rather than later?"
4. Match to cohort deliverables.
   - Tie the answer to one of the weekly builds: intake/routing, data toolkit, FBA template, function-matched BIPs, staff implementation, progress monitoring.
5. Confirm capacity.
   - "Can you protect Wednesday 6-8 PM Pacific for six weeks starting July 1?"
6. Confirm payment path.
   - Self-pay: send payment link after approval.
   - District card: send payment link and receipt language.
   - District PO/invoice: collect billing contact, PO instructions, W-9 need, and deadline.
7. Close with one next step.
   - Accepted: send enrollment/payment or PO packet.
   - Needs approval: send supervisor forward email and paperwork.
   - Not fit: waitlist or refer to free tools.

## FreshBooks PO/Invoice Flow

FreshBooks should be used for district PO/invoice payment once a prospect is approved.

Fields to collect before creating an invoice:

- Buyer/contact name
- Billing contact email
- District or organization legal name
- Billing address if required
- PO number, if already issued
- Required vendor paperwork: W-9, quote, sole-source note, program description, CEU statement
- Invoice terms requested by district
- Participant name and email

Invoice line item:

- `Behavior School Transformation Program - July 2026 Founding Cohort`
- Quantity: `1`
- Unit price: `$1,997`
- Description: `Six-week live professional development cohort, July 1-August 5, 2026, weekly 6:00-8:00 PM Pacific.`

Payment-plan invoice handling:

- If self-pay payment plan is approved, use three scheduled payments of `$697`.
- For district PO/invoice, default to one invoice for `$1,997` unless the district requests staged billing.

Operational blocker found 2026-05-31:

- The local FreshBooks tracker exists at `/Users/Neo/.hermes/scripts/freshbooks_open_invoices.py`.
- The local env file has account/app credentials but no `FRESHBOOKS_ACCESS_TOKEN` or `FRESHBOOKS_REFRESH_TOKEN`.
- Until one of those token values is added to `/Users/Neo/.hermes/secrets/freshbooks.env`, the agent can prepare invoice details but cannot read or create FreshBooks invoices through the API.

## Pipeline Fields

Recommended CSV/CRM columns:

- lead_id
- created_at
- source
- name
- email
- phone
- role
- district
- state
- caseload_size
- school_count
- primary_bottleneck
- urgency_date
- payment_path
- fit_call_booked_at
- fit_call_completed_at
- stage
- next_action
- next_action_due
- objection
- close_result
- amount
- invoice_id
- po_number
- ripley_reference
- notes

Stages:

- New lead
- Fit call booked
- Fit call complete
- Approved fit
- District approval pending
- PO/invoice requested
- Invoice sent
- Payment pending
- Enrolled
- Waitlist
- Not fit
- Lost

## Ripley / Billing Reference

Use Ripley only when it supports billing or relationship context. Do not treat Ripley as the primary cohort CRM.

Useful fields:

- supervisee/person name
- period
- hours summary
- billing relevance
- relationship/contact notes
- source URL or internal reference

## Follow-Up Templates

After fit call, self-pay:

> Good talking with you today. Based on what you shared about [bottleneck], the July 1 Transformation Program looks like a fit. Founding tuition is $1,997, with a 3-payment option of $697. The refund window is five calendar days after payment. Reply here if you want the full-pay or payment-plan link.

After fit call, PO/invoice:

> Good talking with you today. I can support district PO/invoice payment for the July 1 Transformation Program. Please send the billing contact, PO requirements, and whether your business office needs a W-9, quote, or program description. Once approved, we can invoice the district for the $1,997 founding tuition.

Supervisor forward:

> I am requesting approval to attend the Behavior School Transformation Program, a six-week live professional development cohort for school BCBAs. It runs July 1-August 5, 2026, weekly from 6:00-8:00 PM Pacific. The program focuses on practical systems for FBA workflow, BIP design, staff implementation, and progress monitoring. Founding tuition is $1,997, and district PO/invoice payment is accepted.

## Agent-Side Next Actions

- Keep public CTAs pointed to the Calendly fit-call URL and the waitlist anchor.
- Add `FRESHBOOKS_ACCESS_TOKEN` or `FRESHBOOKS_REFRESH_TOKEN` to the Hermes FreshBooks env before expecting live invoice reads.
- Do not use Computer Use for FreshBooks invoice checks.
- Do not create/send invoices until Rob approves the individual buyer and payment path.
