import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    familyId: v.optional(v.id("families")),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
  notes: defineTable({
    userId: v.id("users"),
    familyId: v.id("families"),
    description: v.string(),
    isCompleted: v.boolean(),
    listId: v.id("noteLists"),
  })
    .index("by_family", ["familyId"])
    .index("by_list", ["listId"]),
  families: defineTable({
    createdBy: v.id("users"),
    language: v.string(),
    description: v.string(),
    members: v.array(v.id("users")),
  }),
  noteLists: defineTable({
    name: v.string(),
    description: v.string(),
    familyId: v.id("families"),
  }).index("by_family", ["familyId"]),
  summaries: defineTable({
    summary: v.string(),
    familyId: v.id("families"),
    isStale: v.boolean(),
    date: v.string(),
  }).index("by_family", ["familyId"]),
});
