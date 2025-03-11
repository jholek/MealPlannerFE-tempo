import { supabase } from "../supabase";
import { Recipe } from "@/types";
import { getCurrentUser } from "./auth";

export async function createRecipe(
  recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt" | "userId">,
): Promise<Recipe> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Check if the recipes table exists
    const { error: tableCheckError } = await supabase
      .from("recipes")
      .select("id")
      .limit(1);

    // If table doesn't exist, throw detailed error
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'recipes' not available: ${tableCheckError.message}`,
      );
    }

    const { data, error } = await supabase
      .from("recipes")
      .insert([
        {
          data: recipe,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(`Failed to create recipe in database: ${error.message}`);
    }

    return {
      ...recipe,
      id: data.id,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Error in createRecipe:", error);
    throw error;
  }
}

export async function updateRecipe(recipe: Recipe): Promise<Recipe> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Check if the recipes table exists
    const { error: tableCheckError } = await supabase
      .from("recipes")
      .select("id")
      .limit(1);

    // If table doesn't exist, throw detailed error
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'recipes' not available: ${tableCheckError.message}`,
      );
    }

    // Ensure user can only update their own recipes
    const { data, error } = await supabase
      .from("recipes")
      .update({
        data: recipe,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recipe.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(`Failed to update recipe in database: ${error.message}`);
    }

    return {
      ...recipe,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Error in updateRecipe:", error);
    throw error;
  }
}

export async function fetchRecipes(): Promise<Recipe[]> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Check if the recipes table exists
    const { error: tableCheckError } = await supabase
      .from("recipes")
      .select("id")
      .limit(1);

    // If table doesn't exist, throw detailed error
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'recipes' not available: ${tableCheckError.message}`,
      );
    }

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(
        `Failed to fetch recipes from database: ${error.message}`,
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
    console.error("Error in fetchRecipes:", error);
    throw error;
  }
}

export async function deleteRecipe(id: string): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Check if the recipes table exists
    const { error: tableCheckError } = await supabase
      .from("recipes")
      .select("id")
      .limit(1);

    // If table doesn't exist, throw detailed error
    if (tableCheckError) {
      console.error("Supabase table error:", tableCheckError);
      throw new Error(
        `Database table 'recipes' not available: ${tableCheckError.message}`,
      );
    }

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(
        `Failed to delete recipe from database: ${error.message}`,
      );
    }
  } catch (error) {
    console.error("Error in deleteRecipe:", error);
    throw error;
  }
}
