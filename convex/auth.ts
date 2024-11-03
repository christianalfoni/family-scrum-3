import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

const convexAuthInstance: ReturnType<typeof convexAuth> = convexAuth({
  providers: [Google],
});

export const auth: ReturnType<typeof convexAuth>["auth"] =
  convexAuthInstance.auth;
export const signIn: ReturnType<typeof convexAuth>["signIn"] =
  convexAuthInstance.signIn;
export const signOut: ReturnType<typeof convexAuth>["signOut"] =
  convexAuthInstance.signOut;
export const store: ReturnType<typeof convexAuth>["store"] =
  convexAuthInstance.store;
