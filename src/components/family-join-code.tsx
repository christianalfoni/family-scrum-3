import React, { useState, useRef, KeyboardEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "@/components/ui/use-toast";
import { api } from "../../convex/_generated/api";

type Props = {
  onBackClick: () => void;
};

export function FamilyJoinCode({ onBackClick }: Props) {
  const joinFamilyMutation = useMutation(api.users.joinFamily);
  const [joiningFamily, setJoiningFamily] = useState(false);
  const [code, setCode] = useState(["", "", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const cursorPositionRef = useRef<number>(0);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit !== "") {
      if (index < 3) {
        inputRefs[index + 1].current?.focus();
      }
    } else if (value === "" && cursorPositionRef.current === 0 && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newCode = [...code];
      if (newCode[index] === "" && index > 0) {
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs[index - 1].current?.focus();
      } else {
        newCode[index] = "";
        setCode(newCode);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    cursorPositionRef.current = e.currentTarget.selectionStart || 0;
  };

  const handleJoin = async () => {
    const joinCode = code.join("");

    try {
      setJoiningFamily(true);
      await joinFamilyMutation({ code: joinCode });
    } catch (error) {
      toast({
        type: "foreground",
        variant: "destructive",
        title: "Error joining family",
        description: String(error),
      });
    } finally {
      setJoiningFamily(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-4 bg-card rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-foreground">
          Join Family
        </h2>
        <p className="text-center text-muted-foreground">
          Enter the 4-digit family code
        </p>
        <div className="flex justify-center space-x-2">
          {code.map((digit, index) => (
            <Input
              key={index}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-12 h-12 text-center text-lg font-bold"
              value={digit}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange(index, e.target.value)
              }
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                handleKeyDown(index, e)
              }
              onSelect={handleSelect}
              ref={inputRefs[index]}
              autoFocus={index === 0}
            />
          ))}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="w-1/2" onClick={onBackClick}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            disabled={joiningFamily}
            className="w-1/2"
            onClick={() => {
              void handleJoin();
            }}
          >
            Join Family
          </Button>
        </div>
      </div>
    </div>
  );
}
