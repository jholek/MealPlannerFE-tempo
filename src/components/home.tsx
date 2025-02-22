import React, { useState } from "react";
import RecipeBrowser from "./recipes/RecipeBrowser";
import WeeklyCalendarGrid from "./WeeklyCalendarGrid";
import IngredientsSidebar from "./IngredientsSidebar";
import PreferencesForm from "./setup/PreferencesForm";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import { getPreferences, savePreferences } from "@/lib/preferences";

interface Meal {
  id: string;
  name: string;
  servings: number;
  time: string;
}

const Home = () => {
  const [plannedMeals, setPlannedMeals] = useState<{
    [key: string]: {
      name: string;
      servings: number;
      time: string;
    };
  }>({});

  const handleDragStart = (e: React.DragEvent, meal: Meal) => {
    e.dataTransfer.setData("meal", JSON.stringify(meal));
  };

  const handleMealDrop = (day: string, mealTime: string, meal: Meal) => {
    setPlannedMeals((prev) => ({
      ...prev,
      [`${day}-${mealTime}`]: {
        name: meal.name,
        servings: meal.servings,
        time: meal.time,
      },
    }));
  };

  const [showPrefs, setShowPrefs] = useState(false);
  const [preferences, setPreferences] = useState(getPreferences());

  return (
    <div className="min-h-screen bg-gray-100 p-8">
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
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
        <p className="text-gray-600 mt-2">
          Drag and drop meals to plan your week
        </p>
      </div>

      <div className="flex gap-6 justify-center items-start">
        <RecipeBrowser onDragStart={handleDragStart} />
        <WeeklyCalendarGrid
          meals={plannedMeals}
          onMealDrop={handleMealDrop}
          preferences={preferences}
        />
        <IngredientsSidebar />
      </div>
    </div>
  );
};

export default Home;
