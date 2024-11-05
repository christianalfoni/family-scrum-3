import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, QueryCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { RegisteredQuery } from "convex/server";
import { Doc } from "./_generated/dataModel";

async function authenticate(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new ConvexError("Not signed in");
  }

  const user = await ctx.db.get(userId);

  if (!user) {
    throw new ConvexError("User not found");
  }

  return {
    userId,
    familyId: user.familyId,
  };
}

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    return userId !== null ? ctx.db.get(userId) : null;
  },
});

export const createFamily = mutation({
  args: {
    description: v.string(),
    language: v.string(),
  },
  handler: async (ctx, { description, language }) => {
    const { userId, familyId } = await authenticate(ctx);

    if (familyId) {
      throw new ConvexError("Already in a family");
    }

    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const newFamilyId = await ctx.db.insert("families", {
      createdBy: userId,
      description,
      language,
      members: [userId],
    });

    await ctx.db.patch(userId, { familyId: newFamilyId });
  },
});

export const family: RegisteredQuery<
  "public",
  Record<string, never>,
  Promise<Doc<"families">>
> = query({
  handler: async (ctx) => {
    const { familyId } = await authenticate(ctx);

    if (!familyId) {
      throw new ConvexError("Not in a family");
    }

    const family = await ctx.db.get(familyId);

    if (!family) {
      throw new ConvexError("Family not found");
    }

    return family;
  },
});
