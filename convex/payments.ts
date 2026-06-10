import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const q = ctx.db.query("payments").order("desc");
    if (args.limit) {
      return await q.take(args.limit);
    }
    return await q.collect();
  },
});

export const create = mutation({
  args: {
    billId: v.optional(v.id("bills")),
    billName: v.string(),
    amount: v.number(),
    date: v.string(),
    fromAccount: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("payments"),
  handler: async (ctx, args) => {
    // If billId provided, mark the bill as paid
    if (args.billId) {
      await ctx.db.patch(args.billId, {
        status: "paid" as const,
        updatedAt: Date.now(),
      });
    }
    return await ctx.db.insert("payments", args);
  },
});

export const remove = mutation({
  args: { id: v.id("payments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
