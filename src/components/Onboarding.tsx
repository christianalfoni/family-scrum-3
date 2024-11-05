import { useState } from "react";
import { FamilyChoiceComponent } from "./family-choice";
import { CreateFamilyComponent } from "./create-family";

export function Onboarding() {
  const [step, setStep] = useState<"create-family" | "family-choice">(
    "family-choice",
  );

  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");

  const handleCreateFamilyClick = () => {
    setStep("create-family");
  };

  const handleBackClick = () => {
    setStep("family-choice");
  };

  return (
    <div className="flex items-center justify-center pt-20">
      {step === "family-choice" && (
        <FamilyChoiceComponent onCreateFamilyClick={handleCreateFamilyClick} />
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
    </div>
  );
}
