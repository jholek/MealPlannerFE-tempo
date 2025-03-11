import { supabase } from "../supabase";
import { MealPlan } from "@/types";
import { getCurrentUser } from "./auth";

export async function createMealPlan(
  mealPlan: Omit<MealPlan, "id" | "createdAt" | "updatedAt" | "userId">,
): Promise<MealPlan> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("meal_plans")
    .insert([
      {
        data: mealPlan,
        user_id: user.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return {
    ...mealPlan,
    id: data.id,
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateMealPlan(mealPlan: MealPlan): Promise<MealPlan> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("meal_plans")
    .update({
      data: mealPlan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mealPlan.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  return {
    ...mealPlan,
    updatedAt: data.updated_at,
  };
}

export async function fetchMealPlans(): Promise<MealPlan[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map((row) => ({
    ...row.data,
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteMealPlan(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function getCurrentMealPlan(): Promise<MealPlan | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

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
    throw error;
  }

  return {
    ...data.data,
    id: data.id,
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
