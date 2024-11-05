import { ConvexError } from "convex/values";
import { QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function authenticate(ctx: QueryCtx) {
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

export async function authenticateWithFamily(ctx: QueryCtx) {
  const { userId, familyId } = await authenticate(ctx);

  if (!familyId) {
    throw new ConvexError("Not in a family");
  }

  return { userId, familyId };
}
