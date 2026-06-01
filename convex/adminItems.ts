import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { key: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      key: v.string(),
      value: v.any(),
      updatedAt: v.number(),
      updatedBy: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("adminItems")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!item) return null;

    return {
      key: item.key,
      value: item.value,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy,
    };
  },
});

export const put = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    updatedBy: v.optional(v.string()),
  },
  returns: v.object({
    key: v.string(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const updatedAt = Date.now();
    const existing = await ctx.db
      .query("adminItems")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt,
        updatedBy: args.updatedBy,
      });
    } else {
      await ctx.db.insert("adminItems", {
        key: args.key,
        value: args.value,
        updatedAt,
        updatedBy: args.updatedBy,
      });
    }

    return { key: args.key, updatedAt };
  },
});

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      key: v.string(),
      updatedAt: v.number(),
      updatedBy: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const items = await ctx.db.query("adminItems").collect();
    return items
      .map((item) => ({
        key: item.key,
        updatedAt: item.updatedAt,
        updatedBy: item.updatedBy,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
