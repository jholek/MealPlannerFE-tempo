import { useState } from "react";
import PreferencesForm from "./PreferencesForm";
import { UserPreferences } from "@/types";

export default function SetupFlow() {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<UserPreferences>();

  const handlePreferencesSubmit = (prefs: UserPreferences) => {
    setPreferences(prefs);
    setStep(2);
    // In a real app, we'd save this to the backend
    console.log("Preferences saved:", prefs);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Meal Planner</h1>
          <p className="text-gray-600 mt-2">
            Let's get your preferences set up for a personalized experience
          </p>
        </div>

        {step === 1 && (
          <div className="flex justify-center">
            <PreferencesForm onSubmit={handlePreferencesSubmit} />
          </div>
        )}
      </div>
    </div>
  );
}
