import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  bills: defineTable({
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
    priority: v.number(), // 1=survival, 2=insurance/debt, 3=necessities, 4=on credit
    account: v.optional(v.string()),
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  }),

  accounts: defineTable({
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
    lastSynced: v.optional(v.number()),
  }),

  payments: defineTable({
    billId: v.optional(v.id("bills")),
    billName: v.string(),
    amount: v.number(),
    date: v.string(),
    fromAccount: v.optional(v.string()),
    notes: v.optional(v.string()),
  }),

  income: defineTable({
    name: v.string(),
    amount: v.number(),
    frequency: v.string(),
  }),

  transactions: defineTable({
    date: v.string(),
    description: v.string(),
    amount: v.number(),
    account: v.string(),
    category: v.optional(v.string()),
    importedAt: v.number(),
  }),
});
