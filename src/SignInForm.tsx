import { Button } from "@/components/ui/button";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { PhysicsSpinner } from "./components/ui/physics-spinner";

type SignInState =
  | {
      isSigningIn: false;
      error: null;
    }
  | {
      isSigningIn: true;
      error: null;
    }
  | {
      isSigningIn: false;
      error: string;
    };

export function SignInForm() {
  const [{ isSigningIn, error }, setSignInState] = useState<SignInState>({
    isSigningIn: false,
    error: null,
  });
  const { signIn } = useAuthActions();

  const handleGoogleSignIn = async () => {
    setSignInState({ isSigningIn: true, error: null });
    try {
      const result = await signIn("google");

      setSignInState({ isSigningIn: true, error: null });

      if (result.redirect) {
        window.location.href = result.redirect.toString();
      }
    } catch (error) {
      setSignInState({ isSigningIn: false, error: String(error) });
    }
  };

  return (
    <div className="container my-auto">
      <div className="max-w-[384px] mx-auto flex flex-col my-auto gap-4 pb-8">
        {isSigningIn ? (
          <>
            <PhysicsSpinner />
          </>
        ) : (
          <>
            <h2 className="font-semibold text-2xl tracking-tight">
              Sign in with Google
            </h2>
            {error && (
              <div className="text-red-500">
                <p>Error: {error}</p>
              </div>
            )}
            <Button
              onClick={() => {
                void handleGoogleSignIn();
              }}
            >
              Sign in with Google
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
