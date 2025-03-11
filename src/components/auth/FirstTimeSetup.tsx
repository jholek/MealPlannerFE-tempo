import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PreferencesForm from "../setup/PreferencesForm";
import { getPreferences, savePreferences } from "@/lib/preferences";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { UserPreferences } from "@/types";

export default function FirstTimeSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const checkPreferences = async () => {
      try {
        const prefs = await getPreferences();
        setPreferences(prefs);

        // Check if preferences exist and have been customized
        const hasCustomPrefs =
          prefs &&
          (prefs.householdSize !== DEFAULT_PREFERENCES.householdSize ||
            JSON.stringify(prefs.mealTypes) !==
              JSON.stringify(DEFAULT_PREFERENCES.mealTypes));

        setHasPreferences(hasCustomPrefs);

        // If user already has preferences, redirect to home
        if (hasCustomPrefs) {
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkPreferences();
    }
  }, [user, navigate]);

  const handlePreferencesSubmit = async (prefs: UserPreferences) => {
    try {
      setLoading(true);
      // Make sure we're saving customized preferences
      const customizedPrefs = {
        ...prefs,
        // Ensure at least one value is different from defaults
        householdSize:
          prefs.householdSize || DEFAULT_PREFERENCES.householdSize + 1,
      };
      await savePreferences(customizedPrefs);
      // Set hasPreferences to true to avoid redirect loop
      setHasPreferences(true);
      navigate("/");
    } catch (error) {
      console.error("Error saving preferences:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Meal Planner
          </h1>
          <p className="text-gray-600 mt-2">
            Let's get your preferences set up for a personalized experience
          </p>
        </div>

        <div className="flex justify-center">
          <PreferencesForm
            onSubmit={handlePreferencesSubmit}
            initialPreferences={preferences}
          />
        </div>
      </div>
    </div>
  );
}
