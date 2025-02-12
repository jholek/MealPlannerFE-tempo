import React from "react";
import MealCell from "./MealCell";
import { Card } from "./ui/card";

interface WeeklyCalendarGridProps {
  meals?: {
    [key: string]: {
      name: string;
      servings: number;
      time: string;
    };
  };
  onMealDrop?: (day: string, mealTime: string, meal: any) => void;
}

const WeeklyCalendarGrid = ({
  meals = {},
  onMealDrop = () => {},
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
  const mealTimes = ["Breakfast", "Lunch", "Dinner"];

  const handleDrop =
    (day: string, mealTime: string) => (e: React.DragEvent) => {
      e.preventDefault();
      const mealData = JSON.parse(e.dataTransfer.getData("meal"));
      onMealDrop(day, mealTime, mealData);
    };

  return (
    <Card className="p-6 bg-white w-[812px] h-[922px] overflow-auto">
      <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-4">
        {/* Header row */}
        <div className="text-center font-medium text-purple-600"></div>
        {days.map((day) => (
          <div key={day} className="text-center font-medium text-gray-700">
            {day}
          </div>
        ))}

        {/* Meal time rows */}
        {mealTimes.map((mealTime) => (
          <React.Fragment key={mealTime}>
            <div className="text-center font-medium text-purple-600 flex items-center justify-center">
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
                  />
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
};

export default WeeklyCalendarGrid;
