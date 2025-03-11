import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getPreferences } from "@/lib/preferences";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingPreferences, setCheckingPreferences] = useState(false);

  // Track if initial check has been done
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    // Only check preferences on initial load or when explicitly navigating to a new route
    // This prevents checks when just switching tabs and coming back to the app
    const isInitialLoad = !initialCheckDone;

    // If user is authenticated and not on the setup page, check if they need to complete setup
    if (user && !loading && location.pathname !== "/setup" && isInitialLoad) {
      const checkPreferences = async () => {
        setCheckingPreferences(true);
        try {
          const prefs = await getPreferences();

          // Check if preferences exist and have been customized
          const hasCustomPrefs =
            prefs &&
            (prefs.householdSize !== DEFAULT_PREFERENCES.householdSize ||
              JSON.stringify(prefs.mealTypes) !==
                JSON.stringify(DEFAULT_PREFERENCES.mealTypes));

          // If user doesn't have preferences, redirect to setup
          if (!hasCustomPrefs && location.pathname !== "/") {
            navigate("/setup");
          }

          // Mark initial check as done
          setInitialCheckDone(true);
        } catch (error) {
          console.error("Error checking preferences:", error);
        } finally {
          setCheckingPreferences(false);
        }
      };

      checkPreferences();
    } else if (!isInitialLoad) {
      // If not initial load, just mark checking as done
      setCheckingPreferences(false);
    }
  }, [user, loading, navigate, location.pathname, initialCheckDone]);

  if (loading || checkingPreferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
