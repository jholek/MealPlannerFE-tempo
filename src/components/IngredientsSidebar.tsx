import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  ListFilter,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Share,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: string;
  notes?: string;
  id?: string;
}

interface IngredientsSidebarProps {
  ingredients?: Ingredient[];
  currentPlanId?: string;
  onShareList?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const IngredientsSidebar = ({
  ingredients = [],
  currentPlanId,
  onShareList = () => {},
  open: externalOpen = false,
  onOpenChange = () => {},
}: IngredientsSidebarProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Combine internal and external state
  const open = externalOpen || internalOpen;

  // Update handler to notify parent component
  const setOpen = (newOpen: boolean) => {
    setInternalOpen(newOpen);
    onOpenChange(newOpen);

    // Update URL directly when opening the shopping list
    if (newOpen) {
      window.history.pushState({}, "", "/shopping-list");
    } else if (window.location.pathname === "/shopping-list") {
      window.history.pushState({}, "", "/");
    }
  };
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [completedOpen, setCompletedOpen] = useState(false);
  const [manualIngredients, setManualIngredients] = useState<Ingredient[]>([]);

  // Load all shopping list items from the database when the component mounts or currentPlanId changes
  useEffect(() => {
    const loadShoppingList = async () => {
      if (!currentPlanId) return;

      try {
        const { getShoppingList } = await import("@/lib/supabase/shoppingList");
        const items = await getShoppingList(currentPlanId);

        // Filter out manual items
        const manualItems = items
          .filter((item) => item.isManual)
          .map((item) => ({
            id: item.id,
            name: item.name,
            amount: item.amount,
            unit: item.unit,
            category: item.category,
            notes: item.notes,
          }));

        console.log("Loaded shopping list from database:", items);
        console.log("Filtered manual items:", manualItems);
        setManualIngredients(manualItems);

        // Set checked state for all items
        const checkedState = {};
        items.forEach((item) => {
          checkedState[item.id] = item.checked || false;
        });
        setCheckedItems(checkedState);
      } catch (error) {
        console.error("Error loading shopping list from database:", error);
      }
    };

    loadShoppingList();
  }, [currentPlanId]);

  const [newIngredient, setNewIngredient] = useState<{
    name: string;
    amount: string;
    unit: string;
    notes: string;
  }>({ name: "", amount: "", unit: "", notes: "" });

  // We need to merge recipe ingredients with database items
  // First, get all database items (from the shopping list)
  const [databaseItems, setDatabaseItems] = useState<SharedListItem[]>([]);

  // Load all database items when component mounts or currentPlanId changes
  useEffect(() => {
    const loadDatabaseItems = async () => {
      if (!currentPlanId) return;

      try {
        const { getShoppingList } = await import("@/lib/supabase/shoppingList");
        const items = await getShoppingList(currentPlanId);
        setDatabaseItems(items);
        console.log("Loaded all database items:", items);

        // Update checked state from database items
        const newCheckedState: Record<string, boolean> = {};
        items.forEach((item) => {
          if (item.checked) {
            newCheckedState[item.id] = true;
          }
        });
        setCheckedItems(newCheckedState);
      } catch (error) {
        console.error("Error loading database items:", error);
      }
    };

    loadDatabaseItems();
  }, [currentPlanId]);

  // We need to match recipe ingredients with their database counterparts
  const recipeIngredientsWithIds = ingredients.map((ing, index) => {
    // If the ingredient already has an ID, use it
    if (ing.id) return ing;

    // Try to find a matching item in the database
    const matchingItem = databaseItems.find(
      (item) =>
        !item.isManual && item.name === ing.name && item.unit === ing.unit,
    );

    // If we found a match in the database, use its ID and checked state
    if (matchingItem) {
      console.log(
        `Found matching database item for ${ing.name}:`,
        matchingItem,
      );
      return {
        ...ing,
        id: matchingItem.id,
        checked: matchingItem.checked,
      };
    }

    // Otherwise generate a stable ID based on properties
    // This ensures the same ingredient gets the same ID even across renders
    const stableId = `recipe-${ing.name}-${ing.unit}-${index}`
      .replace(/\s+/g, "-")
      .toLowerCase();
    console.log(`Generated stable ID for ${ing.name}: ${stableId}`);

    return {
      ...ing,
      id: stableId,
    };
  });

  const allIngredients = [...recipeIngredientsWithIds, ...manualIngredients];

  // Only track recipe ingredients in the UI, don't modify them in the database
  useEffect(() => {
    const loadExistingCheckedState = async () => {
      if (!currentPlanId) return;

      try {
        // Get the current plan's shared list ID
        const { data: dbPlan } = await supabase
          .from("meal_plans")
          .select("shared_list_id")
          .eq("id", currentPlanId)
          .single();

        if (!dbPlan?.shared_list_id) return;

        // Get the current shared list
        const { data: sharedList } = await supabase
          .from("shared_lists")
          .select("*")
          .eq("id", dbPlan.shared_list_id)
          .single();

        if (!sharedList) return;

        // Only update the checked state from the database
        const newCheckedState: Record<string, boolean> = {};
        sharedList.items.forEach((item) => {
          if (item.checked) {
            newCheckedState[item.id] = true;
          }
        });

        setCheckedItems(newCheckedState);

        console.log("Loaded checked state from database", {
          checkedItems: Object.keys(newCheckedState).length,
        });
      } catch (error) {
        console.error("Error loading checked state from database:", error);
      }
    };

    loadExistingCheckedState();
  }, [currentPlanId]);

  // Set up real-time subscription for shared list updates
  useEffect(() => {
    if (!currentPlanId) return;

    const setupRealtimeSubscription = async () => {
      try {
        // Get the current plan's shared list ID
        const { data: dbPlan } = await supabase
          .from("meal_plans")
          .select("shared_list_id")
          .eq("id", currentPlanId)
          .single();

        if (!dbPlan?.shared_list_id) return;

        console.log(
          "Setting up Supabase realtime subscription with filter:",
          `id=eq.${dbPlan.shared_list_id}`,
        );
        console.log("Channel name:", `shared_list_${dbPlan.shared_list_id}`);

        // Subscribe to changes on the shared_lists table for this specific list
        const subscription = supabase
          .channel(`shared_list_${dbPlan.shared_list_id}`)
          .on(
            "postgres_changes",
            {
              event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
              schema: "public",
              table: "shared_lists",
            },
            (payload) => {
              console.log(
                "REALTIME UPDATE RECEIVED IN INGREDIENTS SIDEBAR:",
                payload,
              );

              // Always fetch fresh data regardless of payload content
              supabase
                .from("shared_lists")
                .select("*")
                .eq("id", dbPlan.shared_list_id)
                .single()
                .then(({ data: refreshedList, error }) => {
                  if (error) {
                    console.error("Error refreshing shared list data:", error);
                    return;
                  }

                  if (refreshedList && refreshedList.items) {
                    console.log("Refreshed shared list data:", refreshedList);

                    // Filter out manual items from the shared list
                    const manualItems = refreshedList.items
                      .filter((item) => item.category === "Manual")
                      .map((item) => ({
                        id: item.id,
                        name: item.name,
                        amount: item.amount,
                        unit: item.unit,
                        category: item.category,
                        notes: item.notes,
                      }));

                    console.log(
                      "Updated manual items from database refresh:",
                      manualItems,
                    );
                    setManualIngredients(manualItems);

                    // Reset checked state completely and rebuild from database
                    const newCheckedState: Record<string, boolean> = {};
                    refreshedList.items.forEach((item) => {
                      if (item.checked) {
                        newCheckedState[item.id] = true;
                      }
                    });

                    console.log(
                      "Setting checked state from realtime update:",
                      newCheckedState,
                    );
                    setCheckedItems(newCheckedState);
                  }
                });
            },
          )
          .subscribe((status) => {
            console.log("Supabase subscription status:", status);
          });

        // Clean up subscription when component unmounts or currentPlanId changes
        return () => {
          console.log("Cleaning up real-time subscription");
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error setting up real-time subscription:", error);
      }
    };

    setupRealtimeSubscription();
    // No need to return cleanup function here as setupRealtimeSubscription already returns one
  }, [currentPlanId]);

  // Reload all data when the modal is opened
  useEffect(() => {
    if (open && currentPlanId) {
      const reloadAllData = async () => {
        try {
          console.log("Modal opened - reloading all data from database");

          const { getShoppingList } = await import(
            "@/lib/supabase/shoppingList"
          );
          const items = await getShoppingList(currentPlanId);

          // Store all database items for reference
          setDatabaseItems(items);
          console.log("All database items:", items);

          // Filter out manual items
          const manualItems = items
            .filter((item) => item.isManual)
            .map((item) => ({
              id: item.id,
              name: item.name,
              amount: item.amount,
              unit: item.unit,
              category: item.category,
              notes: item.notes,
            }));

          console.log("Reloaded shopping list when modal opened:", items);
          console.log("Filtered manual items:", manualItems);
          setManualIngredients(manualItems);

          // Reset checked state completely and rebuild from database
          const newCheckedState: Record<string, boolean> = {};
          items.forEach((item) => {
            if (item.checked) {
              newCheckedState[item.id] = true;
              console.log(`Item ${item.id} (${item.name}) is checked`);
            }
          });

          console.log("Setting checked state from database:", newCheckedState);
          setCheckedItems(newCheckedState);
        } catch (error) {
          console.error("Error reloading data:", error);
        }
      };

      reloadAllData();
    }
  }, [open, currentPlanId]);

  // All ingredients should already have IDs at this point
  // This is just a safety check
  const ingredientsWithIds = allIngredients.map((ing, index) => {
    if (ing.id) {
      return ing;
    }
    // If somehow an ingredient doesn't have an ID, generate a stable one
    const stableId = `item-${ing.name}-${ing.unit}-${index}`
      .replace(/\s+/g, "-")
      .toLowerCase();
    console.log(
      `WARNING: Found ingredient without ID, generating one: ${stableId}`,
    );
    return {
      ...ing,
      id: stableId,
    };
  });

  // First, create a stable order of all ingredients by category
  const allGroupedIngredients = ingredientsWithIds.reduce(
    (acc, ingredient) => {
      // Use the ingredient's category or default to "Other"
      const category = ingredient.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(ingredient);
      return acc;
    },
    {} as Record<string, Ingredient[]>,
  );

  // Then filter out checked items while maintaining the original order
  const groupedIngredients = Object.entries(allGroupedIngredients).reduce(
    (acc, [category, items]) => {
      const uncheckedItems = items.filter((item) => !checkedItems[item.id]);
      if (uncheckedItems.length > 0) {
        acc[category] = uncheckedItems;
      }
      return acc;
    },
    {} as Record<string, Ingredient[]>,
  );

  // Get completed items while preserving original order
  const completedItems = ingredientsWithIds.filter(
    (ing) => checkedItems[ing.id],
  );

  // Group completed items by category while maintaining original order
  const groupedCompletedItems = completedItems.reduce(
    (acc, ingredient) => {
      const category = ingredient.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(ingredient);
      return acc;
    },
    {} as Record<string, Ingredient[]>,
  );

  // Get top categories for preview
  const topCategories = Object.entries(groupedIngredients)
    .slice(0, 3)
    .map(([category, items]) => ({ category, count: items.length }));

  const handleCheckboxChange = async (id: string) => {
    if (!id) {
      console.error("Attempted to toggle checkbox with undefined ID");
      return;
    }

    console.log("Toggling checkbox for item ID:", id);

    // Find the item in our database items to log more details
    const item = databaseItems.find((item) => item.id === id);
    if (item) {
      console.log(`Toggling item: ${item.name} (${item.unit}) with ID ${id}`);
    } else {
      console.log(
        `Item with ID ${id} not found in database items - may be new`,
      );
    }

    // Update local state immediately for responsive UI
    const newValue = !checkedItems[id];
    const newCheckedItems = { ...checkedItems };

    if (newValue) {
      newCheckedItems[id] = true;
    } else {
      delete newCheckedItems[id];
    }

    console.log("New checked state:", newCheckedItems);
    setCheckedItems(newCheckedItems);

    // Update the database for all items
    if (currentPlanId) {
      try {
        const { updateItemCheckedState } = await import(
          "@/lib/supabase/shoppingList"
        );
        await updateItemCheckedState(currentPlanId, id, newValue);
        console.log("Successfully updated item check state in database", {
          itemId: id,
          checked: newValue,
        });

        // Refresh database items to ensure we have the latest state
        const { getShoppingList } = await import("@/lib/supabase/shoppingList");
        const refreshedItems = await getShoppingList(currentPlanId);
        setDatabaseItems(refreshedItems);
      } catch (error) {
        console.error("Error updating item checked state:", error);
      }
    }
  };

  const handleDeselectAll = async () => {
    // Update local state
    setCheckedItems({});

    // Update the database
    if (currentPlanId) {
      try {
        const { resetAllCheckedStates } = await import(
          "@/lib/supabase/shoppingList"
        );
        await resetAllCheckedStates(currentPlanId);
        console.log("Successfully reset all checked states in database");
      } catch (error) {
        console.error("Error deselecting items:", error);
      }
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) return;

    const manualItem: Ingredient = {
      name: newIngredient.name.trim(),
      amount: parseFloat(newIngredient.amount) || 1,
      unit: newIngredient.unit.trim(),
      category: "Manual",
      notes: newIngredient.notes.trim() || undefined,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };

    // Update local state
    setManualIngredients((prev) => [...prev, manualItem]);
    setNewIngredient({ name: "", amount: "", unit: "", notes: "" });

    // Update the database
    if (currentPlanId) {
      try {
        const { addManualItemToShoppingList } = await import(
          "@/lib/supabase/shoppingList"
        );
        await addManualItemToShoppingList(currentPlanId, {
          name: manualItem.name,
          amount: manualItem.amount,
          unit: manualItem.unit,
          notes: manualItem.notes,
          category: manualItem.category,
        });
        console.log(
          "Successfully added manual item to shopping list",
          manualItem,
        );
      } catch (error) {
        console.error("Error adding manual item to shopping list:", error);
      }
    }
  };

  const handleRemoveManualIngredient = async (id: string) => {
    // Update local state
    setManualIngredients((prev) => prev.filter((item) => item.id !== id));

    // Also remove from checked items if it was checked
    if (checkedItems[id]) {
      const newCheckedItems = { ...checkedItems };
      delete newCheckedItems[id];
      setCheckedItems(newCheckedItems);
    }

    // Update the database
    if (currentPlanId) {
      try {
        const { removeItemFromShoppingList } = await import(
          "@/lib/supabase/shoppingList"
        );
        await removeItemFromShoppingList(currentPlanId, id);
        console.log("Successfully removed item from shopping list", {
          itemId: id,
        });
      } catch (error) {
        console.error("Error removing item from shopping list:", error);
      }
    }
  };

  return (
    <>
      <Card className="w-full h-auto bg-white p-3 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-xl font-semibold">Shopping List</h2>
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-500">
                Ingredients needed for your meal plan
              </p>
              <Badge variant="outline" className="ml-1 text-xs py-0 px-2">
                Total: {allIngredients.length} items
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentPlanId && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-sm"
                onClick={onShareList}
              >
                <Share className="w-3 h-3 mr-1" />
                Share
              </Button>
            )}
            <Button
              onClick={() => setOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 h-8 text-sm"
              size="sm"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              View Full List
            </Button>
          </div>
        </div>

        {/* Preview of ingredients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {topCategories.map(({ category, count }) => (
            <Card
              key={category}
              className="p-2 hover:shadow-md cursor-pointer"
              onClick={() => setOpen(true)}
            >
              <div className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 text-xs py-0"
                >
                  {category}
                </Badge>
                <span className="text-xs text-gray-500">{count} items</span>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {groupedIngredients[category].slice(0, 3).map((ingredient) => (
                  <div
                    key={ingredient.name}
                    className="flex justify-between py-0.5"
                  >
                    <span className="truncate mr-2">
                      {ingredient.name}
                      {ingredient.notes && (
                        <span className="text-xs text-gray-500 italic ml-1">
                          ({ingredient.notes})
                        </span>
                      )}
                    </span>
                    <span className="whitespace-nowrap">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </div>
                ))}
                {groupedIngredients[category].length > 3 && (
                  <div className="text-purple-600 text-xs text-right">
                    +{groupedIngredients[category].length - 3} more items
                  </div>
                )}
              </div>
            </Card>
          ))}
          {Object.keys(groupedIngredients).length > 3 && (
            <Card
              className="p-2 hover:shadow-md cursor-pointer flex items-center justify-center"
              onClick={() => setOpen(true)}
            >
              <div className="text-center text-purple-600">
                <ListFilter className="w-4 h-4 mx-auto" />
                <span className="text-xs">
                  View {Object.keys(groupedIngredients).length - 3} more
                  categories
                </span>
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* Full ingredients modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-6 pt-12">
          <DialogHeader className="p-0 mb-4">
            <div className="flex items-center justify-between">
              <DialogTitle>Shopping List</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={async () => {
                    if (!currentPlanId) return;
                    try {
                      console.log("Manual refresh requested");
                      // Get the current plan's shared list ID
                      const { data: dbPlan } = await supabase
                        .from("meal_plans")
                        .select("shared_list_id")
                        .eq("id", currentPlanId)
                        .single();

                      if (dbPlan?.shared_list_id) {
                        // Get the current shared list
                        const { data: sharedList } = await supabase
                          .from("shared_lists")
                          .select("*")
                          .eq("id", dbPlan.shared_list_id)
                          .single();

                        if (sharedList && sharedList.items) {
                          console.log(
                            "Refreshed shared list data:",
                            sharedList,
                          );

                          // Filter out manual items from the shared list
                          const manualItems = sharedList.items
                            .filter((item) => item.category === "Manual")
                            .map((item) => ({
                              id: item.id,
                              name: item.name,
                              amount: item.amount,
                              unit: item.unit,
                              category: item.category,
                              notes: item.notes,
                            }));

                          console.log("Manually refreshed items:", manualItems);
                          setManualIngredients(manualItems);

                          // Reset checked state completely and rebuild from database
                          const newCheckedState: Record<string, boolean> = {};
                          sharedList.items.forEach((item) => {
                            if (item.checked) {
                              newCheckedState[item.id] = true;
                            }
                          });

                          console.log(
                            "Setting checked state from database:",
                            newCheckedState,
                          );
                          setCheckedItems(newCheckedState);
                        }
                      }
                    } catch (error) {
                      console.error("Error refreshing items:", error);
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                    <path d="M16 21h5v-5"></path>
                  </svg>
                  Refresh
                </Button>
                <Badge variant="outline" className="text-xs">
                  Total: {ingredientsWithIds.length} items
                </Badge>
                <Badge variant="outline" className="text-xs bg-green-50">
                  Completed: {completedItems.length} items
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="pr-2">
            <div className="space-y-6">
              {/* Quick add manual ingredient */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700"
                  >
                    Add Manual Item
                  </Badge>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddIngredient();
                  }}
                  className="border rounded-md p-3"
                >
                  <div className="grid grid-cols-12 gap-2">
                    <Input
                      placeholder="Item name"
                      className="col-span-4"
                      value={newIngredient.name}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          name: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Amount"
                      type="number"
                      className="col-span-2"
                      value={newIngredient.amount}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          amount: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Unit"
                      className="col-span-2"
                      value={newIngredient.unit}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          unit: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Notes (optional)"
                      className="col-span-3"
                      value={newIngredient.notes}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          notes: e.target.value,
                        })
                      }
                    />
                    <Button
                      className="col-span-1"
                      size="sm"
                      type="submit"
                      disabled={!newIngredient.name.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>

              {/* Active shopping list items */}
              {/* Show Manual category first */}
              {groupedIngredients["Manual"] && (
                <div key="Manual">
                  <div className="flex items-center gap-1 mb-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      Manual
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {groupedIngredients["Manual"].length} items
                    </span>
                  </div>
                  <div className="border rounded-md mb-6">
                    {groupedIngredients["Manual"].map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className="py-2 px-3 border-b last:border-b-0"
                      >
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() =>
                            ingredient.id && handleCheckboxChange(ingredient.id)
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={ingredient.id}
                              checked={
                                !!ingredient.id && !!checkedItems[ingredient.id]
                              }
                              onCheckedChange={() =>
                                ingredient.id &&
                                handleCheckboxChange(ingredient.id)
                              }
                            />
                            <span className="font-medium">
                              {ingredient.name}
                              {ingredient.notes && (
                                <span className="font-normal text-sm text-gray-500 ml-2">
                                  ({ingredient.notes})
                                </span>
                              )}
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs py-0 px-1 bg-blue-50 text-blue-700"
                              >
                                Manual
                              </Badge>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">
                              {ingredient.amount} {ingredient.unit}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveManualIngredient(ingredient.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other categories */}
              {Object.entries(groupedIngredients)
                .filter(([category]) => category !== "Manual")
                .map(([category, items], index) => (
                  <div key={category}>
                    <div className="flex items-center gap-1 mb-2">
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-700"
                      >
                        {category}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {items.length} items
                      </span>
                    </div>

                    <div className="border rounded-md">
                      {items.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className="py-2 px-3 border-b last:border-b-0"
                        >
                          <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() =>
                              ingredient.id &&
                              handleCheckboxChange(ingredient.id)
                            }
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={ingredient.id}
                                checked={
                                  !!ingredient.id &&
                                  !!checkedItems[ingredient.id]
                                }
                                onCheckedChange={() =>
                                  ingredient.id &&
                                  handleCheckboxChange(ingredient.id)
                                }
                              />
                              <span className="font-medium">
                                {ingredient.name}
                                {ingredient.notes && (
                                  <span className="font-normal text-sm text-gray-500 ml-2">
                                    ({ingredient.notes})
                                  </span>
                                )}
                                {ingredient.category === "Manual" && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs py-0 px-1 bg-blue-50 text-blue-700"
                                  >
                                    Manual
                                  </Badge>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">
                                {ingredient.amount} {ingredient.unit}
                              </span>
                              {ingredient.category === "Manual" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveManualIngredient(ingredient.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              {/* Completed items section */}
              {completedItems.length > 0 && (
                <Collapsible
                  open={completedOpen}
                  onOpenChange={setCompletedOpen}
                  className="mt-8"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        Completed Items
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {completedItems.length} items
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleDeselectAll}
                      >
                        Deselect All
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-7 w-7"
                        >
                          {completedOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  <CollapsibleContent>
                    {Object.entries(groupedCompletedItems).map(
                      ([category, items]) => (
                        <div key={`completed-${category}`} className="mb-4">
                          <div className="flex items-center gap-1 mb-2">
                            <Badge variant="outline" className="text-gray-500">
                              {category}
                            </Badge>
                          </div>
                          <div className="border border-gray-200 rounded-md">
                            {items.map((ingredient) => (
                              <div
                                key={ingredient.id}
                                className="py-2 px-3 border-b last:border-b-0 bg-gray-50"
                              >
                                <div
                                  className="flex justify-between items-center cursor-pointer"
                                  onClick={() =>
                                    ingredient.id &&
                                    handleCheckboxChange(ingredient.id)
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={ingredient.id}
                                      checked={
                                        !!ingredient.id &&
                                        !!checkedItems[ingredient.id]
                                      }
                                      onCheckedChange={() =>
                                        ingredient.id &&
                                        handleCheckboxChange(ingredient.id)
                                      }
                                    />
                                    <span className="font-medium line-through text-gray-500">
                                      {ingredient.name}
                                      {ingredient.notes && (
                                        <span className="font-normal text-sm text-gray-400 ml-2 line-through">
                                          ({ingredient.notes})
                                        </span>
                                      )}
                                      {ingredient.category === "Manual" && (
                                        <Badge
                                          variant="outline"
                                          className="ml-2 text-xs py-0 px-1 bg-blue-50 text-blue-700 no-underline"
                                        >
                                          Manual
                                        </Badge>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400 line-through">
                                      {ingredient.amount} {ingredient.unit}
                                    </span>
                                    {ingredient.category === "Manual" && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveManualIngredient(
                                            ingredient.id,
                                          );
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IngredientsSidebar;
