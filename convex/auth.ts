import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

// Need explicit return type here for some reason
export const auth: ReturnType<typeof convexAuth> = convexAuth({
  providers: [Google],
});
