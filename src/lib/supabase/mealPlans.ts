import { supabase } from "../supabase";
import { MealPlan } from "@/types";
import { getCurrentUser } from "./auth";

export async function createMealPlan(
  mealPlan: Omit<
    MealPlan,
    "id" | "createdAt" | "updatedAt" | "userId" | "sharedListId"
  >,
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
      sharedListId: data.shared_list_id,
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

    // Get the existing plan with shared_list_id to ensure we preserve it
    const { data: existingPlan, error: fetchError } = await supabase
      .from("meal_plans")
      .select("*, shared_list_id")
      .eq("id", mealPlan.id)
      .single();

    if (fetchError) {
      console.error("Error fetching existing meal plan:", fetchError);
      throw new Error(
        `Failed to fetch existing meal plan: ${fetchError.message}`,
      );
    }

    // Always prioritize the database shared_list_id
    const sharedListId = existingPlan.shared_list_id;

    console.log(
      `Updating meal plan ${mealPlan.id} with sharedListId ${sharedListId}`,
    );

    // Prepare the updated data object with the correct sharedListId
    const updatedData = {
      ...mealPlan,
      sharedListId: sharedListId, // Ensure sharedListId is preserved
    };

    // Delete the id, userId, createdAt, and updatedAt fields from the data object
    // as they are stored in separate columns
    delete updatedData.id;
    delete updatedData.userId;
    delete updatedData.createdAt;
    delete updatedData.updatedAt;

    // Update the meal plan with both the name and data fields
    const { data, error } = await supabase
      .from("meal_plans")
      .update({
        name: mealPlan.name,
        data: updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mealPlan.id)
      .eq("user_id", user.id)
      .select("*, shared_list_id")
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(
        `Failed to update meal plan in database: ${error.message}`,
      );
    }

    // Return the updated meal plan with the correct sharedListId
    return {
      ...mealPlan,
      sharedListId: data.shared_list_id,
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

    // Explicitly select shared_list_id to ensure it's included
    const { data, error } = await supabase
      .from("meal_plans")
      .select("*, shared_list_id")
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

    // Process each plan to ensure consistent data structure
    const processedPlans = await Promise.all(
      data.map(async (row) => {
        // Extract plan data from the JSON field
        const planData = row.data || {};

        // Always prioritize the database shared_list_id column
        const sharedListId = row.shared_list_id;

        // If the database has a shared_list_id but the data field doesn't, update the data field
        if (
          sharedListId &&
          (!planData.sharedListId || planData.sharedListId !== sharedListId)
        ) {
          console.log(
            `Updating data field for plan ${row.id} with sharedListId ${sharedListId}`,
          );

          const updatedData = {
            ...planData,
            sharedListId: sharedListId,
          };

          await supabase
            .from("meal_plans")
            .update({ data: updatedData })
            .eq("id", row.id);
        }

        // Return the processed plan with consistent structure
        return {
          ...planData,
          id: row.id,
          userId: row.user_id,
          sharedListId: sharedListId,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }),
    );

    return processedPlans;
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

    // Ensure sharedListId is consistent between data field and database column
    const planData = data.data || {};
    const sharedListId = data.shared_list_id || planData.sharedListId;

    return {
      ...planData,
      id: data.id,
      userId: data.user_id,
      sharedListId: sharedListId,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Error in getCurrentMealPlan:", error);
    throw error;
  }
}
