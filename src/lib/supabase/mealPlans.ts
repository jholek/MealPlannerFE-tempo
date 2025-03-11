import { supabase } from "../supabase";
import { MealPlan } from "@/types";
import { getCurrentUser } from "./auth";

export async function createMealPlan(
  mealPlan: Omit<MealPlan, "id" | "createdAt" | "updatedAt" | "userId">,
): Promise<MealPlan> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  try {
    // Check if the meal_plans table exists
    const { error: tableCheckError } = await supabase
      .from("meal_plans")
      .select("id")
      .limit(1);

    // If table doesn't exist, throw detailed error
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'meal_plans' not available: ${tableCheckError.message}`,
      );
    }

    // Convert the meal plan data to a proper JSON string to ensure it's stored correctly
    const { data, error } = await supabase
      .from("meal_plans")
      .insert([
        {
          name: mealPlan.name, // Add the name field explicitly
          data: JSON.parse(JSON.stringify(mealPlan)), // Ensure clean JSON
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(
        `Failed to create meal plan in database: ${error.message}`,
      );
    }

    return {
      ...mealPlan,
      id: data.id,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Error in createMealPlan:", error);
    throw error;
  }
}

export async function updateMealPlan(mealPlan: MealPlan): Promise<MealPlan> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  try {
    // Check if the meal_plans table exists
    const { error: tableCheckError } = await supabase
      .from("meal_plans")
      .select("id")
      .limit(1);

    // If table doesn't exist, throw detailed error
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'meal_plans' not available: ${tableCheckError.message}`,
      );
    }

    // Convert the meal plan data to a proper JSON string to ensure it's stored correctly
    const { data, error } = await supabase
      .from("meal_plans")
      .update({
        name: mealPlan.name, // Add the name field explicitly
        data: JSON.parse(JSON.stringify(mealPlan)), // Ensure clean JSON
        updated_at: new Date().toISOString(),
      })
      .eq("id", mealPlan.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(
        `Failed to update meal plan in database: ${error.message}`,
      );
    }

    return {
      ...mealPlan,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Error in updateMealPlan:", error);
    throw error;
  }
}

export async function fetchMealPlans(): Promise<MealPlan[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  try {
    // Check if the meal_plans table exists
    const { error: tableCheckError } = await supabase
      .from("meal_plans")
      .select("id")
      .limit(1);

    // If table doesn't exist, throw detailed error
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'meal_plans' not available: ${tableCheckError.message}`,
      );
    }

    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(
        `Failed to fetch meal plans from database: ${error.message}`,
      );
    }

    // If no data, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row) => ({
      ...row.data,
      id: row.id,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error("Error in fetchMealPlans:", error);
    throw error;
  }
}

export async function deleteMealPlan(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  try {
    // Check if the meal_plans table exists
    const { error: tableCheckError } = await supabase
      .from("meal_plans")
      .select("id")
      .limit(1);

    // If table doesn't exist, throw detailed error
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'meal_plans' not available: ${tableCheckError.message}`,
      );
    }

    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(
        `Failed to delete meal plan from database: ${error.message}`,
      );
    }
  } catch (error) {
    console.error("Error in deleteMealPlan:", error);
    throw error;
  }
}

export async function getCurrentMealPlan(): Promise<MealPlan | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  try {
    // Check if the meal_plans table exists
    const { error: tableCheckError } = await supabase
      .from("meal_plans")
      .select("id")
      .limit(1);

    // If table doesn't exist, throw detailed error
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'meal_plans' not available: ${tableCheckError.message}`,
      );
    }

    // Get the most recent meal plan
    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No meal plan found
        return null;
      }
      console.error("Supabase fetch error:", error);
      throw new Error(`Failed to fetch current meal plan: ${error.message}`);
    }

    return {
      ...data.data,
      id: data.id,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Error in getCurrentMealPlan:", error);
    throw error;
  }
}
