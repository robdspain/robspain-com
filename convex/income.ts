import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("income").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    frequency: v.string(),
  },
  returns: v.id("income"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("income", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("income"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    frequency: v.optional(v.string()),
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
