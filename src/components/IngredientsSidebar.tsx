import React from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: string;
}

interface IngredientsSidebarProps {
  ingredients?: Ingredient[];
}

const IngredientsSidebar = ({
  ingredients = [
    { name: "Chicken Breast", amount: 2, unit: "lbs", category: "Meat" },
    { name: "Rice", amount: 3, unit: "cups", category: "Grains" },
    { name: "Broccoli", amount: 4, unit: "cups", category: "Vegetables" },
    { name: "Olive Oil", amount: 0.25, unit: "cup", category: "Pantry" },
    { name: "Salt", amount: 2, unit: "tsp", category: "Pantry" },
    { name: "Black Pepper", amount: 1, unit: "tsp", category: "Pantry" },
  ],
}: IngredientsSidebarProps) => {
  // Group ingredients by category
  const groupedIngredients = ingredients.reduce(
    (acc, ingredient) => {
      if (!acc[ingredient.category]) {
        acc[ingredient.category] = [];
      }
      acc[ingredient.category].push(ingredient);
      return acc;
    },
    {} as Record<string, Ingredient[]>,
  );

  return (
    <Card className="w-[300px] h-[922px] bg-white p-4 flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Shopping List</h2>
        <p className="text-sm text-gray-500 mt-1">
          Ingredients needed for your meal plan
        </p>
      </div>

      <ScrollArea className="flex-1">
        {Object.entries(groupedIngredients).map(([category, items], index) => (
          <div key={category} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
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

            {items.map((ingredient, i) => (
              <div key={ingredient.name} className="py-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{ingredient.name}</span>
                  <span className="text-sm text-gray-600">
                    {ingredient.amount} {ingredient.unit}
                  </span>
                </div>
                {i < items.length - 1 && <Separator className="mt-2" />}
              </div>
            ))}

            {index < Object.entries(groupedIngredients).length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </ScrollArea>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">Total Items:</span>
          <span>{ingredients.length}</span>
        </div>
      </div>
    </Card>
  );
};

export default IngredientsSidebar;
