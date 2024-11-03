import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const {
  auth,
  signIn,
  signOut,
  store,
}: {
  auth: ReturnType<typeof convexAuth>["auth"];
  signIn: ReturnType<typeof convexAuth>["signIn"];
  signOut: ReturnType<typeof convexAuth>["signOut"];
  store: ReturnType<typeof convexAuth>["store"];
} = convexAuth({
  providers: [Google],
});
