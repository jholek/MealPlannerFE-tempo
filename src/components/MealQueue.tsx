import React from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Clock, Users } from "lucide-react";

interface MealCardProps {
  id: string;
  name: string;
  servings: number;
  time: string;
}

interface MealQueueProps {
  meals?: MealCardProps[];
  onDragStart?: (e: React.DragEvent, meal: MealCardProps) => void;
}

const MealQueue = ({
  meals = [
    { id: "1", name: "Spaghetti Bolognese", servings: 4, time: "dinner" },
    { id: "2", name: "Chicken Salad", servings: 2, time: "lunch" },
    { id: "3", name: "Pancakes", servings: 3, time: "breakfast" },
  ],
  onDragStart = () => {},
}: MealQueueProps) => {
  return (
    <div className="w-[300px] h-full bg-gray-50 p-4 border-r">
      <h2 className="text-xl font-semibold mb-4">Meal Queue</h2>
      <Separator className="mb-4" />

      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="space-y-4">
          {meals.map((meal) => (
            <Card
              key={meal.id}
              className="p-4 cursor-move bg-white hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => onDragStart(e, meal)}
            >
              <h3 className="font-medium mb-2">{meal.name}</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{meal.servings}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="capitalize">{meal.time}</span>
                </div>
              </div>
              <div className="mt-2">
                <Badge
                  variant="secondary"
                  className={`
                    ${meal.time === "breakfast" ? "bg-blue-100 text-blue-800" : ""}
                    ${meal.time === "lunch" ? "bg-green-100 text-green-800" : ""}
                    ${meal.time === "dinner" ? "bg-purple-100 text-purple-800" : ""}
                  `}
                >
                  {meal.time}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MealQueue;
