import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Run once to populate the database with current household data
// Call via: npx convex run seed:run
export const run = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("bills").first();
    if (existing) {
      console.log("Database already seeded, skipping.");
      return null;
    }

    // Bills (as of 2026-03-30)
    const bills = [
      { name: "Valley Vista (Rent)", dueDay: 1, amount: 2445, status: "upcoming" as const, priority: 1, account: "EECU Checking" },
      { name: "Supporting Hands", dueDay: undefined, amount: 1800, status: "current" as const, priority: 4, account: "Apple Card", notes: "Court-ordered visitation support" },
      { name: "EECU Auto Loan", dueDay: 5, amount: 499, status: "autopay" as const, priority: 1, account: "EECU Checking" },
      { name: "Apple Card Min", dueDay: 27, amount: 366, status: "paid" as const, priority: 2, account: "EECU Checking", notes: "Paid $960 on 3/30" },
      { name: "Therapist (Collier)", dueDay: undefined, amount: 375, status: "current" as const, priority: 4, account: "Apple Card", notes: "Phillip M. Collier, $150/session, 2-3x/mo" },
      { name: "Toggle Insurance", dueDay: 26, amount: 199, status: "paid" as const, priority: 2, account: "EECU Debit", notes: "Auto insurance, paid 3/29" },
      { name: "PG&E", dueDay: 14, amount: 200, status: "upcoming" as const, priority: 1, account: "Apple Card", notes: "Payment plan" },
      { name: "AT&T Wireless", dueDay: undefined, amount: 129, status: "current" as const, priority: 2, account: "Apple Card", notes: "Unlimited Elite, 1 line. Phone installment ends ~May 2026" },
      { name: "City of Fresno", dueDay: 1, amount: 121, status: "overdue" as const, priority: 1, account: "EECU Debit", notes: "Water/sewer" },
      { name: "Xfinity", dueDay: 1, amount: 95, status: "paid" as const, priority: 1, account: "Wells Fargo", notes: "Paid 3/29" },
      { name: "Discover Min", dueDay: 18, amount: 83, status: "upcoming" as const, priority: 2, account: "EECU Checking" },
      { name: "EECU LOC Min", dueDay: 26, amount: 75, status: "upcoming" as const, priority: 2, account: "EECU Checking" },
      { name: "OurFamilyWizard", dueDay: undefined, amount: 9, status: "paid" as const, priority: 3, notes: "Basic plan, renewed 3/30 at $110/yr" },
      { name: "Principal Insurance", dueDay: undefined, amount: 35, status: "current" as const, priority: 2, account: "EECU Checking" },
      { name: "Allstate Insurance", dueDay: undefined, amount: 25, status: "current" as const, priority: 2, account: "Apple Card" },
      { name: "Netflix", dueDay: undefined, amount: 18, status: "upcoming" as const, priority: 3, account: "Apple Card" },
    ];

    for (const bill of bills) {
      await ctx.db.insert("bills", { ...bill, updatedAt: Date.now() });
    }

    // Accounts (as of 2026-03-30 after payments)
    const accounts = [
      { name: "EECU Checking", type: "checking" as const, balance: 4009, notes: "After paycheck + Apple Card payment" },
      { name: "EECU Savings", type: "savings" as const, balance: 87, notes: "Emergency fund (target: $500)" },
      { name: "EECU Line of Credit", type: "loc" as const, balance: -404, notes: "$9,596 available" },
      { name: "EECU Auto Loan", type: "loan" as const, balance: -16354, notes: "Autopay $499/mo" },
      { name: "Apple Card", type: "credit" as const, balance: -16199, notes: "Goldman Sachs. Paid $960 on 3/30" },
      { name: "Discover", type: "credit" as const, balance: -1000, notes: "Estimated balance" },
    ];

    for (const acct of accounts) {
      await ctx.db.insert("accounts", { ...acct, lastSynced: null });
    }

    // Income
    const incomes = [
      { name: "Kings Canyon USD", amount: 4845, frequency: "Biweekly" },
      { name: "FPU Payroll", amount: 1093, frequency: "Monthly" },
      { name: "Behavior School", amount: 272, frequency: "Irregular" },
    ];

    for (const inc of incomes) {
      await ctx.db.insert("income", inc);
    }

    // Recent payments
    const payments = [
      { billName: "Apple Card", amount: 960, date: "2026-03-30", fromAccount: "EECU Checking", notes: "Covers $366 min + extra" },
      { billName: "OurFamilyWizard", amount: 110, date: "2026-03-30", fromAccount: "Apple Card", notes: "Basic plan annual renewal" },
      { billName: "Toggle Insurance", amount: 204, date: "2026-03-29", fromAccount: "EECU Debit", notes: "Auto insurance" },
      { billName: "Xfinity", amount: 95, date: "2026-03-29", fromAccount: "Wells Fargo", notes: "Internet" },
    ];

    for (const pmt of payments) {
      await ctx.db.insert("payments", pmt);
    }

    console.log("Database seeded with household finance data.");
    return null;
  },
});
