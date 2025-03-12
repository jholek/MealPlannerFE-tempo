import { supabase } from "../supabase";
import { getCurrentUser } from "./auth";
import { nanoid } from "nanoid";
import { SharedListItem } from "@/types";

// Create a shopping list for a meal plan
export async function createShoppingListForPlan(
  mealPlanId: string,
  ingredients: any[],
): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  try {
    // First check if this plan already has a shared list
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from("meal_plans")
      .select("shared_list_id")
      .eq("id", mealPlanId)
      .single();

    if (mealPlanError) {
      console.error("Error fetching meal plan:", mealPlanError);
      throw new Error(`Failed to fetch meal plan: ${mealPlanError.message}`);
    }

    // If the plan already has a shared list, update it
    if (mealPlan.shared_list_id) {
      console.log("Plan already has a shared list, updating it");
      return mealPlan.shared_list_id;
    }

    // Create a new shared list
    const shareId = nanoid(10); // Generate a short, unique ID for sharing
    const listName = `Shopping List - ${new Date().toLocaleDateString()}`;

    // Format ingredients for the shared list
    const formattedItems = ingredients.map((ing) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: ing.category || "Other",
      notes: ing.notes,
      checked: false,
      createdAt: new Date().toISOString(),
      mealKey: ing.mealKey, // Store which meal this ingredient belongs to
      recipeId: ing.recipeId, // Store which recipe this ingredient belongs to
      isManual: false,
    }));

    // Create the shared list
    const { data, error } = await supabase
      .from("shared_lists")
      .insert([
        {
          name: listName,
          items: formattedItems,
          share_id: shareId,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating shared list:", error);
      throw new Error(`Failed to create shared list: ${error.message}`);
    }

    // Update the meal plan with the shared list ID
    const { error: updateError } = await supabase
      .from("meal_plans")
      .update({ shared_list_id: data.id })
      .eq("id", mealPlanId);

    if (updateError) {
      console.error("Error updating meal plan:", updateError);
      throw new Error(`Failed to update meal plan: ${updateError.message}`);
    }

    // Also update the data field to maintain consistency
    const { data: planData, error: planDataError } = await supabase
      .from("meal_plans")
      .select("data")
      .eq("id", mealPlanId)
      .single();

    if (!planDataError && planData) {
      const updatedData = {
        ...planData.data,
        sharedListId: data.id,
      };

      await supabase
        .from("meal_plans")
        .update({ data: updatedData })
        .eq("id", mealPlanId);
    }

    return data.id;
  } catch (error) {
    console.error("Error in createShoppingListForPlan:", error);
    throw error;
  }
}

// Update shopping list items based on meal plan changes
export async function updateShoppingListItems(
  mealPlanId: string,
  plannedMeals: Record<string, any>,
): Promise<void> {
  try {
    console.log("Updating shopping list for meal plan:", mealPlanId);
    console.log("Planned meals:", plannedMeals);

    // Get the shared list ID for this meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from("meal_plans")
      .select("*, shared_list_id")
      .eq("id", mealPlanId)
      .single();

    if (mealPlanError) {
      console.error("Error fetching meal plan:", mealPlanError);
      throw new Error(`Failed to fetch meal plan: ${mealPlanError.message}`);
    }

    console.log("Fetched meal plan from database:", mealPlan);

    if (!mealPlan.shared_list_id) {
      // No shared list exists yet, create one
      const ingredients = extractIngredientsFromMeals(plannedMeals);
      await createShoppingListForPlan(mealPlanId, ingredients);
      return;
    }

    // Get the current shared list
    const { data: sharedList, error: sharedListError } = await supabase
      .from("shared_lists")
      .select("*")
      .eq("id", mealPlan.shared_list_id)
      .single();

    if (sharedListError) {
      console.error("Error fetching shared list:", sharedListError);
      throw new Error(
        `Failed to fetch shared list: ${sharedListError.message}`,
      );
    }

    console.log("Current shared list:", sharedList);

    // Extract all ingredients from the current meal plan
    const newIngredients = extractIngredientsFromMeals(plannedMeals);
    console.log("Extracted ingredients from meals:", newIngredients);

    // Keep manual items and checked state from the existing list
    const manualItems = sharedList.items.filter((item) => item.isManual);
    console.log("Manual items to preserve:", manualItems);

    // Create a map of checked items by name+unit to preserve checked state
    const checkedItemsMap = new Map();
    sharedList.items.forEach((item) => {
      if (item.checked) {
        const key = `${item.name}-${item.unit}`;
        checkedItemsMap.set(key, true);
      }
    });

    // Apply checked state to new ingredients if they match
    const updatedIngredients = newIngredients.map((ing) => {
      const key = `${ing.name}-${ing.unit}`;
      return {
        ...ing,
        checked: checkedItemsMap.has(key) ? true : false,
      };
    });

    // Combine manual items with updated ingredients
    const combinedItems = [...updatedIngredients, ...manualItems];
    console.log("Combined items to save:", combinedItems);

    // Update the shared list with the new items
    const { error: updateError } = await supabase
      .from("shared_lists")
      .update({
        items: combinedItems,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mealPlan.shared_list_id);

    if (updateError) {
      console.error("Error updating shared list:", updateError);
      throw new Error(`Failed to update shared list: ${updateError.message}`);
    }

    console.log("Successfully updated shared list");
  } catch (error) {
    console.error("Error in updateShoppingListItems:", error);
    throw error;
  }
}

// Helper function to extract ingredients from planned meals
function extractIngredientsFromMeals(plannedMeals: Record<string, any>): any[] {
  const ingredients = [];

  Object.entries(plannedMeals).forEach(([mealKey, meal]) => {
    // Skip leftover meals as they don't contribute to shopping list
    if (meal.isLeftover) return;

    // Add each ingredient with a reference to its meal
    (meal.ingredients || []).forEach((ing, index) => {
      // Create a truly unique ID for each ingredient instance
      // Include mealKey to ensure the same ingredient in different meals gets different IDs
      const uniqueId = `item-${meal.recipeId}-${mealKey}-${index}-${Math.random().toString(36).substring(2, 9)}`;

      ingredients.push({
        ...ing,
        mealKey,
        recipeId: meal.recipeId,
        id: uniqueId,
        checked: false,
        createdAt: new Date().toISOString(),
        isManual: false,
      });
    });
  });

  return ingredients;
}

// Add a manual item to the shopping list
export async function addManualItemToShoppingList(
  mealPlanId: string,
  item: {
    name: string;
    amount: number;
    unit: string;
    notes?: string;
    category: string;
  },
): Promise<void> {
  try {
    console.log(
      "Adding manual item to shopping list for meal plan:",
      mealPlanId,
    );
    console.log("Item to add:", item);

    // Get the shared list ID for this meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from("meal_plans")
      .select("*, shared_list_id")
      .eq("id", mealPlanId)
      .single();

    if (mealPlanError) {
      console.error("Error fetching meal plan:", mealPlanError);
      throw new Error(`Failed to fetch meal plan: ${mealPlanError.message}`);
    }

    console.log("Fetched meal plan:", mealPlan);

    if (!mealPlan.shared_list_id) {
      console.log("No shared list exists yet, creating one with manual item");
      // No shared list exists yet, create one with just this manual item
      const manualItem = {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        checked: false,
        createdAt: new Date().toISOString(),
        isManual: true,
      };
      await createShoppingListForPlan(mealPlanId, [manualItem]);
      return;
    }

    // Get the current shared list
    const { data: sharedList, error: sharedListError } = await supabase
      .from("shared_lists")
      .select("*")
      .eq("id", mealPlan.shared_list_id)
      .single();

    if (sharedListError) {
      console.error("Error fetching shared list:", sharedListError);
      throw new Error(
        `Failed to fetch shared list: ${sharedListError.message}`,
      );
    }

    console.log("Current shared list:", sharedList);

    // Create the new manual item
    const manualItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      category: item.category,
      notes: item.notes,
      checked: false,
      createdAt: new Date().toISOString(),
      isManual: true,
    };

    console.log("Created manual item:", manualItem);

    // Add the manual item to the existing items
    const updatedItems = [...(sharedList.items || []), manualItem];
    console.log("Updated items list with new manual item:", updatedItems);

    // Update the shared list with the new items
    const { error: updateError } = await supabase
      .from("shared_lists")
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mealPlan.shared_list_id);

    if (updateError) {
      console.error("Error updating shared list:", updateError);
      throw new Error(`Failed to update shared list: ${updateError.message}`);
    }

    console.log("Successfully added manual item to shared list");

    // Verify the meal plan data wasn't affected
    const { data: verifyPlan, error: verifyError } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("id", mealPlanId)
      .single();

    if (verifyError) {
      console.error(
        "Error verifying meal plan after adding manual item:",
        verifyError,
      );
    } else {
      console.log("Verified meal plan after adding manual item:", verifyPlan);
    }
  } catch (error) {
    console.error("Error in addManualItemToShoppingList:", error);
    throw error;
  }
}

// Remove a manual item from the shopping list
export async function removeItemFromShoppingList(
  mealPlanId: string,
  itemId: string,
): Promise<void> {
  try {
    // Get the shared list ID for this meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from("meal_plans")
      .select("shared_list_id")
      .eq("id", mealPlanId)
      .single();

    if (mealPlanError) {
      console.error("Error fetching meal plan:", mealPlanError);
      throw new Error(`Failed to fetch meal plan: ${mealPlanError.message}`);
    }

    if (!mealPlan.shared_list_id) {
      // No shared list exists
      return;
    }

    // Get the current shared list
    const { data: sharedList, error: sharedListError } = await supabase
      .from("shared_lists")
      .select("*")
      .eq("id", mealPlan.shared_list_id)
      .single();

    if (sharedListError) {
      console.error("Error fetching shared list:", sharedListError);
      throw new Error(
        `Failed to fetch shared list: ${sharedListError.message}`,
      );
    }

    // Remove the item from the list
    const updatedItems = sharedList.items.filter((item) => item.id !== itemId);

    // Update the shared list with the new items
    const { error: updateError } = await supabase
      .from("shared_lists")
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mealPlan.shared_list_id);

    if (updateError) {
      console.error("Error updating shared list:", updateError);
      throw new Error(`Failed to update shared list: ${updateError.message}`);
    }
  } catch (error) {
    console.error("Error in removeItemFromShoppingList:", error);
    throw error;
  }
}

// Update the checked state of an item
export async function updateItemCheckedState(
  mealPlanId: string,
  itemId: string,
  checked: boolean,
): Promise<void> {
  try {
    console.log(`Updating item ${itemId} checked state to ${checked}`);

    // Get the shared list ID for this meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from("meal_plans")
      .select("shared_list_id")
      .eq("id", mealPlanId)
      .single();

    if (mealPlanError) {
      console.error("Error fetching meal plan:", mealPlanError);
      throw new Error(`Failed to fetch meal plan: ${mealPlanError.message}`);
    }

    if (!mealPlan.shared_list_id) {
      console.error("No shared list exists for this meal plan");
      return;
    }

    console.log(`Found shared list ID: ${mealPlan.shared_list_id}`);

    // Get the current shared list
    const { data: sharedList, error: sharedListError } = await supabase
      .from("shared_lists")
      .select("*")
      .eq("id", mealPlan.shared_list_id)
      .single();

    if (sharedListError) {
      console.error("Error fetching shared list:", sharedListError);
      throw new Error(
        `Failed to fetch shared list: ${sharedListError.message}`,
      );
    }

    console.log(`Current shared list has ${sharedList.items.length} items`);

    // Find the item we're updating
    const itemToUpdate = sharedList.items.find((item) => item.id === itemId);
    if (itemToUpdate) {
      console.log(
        `Found item to update: ${itemToUpdate.name} (${itemToUpdate.unit})`,
      );
    } else {
      console.error(`Item with ID ${itemId} not found in shared list`);
      // If the item doesn't exist in the database yet, we need to add it
      // This can happen with recipe ingredients that haven't been saved yet
      console.log("Item not found in database, may need to be added first");
    }

    // Update the checked state of the item
    const updatedItems = sharedList.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, checked };
      }
      return item;
    });

    // If we didn't find the item, the array is unchanged
    if (updatedItems.length === sharedList.items.length && !itemToUpdate) {
      console.log("Item not found in shared list, no changes made");
    }

    // Update the shared list with the new items
    const { error: updateError } = await supabase
      .from("shared_lists")
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mealPlan.shared_list_id);

    if (updateError) {
      console.error("Error updating shared list:", updateError);
      throw new Error(`Failed to update shared list: ${updateError.message}`);
    }

    console.log("Successfully updated item checked state in database");
  } catch (error) {
    console.error("Error in updateItemCheckedState:", error);
    throw error;
  }
}

// Reset all checked states to false
export async function resetAllCheckedStates(mealPlanId: string): Promise<void> {
  try {
    // Get the shared list ID for this meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from("meal_plans")
      .select("shared_list_id")
      .eq("id", mealPlanId)
      .single();

    if (mealPlanError) {
      console.error("Error fetching meal plan:", mealPlanError);
      throw new Error(`Failed to fetch meal plan: ${mealPlanError.message}`);
    }

    if (!mealPlan.shared_list_id) {
      // No shared list exists
      return;
    }

    // Get the current shared list
    const { data: sharedList, error: sharedListError } = await supabase
      .from("shared_lists")
      .select("*")
      .eq("id", mealPlan.shared_list_id)
      .single();

    if (sharedListError) {
      console.error("Error fetching shared list:", sharedListError);
      throw new Error(
        `Failed to fetch shared list: ${sharedListError.message}`,
      );
    }

    // Reset all checked states
    const updatedItems = sharedList.items.map((item) => ({
      ...item,
      checked: false,
    }));

    // Update the shared list with the new items
    const { error: updateError } = await supabase
      .from("shared_lists")
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mealPlan.shared_list_id);

    if (updateError) {
      console.error("Error updating shared list:", updateError);
      throw new Error(`Failed to update shared list: ${updateError.message}`);
    }
  } catch (error) {
    console.error("Error in resetAllCheckedStates:", error);
    throw error;
  }
}

// Get the shopping list for a meal plan
export async function getShoppingList(
  mealPlanId: string,
): Promise<SharedListItem[]> {
  try {
    // Get the shared list ID for this meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from("meal_plans")
      .select("shared_list_id")
      .eq("id", mealPlanId)
      .single();

    if (mealPlanError) {
      console.error("Error fetching meal plan:", mealPlanError);
      throw new Error(`Failed to fetch meal plan: ${mealPlanError.message}`);
    }

    if (!mealPlan.shared_list_id) {
      // No shared list exists yet
      return [];
    }

    // Get the current shared list
    const { data: sharedList, error: sharedListError } = await supabase
      .from("shared_lists")
      .select("*")
      .eq("id", mealPlan.shared_list_id)
      .single();

    if (sharedListError) {
      console.error("Error fetching shared list:", sharedListError);
      throw new Error(
        `Failed to fetch shared list: ${sharedListError.message}`,
      );
    }

    return sharedList.items || [];
  } catch (error) {
    console.error("Error in getShoppingList:", error);
    throw error;
  }
}
