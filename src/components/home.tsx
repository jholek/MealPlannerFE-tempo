import React, { useState, useCallback, useEffect } from "react";
import RemoveRecipeDialog from "./recipes/RemoveRecipeDialog";
import RecipeBrowser from "./recipes/RecipeBrowser";
import WeeklyCalendarGrid from "./WeeklyCalendarGrid";
import IngredientsSidebar from "./IngredientsSidebar";
import PreferencesForm from "./setup/PreferencesForm";
import LeftoverCard from "./LeftoverCard";
import WeeklyPlanSelector from "./WeeklyPlanSelector";
import { Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import {
  getPreferences,
  getPreferencesSync,
  savePreferences,
} from "@/lib/preferences";
import { ScrollArea } from "./ui/scroll-area";
import UserMenu from "./auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { MealPlan } from "@/types";
import {
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getCurrentMealPlan,
} from "@/lib/supabase/mealPlans";

interface Meal {
  id: string;
  name: string;
  servings: number;
  time: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
    category: string;
  }[];
}

interface PlannedMeal {
  name: string;
  servings: number;
  time: string;
  originalServings: number;
  recipeId: string;
  isLeftover?: boolean;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
    category: string;
  }[];
}

interface Leftover {
  recipeId: string;
  recipeName: string;
  servingsLeft: number;
  originalServings: number;
}

const Home = () => {
  const [plannedMeals, setPlannedMeals] = useState<{
    [key: string]: PlannedMeal;
  }>({});
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [draggedMealKey, setDraggedMealKey] = useState<string | null>(null);
  const [recipeToRemove, setRecipeToRemove] = useState<PlannedMeal | null>(
    null,
  );
  const [currentPlanId, setCurrentPlanId] = useState<string>();
  const [loadingPlan, setLoadingPlan] = useState(true);

  const handleDragStart = (e: React.DragEvent, meal: Meal) => {
    e.dataTransfer.setData(
      "meal",
      JSON.stringify({
        ...meal,
        isLeftover: false,
        ingredients: meal.ingredients || [],
      }),
    );
  };

  const handleLeftoverDragStart = (
    e: React.DragEvent,
    leftover: Leftover,
    index: number,
  ) => {
    e.dataTransfer.setData(
      "meal",
      JSON.stringify({
        id: leftover.recipeId,
        name: leftover.recipeName,
        servings: leftover.servingsLeft,
        isLeftover: true,
        originalServings: leftover.originalServings,
        ingredients: [], // Add empty ingredients array for leftovers
        leftoverIndex: index, // Add index to identify specific leftover instance
      }),
    );
  };

  const handleMealDrop = (day: string, mealTime: string, mealData: any) => {
    const targetCellKey = `${day}-${mealTime}`;
    const existingMeal = plannedMeals[targetCellKey];

    // Handle existing meal in the target cell if there is one
    if (existingMeal) {
      if (existingMeal.isLeftover) {
        // Add existing leftover back to leftovers section - always create a new leftover entry
        setLeftovers((prev) => [
          ...prev,
          {
            recipeId: existingMeal.recipeId,
            recipeName: existingMeal.name,
            servingsLeft: existingMeal.servings,
            originalServings: existingMeal.originalServings,
          },
        ]);
      } else {
        // Show confirmation dialog for fresh meal
        setRecipeToRemove(existingMeal);
        return; // Don't proceed with the drop until confirmed
      }
    }

    // If this meal is coming from another cell, remove it from the original cell
    if (mealData.fromCell) {
      setPlannedMeals((prev) => {
        const newMeals = { ...prev };
        delete newMeals[mealData.fromCell];
        return newMeals;
      });
    }

    // Use the current state preferences instead of async getPreferences
    const { householdSize } = preferences;

    // If it's a leftover being used
    if (mealData.isLeftover) {
      // Update leftovers
      setLeftovers((prev) => {
        // If we have a specific leftover index, use it to identify the exact leftover
        if (mealData.leftoverIndex !== undefined) {
          return prev
            .map((leftover, idx) =>
              idx === mealData.leftoverIndex
                ? {
                    ...leftover,
                    servingsLeft: leftover.servingsLeft - householdSize,
                  }
                : leftover,
            )
            .filter((leftover) => leftover.servingsLeft > 0);
        } else {
          // Fallback to previous behavior for backward compatibility
          return prev
            .map((leftover) =>
              leftover.recipeId === mealData.id
                ? {
                    ...leftover,
                    servingsLeft: leftover.servingsLeft - householdSize,
                  }
                : leftover,
            )
            .filter((leftover) => leftover.servingsLeft > 0);
        }
      });

      // Add to planned meals with available servings
      const availableServings = Math.min(mealData.servings, householdSize);
      setPlannedMeals((prev) => ({
        ...prev,
        [targetCellKey]: {
          name: mealData.name,
          servings: availableServings,
          requiredServings: householdSize,
          time: mealTime,
          originalServings: mealData.originalServings,
          recipeId: mealData.id,
          isLeftover: true, // Set isLeftover flag for leftover meals
        },
      }));
      return;
    }

    // If it's a new recipe being added
    const servingsNeeded = householdSize;
    const servingsAvailable = mealData.servings;
    const leftoverServings = servingsAvailable - servingsNeeded;

    // Add to planned meals
    setPlannedMeals((prev) => ({
      ...prev,
      [targetCellKey]: {
        name: mealData.name,
        servings: servingsNeeded,
        time: mealTime,
        originalServings: servingsAvailable,
        recipeId: mealData.id,
        ingredients: mealData.ingredients || [],
      },
    }));

    // If there are leftovers, add them to the leftovers list
    if (leftoverServings > 0) {
      setLeftovers((prev) => [
        ...prev,
        {
          recipeId: mealData.id,
          recipeName: mealData.name,
          servingsLeft: leftoverServings,
          originalServings: servingsAvailable,
        },
      ]);
    }
  };

  const [showPrefs, setShowPrefs] = useState(false);
  const [preferences, setPreferences] = useState(getPreferencesSync());
  const { user } = useAuth();

  useEffect(() => {
    // Setup drawer collapsed indicator visibility
    const setupDrawerIndicator = () => {
      const drawer = document.getElementById("recipe-drawer");
      const indicator = document.getElementById("collapsed-indicator");

      if (drawer && indicator) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === "class") {
              if (drawer.classList.contains("md:w-[50px]")) {
                indicator.classList.remove("md:hidden");
              } else {
                indicator.classList.add("md:hidden");
              }
            }
          });
        });

        observer.observe(drawer, { attributes: true });

        // Initial state
        if (drawer.classList.contains("md:w-[50px]")) {
          indicator.classList.remove("md:hidden");
        } else {
          indicator.classList.add("md:hidden");
        }
      }
    };

    // Call after component is mounted
    setTimeout(setupDrawerIndicator, 0);

    // Load preferences and current meal plan when component mounts
    const loadData = async () => {
      try {
        setLoadingPlan(true);
        // Load preferences
        const prefs = await getPreferences();
        setPreferences(prefs);
        console.log("Loaded preferences:", prefs);

        // Force update local storage with the latest preferences
        localStorage.setItem("meal-planner-preferences", JSON.stringify(prefs));

        // Load current meal plan
        const currentPlan = await getCurrentMealPlan();
        if (currentPlan) {
          setCurrentPlanId(currentPlan.id);
          setPlannedMeals(currentPlan.meals || {});
          setLeftovers(currentPlan.leftovers || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoadingPlan(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const handlePlanSelect = (plan: MealPlan) => {
    setCurrentPlanId(plan.id);
    setPlannedMeals(plan.meals || {});
    setLeftovers(plan.leftovers || []);
  };

  const handleSavePlan = async (name: string) => {
    try {
      // Clean up the data to ensure it's serializable
      const cleanPlannedMeals = {};

      // Process each meal to ensure it has all required properties
      Object.entries(plannedMeals).forEach(([key, meal]) => {
        cleanPlannedMeals[key] = {
          name: meal.name || "",
          servings: meal.servings || 0,
          time: meal.time || "",
          originalServings: meal.originalServings || 0,
          recipeId: meal.recipeId || "",
          isLeftover: !!meal.isLeftover,
          ingredients: (meal.ingredients || []).map((ing) => ({
            name: ing.name || "",
            amount: ing.amount || 0,
            unit: ing.unit || "",
            category: ing.category || "Other",
            notes: ing.notes || undefined,
          })),
        };
      });

      // Clean up leftovers data
      const cleanLeftovers = leftovers.map((leftover) => ({
        recipeId: leftover.recipeId || "",
        recipeName: leftover.recipeName || "",
        servingsLeft: leftover.servingsLeft || 0,
        originalServings: leftover.originalServings || 0,
      }));

      const planData = {
        name,
        weekStartDate: new Date().toISOString(),
        meals: cleanPlannedMeals,
        leftovers: cleanLeftovers,
      };

      if (currentPlanId) {
        // Update existing plan
        await updateMealPlan({
          ...planData,
          id: currentPlanId,
        });
      } else {
        // Create new plan
        const newPlan = await createMealPlan(planData);
        setCurrentPlanId(newPlan.id);
      }
    } catch (error) {
      console.error("Error saving meal plan:", error);
      throw error; // Re-throw to allow the WeeklyPlanSelector to show the error toast
    }
  };

  const handleCreateNewPlan = () => {
    setCurrentPlanId(undefined);
    setPlannedMeals({});
    setLeftovers([]);
  };

  const handleDeletePlan = async (planId: string) => {
    await deleteMealPlan(planId);
    if (planId === currentPlanId) {
      setCurrentPlanId(undefined);
      setPlannedMeals({});
      setLeftovers([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <PreferencesForm
        open={showPrefs}
        onOpenChange={setShowPrefs}
        onSubmit={async (prefs) => {
          await savePreferences(prefs);
          setPreferences(prefs);
          setShowPrefs(false);
        }}
        initialPreferences={preferences}
      />
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Meal Planning Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Drag and drop meals to plan your week
            </p>
          </div>
          <div className="flex items-center gap-2">
            <WeeklyPlanSelector
              onPlanSelect={handlePlanSelect}
              onSavePlan={handleSavePlan}
              currentPlanId={currentPlanId}
              onCreateNewPlan={handleCreateNewPlan}
              onDeletePlan={handleDeletePlan}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPrefs(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Top row with recipes drawer and calendar */}
      <div className="flex flex-col md:flex-row gap-4 w-full mb-6 relative">
        <div
          className="w-full md:w-[300px] flex-shrink-0 transition-all duration-300 ease-in-out relative"
          id="recipe-drawer"
        >
          <div
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-[9999]"
            style={{ pointerEvents: "auto" }}
          >
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full bg-white shadow-md border-gray-200 relative z-[9999]"
              onClick={() => {
                const drawer = document.getElementById("recipe-drawer");
                const toggleButton = document.getElementById(
                  "drawer-toggle-button",
                );
                if (drawer.classList.contains("md:w-[300px]")) {
                  drawer.classList.remove("md:w-[300px]");
                  drawer.classList.add("md:w-[50px]");
                  toggleButton.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><polyline points="9 18 15 12 9 6"></polyline></svg>';
                } else {
                  drawer.classList.remove("md:w-[50px]");
                  drawer.classList.add("md:w-[300px]");
                  toggleButton.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><polyline points="15 18 9 12 15 6"></polyline></svg>';
                }
              }}
              id="drawer-toggle-button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative h-full overflow-hidden">
            <div
              className="md:hidden md:absolute md:inset-0 md:flex md:flex-col md:items-center md:justify-start md:pt-4 md:bg-white md:z-30 transition-opacity duration-300 ease-in-out"
              id="collapsed-indicator"
            >
              <div className="hidden md:flex md:flex-col md:items-center md:gap-2 md:mt-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="text-purple-600"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                  <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
                  <rect width="7" height="7" x="8.5" y="8.5" rx="2"></rect>
                </svg>
                <span className="text-xs font-medium text-purple-600 rotate-90 whitespace-nowrap mt-2">
                  Recipes
                </span>
              </div>
            </div>
            <RecipeBrowser onDragStart={handleDragStart} />
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <WeeklyCalendarGrid
            meals={plannedMeals}
            leftovers={leftovers}
            onMealDrop={handleMealDrop}
            onLeftoverDragStart={(e, leftover, index) =>
              handleLeftoverDragStart(e, leftover, index)
            }
            onMealDragStart={(e, meal, cellKey) => {
              setDraggedMealKey(cellKey);
              e.dataTransfer.setData(
                "meal",
                JSON.stringify({ ...meal, fromCell: cellKey }),
              );
            }}
            onMealDragEnd={(e) => {
              if (
                !e.dataTransfer.dropEffect ||
                e.dataTransfer.dropEffect === "none"
              ) {
                // Meal was dropped outside valid drop zones
                const meal = plannedMeals[draggedMealKey];
                if (meal) {
                  if (meal.isLeftover) {
                    // Add back to leftovers - always create a new leftover entry
                    setLeftovers((prev) => [
                      ...prev,
                      {
                        recipeId: meal.recipeId,
                        recipeName: meal.name,
                        servingsLeft: meal.servings,
                        originalServings: meal.originalServings,
                      },
                    ]);
                    setPlannedMeals((prev) => {
                      const newMeals = { ...prev };
                      delete newMeals[draggedMealKey];
                      return newMeals;
                    });
                  } else {
                    // Show confirmation dialog before removing
                    setRecipeToRemove(meal);
                  }
                }
              }
              setDraggedMealKey(null);
            }}
            preferences={preferences}
            onMealRemove={(cellKey) => {
              const meal = plannedMeals[cellKey];
              if (meal) {
                if (meal.isLeftover) {
                  // Add back to leftovers - always create a new leftover entry
                  setLeftovers((prev) => [
                    ...prev,
                    {
                      recipeId: meal.recipeId,
                      recipeName: meal.name,
                      servingsLeft: meal.servings,
                      originalServings: meal.originalServings,
                    },
                  ]);
                } else {
                  setRecipeToRemove(meal);
                  return; // Don't remove the meal yet, wait for dialog confirmation
                }
                // Remove the meal from the grid
                setPlannedMeals((prev) => {
                  const newMeals = { ...prev };
                  delete newMeals[cellKey];
                  return newMeals;
                });
              }
            }}
          />
        </div>
      </div>

      {/* Bottom row with ingredients sidebar */}
      <div className="w-full">
        <IngredientsSidebar
          ingredients={
            Object.values(plannedMeals)
              .filter((meal) => !meal.isLeftover) // Only include non-leftover meals
              .flatMap((meal) => meal.ingredients) // Use original recipe quantities
          }
        />
      </div>

      <RemoveRecipeDialog
        open={!!recipeToRemove}
        onOpenChange={(open) => {
          if (!open) setRecipeToRemove(null);
        }}
        recipeName={recipeToRemove?.name || ""}
        onConfirm={() => {
          if (recipeToRemove) {
            const recipeId = recipeToRemove.recipeId;
            // Remove all instances of this recipe
            setPlannedMeals((prev) => {
              const newMeals = { ...prev };
              Object.entries(newMeals).forEach(([key, value]) => {
                if (value.recipeId === recipeId) {
                  delete newMeals[key];
                }
              });
              return newMeals;
            });
            // Also remove from leftovers
            setLeftovers((prev) =>
              prev.filter((leftover) => leftover.recipeId !== recipeId),
            );
            setRecipeToRemove(null);
          }
        }}
      />
    </div>
  );
};

export default Home;
