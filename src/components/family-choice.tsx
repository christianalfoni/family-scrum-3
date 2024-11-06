import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserPlus, Users } from "lucide-react";

type Props = {
  onCreateFamilyClick: () => void;
  onJoinFamilyClick: () => void;
};

export function FamilyChoiceComponent({
  onCreateFamilyClick,
  onJoinFamilyClick,
}: Props) {
  return (
    <div className="flex items-center justify-center">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Family Scrum</h1>
          <p className="text-muted-foreground mt-2">
            Choose an option to get started
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Create a Family
              </CardTitle>
              <CardDescription>
                Start a new family sharing notes
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={onCreateFamilyClick}>
                Create Family
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-6 w-6" />
                Join a Family
              </CardTitle>
              <CardDescription>
                Join an existing family with an invite code
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={onJoinFamilyClick}
              >
                Join Family
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
