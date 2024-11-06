import { Layout } from "@/Layout";
import { SignInForm } from "@/SignInForm";
import { UserMenu } from "@/components/UserMenu";
import {
  Authenticated,
  Unauthenticated,
  useQuery,
  AuthLoading,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { Notes } from "./components/Notes";
import { PhysicsSpinner } from "./components/ui/physics-spinner";
import { Onboarding } from "./components/Onboarding";
import { InviteCodeModalComponent } from "./components/invite-code-modal";
import { useState } from "react";

export default function App() {
  const user = useQuery(api.users.viewer);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <Layout
      menu={
        <Authenticated>
          <UserMenu
            onInvite={() => {
              setInviteModalOpen(true);
            }}
          >
            {user?.name ?? user?.email}
          </UserMenu>
        </Authenticated>
      }
    >
      <>
        <AuthLoading>
          <div className="flex justify-center items-center h-screen">
            <PhysicsSpinner />
          </div>
        </AuthLoading>

        {user && (
          <Authenticated>
            {user?.familyId ? <Notes /> : <Onboarding />}
            <InviteCodeModalComponent
              isOpen={isInviteModalOpen}
              onClose={() => setInviteModalOpen(false)}
            />
          </Authenticated>
        )}
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </>
    </Layout>
  );
}
