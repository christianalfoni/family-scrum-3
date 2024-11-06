import { useState } from "react";
import { FamilyChoiceComponent } from "./family-choice";
import { CreateFamilyComponent } from "./create-family";
import { FamilyJoinCode } from "./family-join-code";

export function Onboarding() {
  const [step, setStep] = useState<
    "create-family" | "family-choice" | "join-family"
  >("family-choice");

  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");

  const handleCreateFamilyClick = () => {
    setStep("create-family");
  };

  const handleJoinFamilyClick = () => {
    setStep("join-family");
  };

  const handleBackClick = () => {
    setStep("family-choice");
  };

  return (
    <div className="flex items-center justify-center pt-20">
      {step === "family-choice" && (
        <FamilyChoiceComponent
          onCreateFamilyClick={handleCreateFamilyClick}
          onJoinFamilyClick={handleJoinFamilyClick}
        />
      )}
      {step === "create-family" && (
        <CreateFamilyComponent
          description={description}
          setDescription={setDescription}
          language={language}
          setLanguage={setLanguage}
          onBackClick={handleBackClick}
        />
      )}
      {step === "join-family" && (
        <FamilyJoinCode onBackClick={handleBackClick} />
      )}
    </div>
  );
}
