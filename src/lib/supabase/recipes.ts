import { supabase } from "../supabase";
import { Recipe } from "@/types";

export async function createRecipe(
  recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">,
): Promise<Recipe> {
  const { data, error } = await supabase
    .from("recipes")
    .insert([
      {
        data: recipe,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return {
    ...recipe,
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateRecipe(recipe: Recipe): Promise<Recipe> {
  const { data, error } = await supabase
    .from("recipes")
    .update({
      data: recipe,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recipe.id)
    .select()
    .single();

  if (error) throw error;
  return {
    ...recipe,
    updatedAt: data.updated_at,
  };
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map((row) => ({
    ...row.data,
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from("recipes").delete().eq("id", id);

  if (error) throw error;
}
