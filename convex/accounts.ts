import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("accounts").collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("accounts"),
    balance: v.optional(v.number()),
    notes: v.optional(v.string()),
    lastSynced: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(id, updates);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("credit"),
      v.literal("loan"),
      v.literal("loc")
    ),
    balance: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.id("accounts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("accounts", {
      ...args,
      lastSynced: null,
    });
  },
});
