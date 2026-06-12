import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function requireFamilyToken(accessToken: string) {
  const expected = process.env.FAMILY_CONVEX_ACCESS_TOKEN;
  if (!expected || accessToken !== expected) {
    throw new Error("Unauthorized family data access.");
  }
}

export const get = query({
  args: {
    key: v.string(),
    accessToken: v.string(),
  },
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
    requireFamilyToken(args.accessToken);

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
    accessToken: v.string(),
  },
  returns: v.object({
    key: v.string(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    requireFamilyToken(args.accessToken);

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
  args: {
    accessToken: v.string(),
  },
  returns: v.array(
    v.object({
      key: v.string(),
      updatedAt: v.number(),
      updatedBy: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    requireFamilyToken(args.accessToken);

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
