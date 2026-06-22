# Spain Household Monthly Budget - May 31, 2026

Purpose: source-backed operating budget for the `robspain.com/admin/family/` dashboard. This is a cash-flow planning view, not legal or tax advice.

## Executive View

| Line | Monthly Amount |
| --- | ---: |
| Kings Canyon USD net estimate | $4,361 |
| Behavior School irregular income | $272 |
| Total income tracked in admin | $4,633 |
| Priority 1 survival / court / essentials | $8,270 |
| Priority 2 insurance and debt minimums | $915 |
| Priority 3 small subscriptions | $57 |
| Priority 4 therapy/legal reserve/on-credit items | $1,125 |
| Total planned monthly outflow | $10,367 |
| Current structural gap | $(5,734) |

## Monthly Budget Lines

| Priority | Category | Amount | Admin Account | Source / Note |
| --- | --- | ---: | --- | --- |
| P1 | Valley Vista rent | $2,445 | EECU Checking | Existing admin finance default. |
| P1 | Child Support / DCSS | $2,100 | Payroll/DCSS | January 2025 child-support order baseline referenced in May 2026 settlement materials. Set to $0 in admin if already withheld from the net paycheck number. |
| P1 | Supporting Hands | $1,800 | EECU Checking | Admin default and May 2026 settlement notes identify monitoring as a major monthly cost. |
| P1 | EECU auto loan | $499 | EECU Checking | Existing admin finance default. |
| P1 | Groceries / household | $500 | EECU Checking | Prior monthly budget planning floor. |
| P1 | Fuel / transportation | $250 | EECU Checking | Operating reserve until card/bank imports replace estimate. |
| P1 | Child / family therapy reserve | $260 | EECU Checking | Half-share estimate for four $130 sessions; update when actual order/provider cadence is known. |
| P1 | PG&E | $200 | EECU Checking | Existing admin finance default. |
| P1 | City of Fresno | $121 | EECU Checking | Existing admin finance default. |
| P1 | Xfinity | $95 | EECU Checking | Existing admin finance default. |
| P2 | Apple Card minimum | $366 | EECU Checking | Existing admin finance default. |
| P2 | Toggle auto insurance | $202 | EECU Debit | Existing admin finance default. |
| P2 | AT&T Wireless | $129 | EECU Checking | Existing admin finance default. |
| P2 | Discover minimum | $83 | EECU Checking | Existing admin finance default. |
| P2 | EECU LOC minimum | $75 | EECU Checking | Existing admin finance default. |
| P2 | Principal Insurance | $35 | Auto-deduct | Existing admin finance default. |
| P2 | Allstate Insurance | $25 | Auto-deduct | Existing admin finance default. |
| P3 | OurFamilyWizard | $9 | EECU Checking | Annual renewal normalized to monthly budget. |
| P3 | Netflix | $18 | Apple Card | Existing seed and payment-history source. |
| P3 | Apple Services | $30 | Apple Card | Recurring services rounded from historical statements. |
| P4 | Phillip M. Collier | $375 | Apple Card | Existing admin finance default, 2-3 sessions/month. |
| P4 | Legal Fee Reserve | $750 | EECU Checking | Working reserve against active 2026 Tipton invoices; pause before adding new card debt. |

## Immediate Cash Controls

1. Verify whether the $2,100 child-support obligation is already withheld before the $4,361 KCUSD net estimate. If yes, set the Child Support / DCSS budget line to $0 inside the admin dashboard to avoid double-counting.
2. Keep Supporting Hands off Apple Card. The dashboard treats it as P1 EECU Checking because prior corrections said those charges should not restart on Apple Card.
3. Treat therapy as a reimbursable child-health cost where the order allows it. The $260 reserve assumes Rob's half-share of four $130 sessions, not full unreimbursed private-pay exposure.
4. Do not fund P4 legal reserve or Collier sessions on credit unless the month is otherwise balanced. The current tracked budget is structurally negative before discretionary choices.
5. Use bank/card imports to replace the groceries, fuel, and subscription estimates with actuals.

## Gap Scenarios

| Scenario | Monthly Gap |
| --- | ---: |
| Full conservative budget | $(5,734) |
| If child support is already withheld from net pay | $(3,634) |
| Plus 50% Supporting Hands relief/reimbursement | $(2,734) |
| Plus pause legal reserve | $(1,984) |
| Plus pause P4 therapy/legal/card-funded items | $(859) |

## Source Trail

- `src/admin/family.njk` and `convex/seed.ts`: existing dashboard defaults for rent, Supporting Hands, auto loan, utilities, debt minimums, accounts, and income.
- Drive monthly budget sheet: prior planning floors for food and basic household categories.
- May 2026 settlement/evidence documents: child-support baseline, court-ordered therapy cost mechanics, Supporting Hands as an ongoing monitoring cost, and Tipton fee exposure.
- Supporting Hands Clover Receipt Manifest - May 31 2026: receipt-level support for monitored-visitation payments.
- Behavior School P&L references: business income remains irregular and should not be relied on as fixed household cash flow.
