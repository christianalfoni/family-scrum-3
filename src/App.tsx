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
import { TaskManagerComponent } from "./components/task-manager";

export default function App() {
  const user = useQuery(api.users.viewer);
  return (
    <Layout
      menu={
        <Authenticated>
          <UserMenu>{user?.name ?? user?.email}</UserMenu>
        </Authenticated>
      }
    >
      <>
        <AuthLoading>Signing in...</AuthLoading>
        <Authenticated>
          <TaskManagerComponent />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </>
    </Layout>
  );
}
