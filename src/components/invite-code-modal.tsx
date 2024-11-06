import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function InviteCodeModalComponent({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [invite, setInvite] = useState<{ code: string; ttl: number } | null>(
    null,
  );
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const inviteMutation = useMutation(api.users.invite);
  const [isExpired, setIsExpired] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const progress =
    invite !== null && timeLeft !== null ? (100 / invite.ttl) * timeLeft : 100;

  const fetchCode = async () => {
    setIsLoading(true);
    setIsExpired(false);
    try {
      const { code, ttl } = await inviteMutation();
      setInvite({ code, ttl });
      setTimeLeft(ttl);
    } catch (error) {
      console.error("Failed to fetch invite code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [invite]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Family Invite Code {isLoading}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 p-4">
          {isExpired ? (
            <>
              <p>The invite code has expired.</p>
              <Button
                disabled={isLoading}
                onClick={() => {
                  void fetchCode();
                }}
              >
                Get New Code
              </Button>
            </>
          ) : invite ? (
            <>
              <p className="text-2xl font-bold">{invite.code}</p>
              <p className="text-center">
                Ask your family member to join a family with this code.
              </p>
              <Progress value={progress} className="w-full" />
              <p>{timeLeft} seconds remaining</p>
            </>
          ) : (
            <p>Failed to load invite code. Please try again.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
