import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const entity = v.union(
  v.literal("behavior-school"),
  v.literal("rob-spain"),
  v.literal("household")
);

export const list = query({
  args: {
    entity: v.optional(entity),
    approvedOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 250, 1000);
    const rows = args.entity
      ? await ctx.db
          .query("accountingTransactions")
          .withIndex("by_entity_date", (q) => q.eq("entity", args.entity!))
          .order("desc")
          .take(limit)
      : await ctx.db.query("accountingTransactions").order("desc").take(limit);

    return args.approvedOnly ? rows.filter((row) => row.approved) : rows;
  },
});

export const exportReady = query({
  args: {
    entity: v.optional(entity),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const rows = args.entity
      ? await ctx.db
          .query("accountingTransactions")
          .withIndex("by_entity_date", (q) => q.eq("entity", args.entity!))
          .collect()
      : await ctx.db.query("accountingTransactions").collect();

    return rows
      .filter((row) => row.approved && row.category !== "Personal / exclude")
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const imports = query({
  args: {
    entity: v.optional(entity),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 500);
    if (args.entity) {
      return await ctx.db
        .query("accountingImports")
        .withIndex("by_entity_imported", (q) => q.eq("entity", args.entity!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("accountingImports").order("desc").take(limit);
  },
});

export const upsertMany = mutation({
  args: {
    fileName: v.string(),
    entity,
    sourceAccount: v.string(),
    rows: v.array(
      v.object({
        date: v.string(),
        entity,
        sourceAccount: v.string(),
        description: v.string(),
        payee: v.optional(v.string()),
        amount: v.number(),
        category: v.string(),
        taxCategory: v.string(),
        frappeAccount: v.string(),
        sourceFile: v.optional(v.string()),
        sourceFingerprint: v.optional(v.string()),
        importKey: v.string(),
        confidence: v.number(),
        approved: v.boolean(),
        approvedByAutomation: v.optional(v.boolean()),
        approvedAt: v.optional(v.string()),
        automationRuleId: v.optional(v.string()),
        automationRuleName: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    inserted: v.number(),
    skipped: v.number(),
    importId: v.id("accountingImports"),
  }),
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    const now = Date.now();

    for (const row of args.rows) {
      const existing = await ctx.db
        .query("accountingTransactions")
        .withIndex("by_import_key", (q) => q.eq("importKey", row.importKey))
        .first();

      if (existing) {
        skipped += 1;
        continue;
      }

      await ctx.db.insert("accountingTransactions", {
        ...row,
        importedAt: now,
        updatedAt: now,
      });
      inserted += 1;
    }

    const importId = await ctx.db.insert("accountingImports", {
      fileName: args.fileName,
      entity: args.entity,
      sourceAccount: args.sourceAccount,
      rowCount: inserted,
      importedAt: now,
      status: inserted > 0 ? "parsed" : "failed",
      notes: skipped > 0 ? `${skipped} duplicate rows skipped.` : undefined,
    });

    return { inserted, skipped, importId };
  },
});

export const update = mutation({
  args: {
    id: v.id("accountingTransactions"),
    date: v.optional(v.string()),
    entity: v.optional(entity),
    sourceAccount: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    taxCategory: v.optional(v.string()),
    frappeAccount: v.optional(v.string()),
    confidence: v.optional(v.number()),
    approved: v.optional(v.boolean()),
    approvedByAutomation: v.optional(v.boolean()),
    approvedAt: v.optional(v.string()),
    automationRuleId: v.optional(v.string()),
    automationRuleName: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("accountingTransactions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const vendorRules = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("accountingVendorRules").order("asc").collect();
  },
});

export const upsertVendorRule = mutation({
  args: {
    match: v.string(),
    payee: v.string(),
    entity,
    category: v.string(),
    taxCategory: v.string(),
    frappeAccount: v.string(),
    autoApprove: v.boolean(),
    confidence: v.number(),
  },
  returns: v.id("accountingVendorRules"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("accountingVendorRules")
      .withIndex("by_match", (q) => q.eq("match", args.match))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("accountingVendorRules", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeVendorRule = mutation({
  args: { id: v.id("accountingVendorRules") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
