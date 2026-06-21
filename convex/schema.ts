import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const entity = v.union(
  v.literal("behavior-school"),
  v.literal("rob-spain"),
  v.literal("household")
);

export default defineSchema({
  adminItems: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_key", ["key"]),

  accountingTransactions: defineTable({
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
    importedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_import_key", ["importKey"])
    .index("by_entity_date", ["entity", "date"]),

  accountingImports: defineTable({
    fileName: v.string(),
    entity,
    sourceAccount: v.string(),
    rowCount: v.number(),
    importedAt: v.number(),
    status: v.union(
      v.literal("parsed"),
      v.literal("reviewed"),
      v.literal("exported"),
      v.literal("failed")
    ),
    notes: v.optional(v.string()),
  }).index("by_entity_imported", ["entity", "importedAt"]),

  accountingVendorRules: defineTable({
    match: v.string(),
    payee: v.string(),
    entity,
    category: v.string(),
    taxCategory: v.string(),
    frappeAccount: v.string(),
    autoApprove: v.boolean(),
    confidence: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_match", ["match"]),
});
