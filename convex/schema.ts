import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
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
  }),
  tasks: defineTable({
    userId: v.id("users"),
    familyId: v.id("families"),
    description: v.string(),
    isCompleted: v.boolean(),
    listId: v.id("taskLists"),
  })
    .index("by_family", ["familyId"])
    .index("by_list", ["listId"]),
  families: defineTable({
    createdBy: v.id("users"),
  }),
  taskLists: defineTable({
    name: v.string(),
    description: v.string(),
    familyId: v.id("families"),
  }).index("by_family", ["familyId"]),
  summaries: defineTable({
    summary: v.string(),
    familyId: v.id("families"),
    isStale: v.boolean(),
  }).index("by_family", ["familyId"]),
});
