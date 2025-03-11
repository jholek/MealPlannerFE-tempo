import { UserPreferences } from "@/types";
import {
  getPreferencesFromDB,
  savePreferencesToDB,
} from "./supabase/preferences";

const PREFS_KEY = "meal-planner-preferences";

export const DEFAULT_PREFERENCES: UserPreferences = {
  householdSize: 2,
  mealTypes: ["breakfast", "lunch", "dinner"],
};

export async function getPreferences(): Promise<UserPreferences> {
  try {
    // Try to get preferences from DB first
    const dbPrefs = await getPreferencesFromDB();
    if (dbPrefs) {
      // Update local storage with DB values
      localStorage.setItem(PREFS_KEY, JSON.stringify(dbPrefs));
      return dbPrefs;
    }

    // Fall back to local storage if not in DB
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) {
      const localPrefs = JSON.parse(stored);
      // Save to DB for future use
      try {
        await savePreferencesToDB(localPrefs);
      } catch (err) {
        console.warn("Could not save preferences to DB:", err);
      }
      return localPrefs;
    }

    // No preferences found, use defaults
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error("Error getting preferences:", error);
    // Fall back to local storage if DB fails
    const stored = localStorage.getItem(PREFS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(prefs: UserPreferences) {
  try {
    // Save to DB
    const savedPrefs = await savePreferencesToDB(prefs);
    // Also save to local storage as backup
    localStorage.setItem(PREFS_KEY, JSON.stringify(savedPrefs || prefs));
    return savedPrefs || prefs;
  } catch (error) {
    console.error("Error saving preferences to DB:", error);
    // At least save to local storage
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    return prefs;
  }
}

// Synchronous version for components that can't use async
export function getPreferencesSync(): UserPreferences {
  const stored = localStorage.getItem(PREFS_KEY);
  if (!stored) return DEFAULT_PREFERENCES;
  return JSON.parse(stored);
}
