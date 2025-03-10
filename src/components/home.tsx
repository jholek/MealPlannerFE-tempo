import React, { useState, useCallback } from "react";
import RemoveRecipeDialog from "./recipes/RemoveRecipeDialog";
import RecipeBrowser from "./recipes/RecipeBrowser";
import WeeklyCalendarGrid from "./WeeklyCalendarGrid";
import IngredientsSidebar from "./IngredientsSidebar";
import PreferencesForm from "./setup/PreferencesForm";
import LeftoverCard from "./LeftoverCard";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import { getPreferences, savePreferences } from "@/lib/preferences";
import { ScrollArea } from "./ui/scroll-area";

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

  const handleLeftoverDragStart = (e: React.DragEvent, leftover: Leftover) => {
    e.dataTransfer.setData(
      "meal",
      JSON.stringify({
        id: leftover.recipeId,
        name: leftover.recipeName,
        servings: leftover.servingsLeft,
        isLeftover: true,
        originalServings: leftover.originalServings,
        ingredients: [], // Add empty ingredients array for leftovers
      }),
    );
  };

  const handleMealDrop = (day: string, mealTime: string, mealData: any) => {
    const targetCellKey = `${day}-${mealTime}`;
    const existingMeal = plannedMeals[targetCellKey];

    // Handle existing meal in the target cell if there is one
    if (existingMeal) {
      if (existingMeal.isLeftover) {
        // Add existing leftover back to leftovers section
        setLeftovers((prev) => {
          const existingLeftover = prev.find(
            (l) => l.recipeId === existingMeal.recipeId,
          );
          if (existingLeftover) {
            return prev.map((l) =>
              l.recipeId === existingMeal.recipeId
                ? { ...l, servingsLeft: l.servingsLeft + existingMeal.servings }
                : l,
            );
          } else {
            return [
              ...prev,
              {
                recipeId: existingMeal.recipeId,
                recipeName: existingMeal.name,
                servingsLeft: existingMeal.servings,
                originalServings: existingMeal.originalServings,
              },
            ];
          }
        });
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

    const preferences = getPreferences();
    const { householdSize } = preferences;

    // If it's a leftover being used
    if (mealData.isLeftover) {
      // Update leftovers
      setLeftovers((prev) =>
        prev
          .map((leftover) =>
            leftover.recipeId === mealData.id
              ? {
                  ...leftover,
                  servingsLeft: leftover.servingsLeft - householdSize,
                }
              : leftover,
          )
          .filter((leftover) => leftover.servingsLeft > 0),
      );

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
  const [preferences, setPreferences] = useState(getPreferences());

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <PreferencesForm
        open={showPrefs}
        onOpenChange={setShowPrefs}
        onSubmit={(prefs) => {
          savePreferences(prefs);
          setPreferences(prefs);
          setShowPrefs(false);
        }}
        initialPreferences={getPreferences()}
      />
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Meal Planning Dashboard
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPrefs(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-gray-600 mt-2 text-sm md:text-base">
          Drag and drop meals to plan your week
        </p>
      </div>

      {/* Top row with recipes and calendar */}
      <div className="flex flex-col md:flex-row gap-4 w-full mb-6">
        <div className="w-full md:w-[300px] flex-shrink-0">
          <RecipeBrowser onDragStart={handleDragStart} />
        </div>
        <div className="w-full overflow-x-auto">
          <WeeklyCalendarGrid
            meals={plannedMeals}
            leftovers={leftovers}
            onMealDrop={handleMealDrop}
            onLeftoverDragStart={handleLeftoverDragStart}
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
                    // Add back to leftovers and remove from cell
                    setLeftovers((prev) => {
                      const existingLeftover = prev.find(
                        (l) => l.recipeId === meal.recipeId,
                      );
                      if (existingLeftover) {
                        // Add servings to existing leftover card
                        return prev.map((l) =>
                          l.recipeId === meal.recipeId
                            ? {
                                ...l,
                                servingsLeft: l.servingsLeft + meal.servings,
                              }
                            : l,
                        );
                      } else {
                        // Create new leftover card
                        return [
                          ...prev,
                          {
                            recipeId: meal.recipeId,
                            recipeName: meal.name,
                            servingsLeft: meal.servings,
                            originalServings: meal.originalServings,
                          },
                        ];
                      }
                    });
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
                  // Add back to leftovers
                  setLeftovers((prev) => {
                    const existingLeftover = prev.find(
                      (l) => l.recipeId === meal.recipeId,
                    );
                    if (existingLeftover) {
                      return prev.map((l) =>
                        l.recipeId === meal.recipeId
                          ? {
                              ...l,
                              servingsLeft: l.servingsLeft + meal.servings,
                            }
                          : l,
                      );
                    } else {
                      return [
                        ...prev,
                        {
                          recipeId: meal.recipeId,
                          recipeName: meal.name,
                          servingsLeft: meal.servings,
                          originalServings: meal.originalServings,
                        },
                      ];
                    }
                  });
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
