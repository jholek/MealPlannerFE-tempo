import React, { useState } from "react";
import RecipeBrowser from "./recipes/RecipeBrowser";
import WeeklyCalendarGrid from "./WeeklyCalendarGrid";
import IngredientsSidebar from "./IngredientsSidebar";

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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Meal Planning Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Drag and drop meals to plan your week
        </p>
      </div>

      <div className="flex gap-6 justify-center items-start">
        <RecipeBrowser onDragStart={handleDragStart} />
        <WeeklyCalendarGrid meals={plannedMeals} onMealDrop={handleMealDrop} />
        <IngredientsSidebar />
      </div>
    </div>
  );
};

export default Home;
