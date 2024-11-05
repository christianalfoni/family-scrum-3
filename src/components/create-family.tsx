import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

type Props = {
  description: string;
  setDescription: (value: string) => void;
  language: string;
  setLanguage: (value: string) => void;
  onBackClick: () => void;
};

export function CreateFamilyComponent({
  description,
  setDescription,
  language,
  setLanguage,
  onBackClick,
}: Props) {
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const createFamilyMutation = useMutation(api.users.createFamily);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !language) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingFamily(true);
      await createFamilyMutation({
        description,
        language,
      });
      toast({
        title: "Success",
        description: "Family created successfully!",
      });

      setDescription("");
      setLanguage("");
    } catch (error) {
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsCreatingFamily(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create a Family</CardTitle>
        <CardDescription>Set up your family group here.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                disabled={isCreatingFamily}
                id="description"
                rows={8}
                placeholder="Describe your family..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Norwegian">Norwegian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBackClick}>
          Back
        </Button>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setDescription("");
              setLanguage("");
            }}
            disabled={isCreatingFamily}
          >
            Reset
          </Button>
          <Button
            disabled={isCreatingFamily}
            onClick={(event) => {
              void handleSubmit(event);
            }}
          >
            Create Family
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
