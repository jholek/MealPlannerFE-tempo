import { supabase } from "../supabase";
import { UserPreferences } from "@/types";
import { getCurrentUser } from "./auth";

export async function savePreferencesToDB(
  preferences: UserPreferences,
): Promise<UserPreferences> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Check if the user_preferences table exists
    const { error: tableCheckError } = await supabase
      .from("user_preferences")
      .select("id")
      .limit(1);

    // If table doesn't exist, throw detailed error
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'user_preferences' not available: ${tableCheckError.message}`,
      );
    }

    // First, delete any potential duplicate preferences for this user
    // This ensures we only have one preference record per user
    const { error: deleteError } = await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error cleaning up preferences:", deleteError);
      // Continue anyway, as the insert might still work
    }

    // Create new preferences
    const { data, error } = await supabase
      .from("user_preferences")
      .insert([
        {
          user_id: user.id,
          data: preferences,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(
        `Failed to save preferences in database: ${error.message}`,
      );
    }
    return data.data;
  } catch (error) {
    console.error("Error in savePreferencesToDB:", error);
    throw error;
  }
}

export async function getPreferencesFromDB(): Promise<UserPreferences | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    // Check if the user_preferences table exists
    const { error: tableCheckError } = await supabase
      .from("user_preferences")
      .select("id")
      .limit(1);

    // If table doesn't exist, return null to fall back to local storage
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'user_preferences' not available: ${tableCheckError.message}`,
      );
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No preferences found for this user
        return null;
      }
      throw error;
    }

    return data.data;
  } catch (error) {
    console.error("Error in getPreferencesFromDB:", error);
    throw error;
  }
}
