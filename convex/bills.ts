import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("bills").collect();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("bills"),
    status: v.union(
      v.literal("overdue"),
      v.literal("upcoming"),
      v.literal("current"),
      v.literal("autopay"),
      v.literal("paid")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("bills"),
    name: v.optional(v.string()),
    dueDay: v.optional(v.number()),
    amount: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("overdue"),
        v.literal("upcoming"),
        v.literal("current"),
        v.literal("autopay"),
        v.literal("paid")
      )
    ),
    priority: v.optional(v.number()),
    account: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(id, updates);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    dueDay: v.optional(v.number()),
    amount: v.number(),
    status: v.union(
      v.literal("overdue"),
      v.literal("upcoming"),
      v.literal("current"),
      v.literal("autopay"),
      v.literal("paid")
    ),
    priority: v.number(),
    account: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("bills"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("bills", {
      ...args,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("bills") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
