import React from "react";
import MealCell from "./MealCell";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import LeftoverCard from "./LeftoverCard";

interface WeeklyCalendarGridProps {
  meals?: {
    [key: string]: {
      name: string;
      servings: number;
      time: string;
      originalServings: number;
      recipeId: string;
      isLeftover?: boolean;
    };
  };
  leftovers?: {
    recipeId: string;
    recipeName: string;
    servingsLeft: number;
    originalServings: number;
  }[];
  onMealDrop?: (day: string, mealTime: string, meal: any) => void;
  onLeftoverDragStart?: (e: React.DragEvent, leftover: any) => void;
  onMealDragStart?: (e: React.DragEvent, meal: any, cellKey: string) => void;
  onMealDragEnd?: (e: React.DragEvent) => void;
  preferences?: {
    mealTypes: string[];
  };
}

const WeeklyCalendarGrid = ({
  meals = {},
  leftovers = [],
  onMealDrop = () => {},
  onLeftoverDragStart = () => {},
  onMealDragStart = () => {},
  onMealDragEnd = () => {},
  preferences = { mealTypes: ["breakfast", "lunch", "dinner"] },
}: WeeklyCalendarGridProps) => {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const mealTimes = preferences.mealTypes.map(
    (type) => type.charAt(0).toUpperCase() + type.slice(1),
  );

  const handleDrop =
    (day: string, mealTime: string) => (e: React.DragEvent) => {
      e.preventDefault();
      const mealData = JSON.parse(e.dataTransfer.getData("meal"));
      onMealDrop(day, mealTime, mealData);
    };

  return (
    <Card className="p-6 bg-white w-[812px] h-[922px] overflow-hidden flex flex-col">
      {/* Calendar Grid */}
      <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-4 overflow-y-auto flex-1">
        {/* Header row */}
        <div className="text-center font-medium text-purple-600 sticky top-0 bg-white z-10"></div>
        {days.map((day) => (
          <div
            key={day}
            className="text-center font-medium text-gray-700 sticky top-0 bg-white z-10"
          >
            {day}
          </div>
        ))}

        {/* Meal time rows */}
        {mealTimes.map((mealTime) => (
          <React.Fragment key={mealTime}>
            <div className="text-center font-medium text-purple-600 flex items-center justify-center sticky left-0 bg-white">
              {mealTime}
            </div>
            {days.map((day) => {
              const mealKey = `${day}-${mealTime}`;
              const meal = meals[mealKey];
              return (
                <div key={`${day}-${mealTime}`} className="flex justify-center">
                  <MealCell
                    meal={meal}
                    isEmpty={!meal}
                    onDrop={handleDrop(day, mealTime)}
                    onDragStart={(e) => onMealDragStart(e, meal, mealKey)}
                    onDragEnd={onMealDragEnd}
                  />
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Leftovers Section */}
      {leftovers.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-orange-700">
                Available Leftovers
              </h3>
              <span className="text-sm text-gray-500">
                {leftovers.length} items
              </span>
            </div>
          </div>
          <ScrollArea className="h-[100px]">
            <div className="grid grid-cols-4 gap-2 pb-2">
              {leftovers.map((leftover) => (
                <LeftoverCard
                  key={`${leftover.recipeId}-${leftover.servingsLeft}`}
                  recipeName={leftover.recipeName}
                  servingsLeft={leftover.servingsLeft}
                  onDragStart={(e) => onLeftoverDragStart(e, leftover)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
};

export default WeeklyCalendarGrid;
