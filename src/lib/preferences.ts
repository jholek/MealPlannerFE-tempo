import { UserPreferences } from "@/types";

const PREFS_KEY = "meal-planner-preferences";

export const DEFAULT_PREFERENCES: UserPreferences = {
  householdSize: 2,
  mealTypes: ["breakfast", "lunch", "dinner"],
};

export function getPreferences(): UserPreferences {
  const stored = localStorage.getItem(PREFS_KEY);
  if (!stored) return DEFAULT_PREFERENCES;
  return JSON.parse(stored);
}

export function savePreferences(prefs: UserPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
