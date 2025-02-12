import React from "react";
import { Card } from "./ui/card";
import { PlusCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface MealCellProps {
  meal?: {
    name: string;
    servings: number;
    time: string;
  };
  onDrop?: (e: React.DragEvent) => void;
  isEmpty?: boolean;
}

const MealCell = ({
  meal = null,
  onDrop = () => {},
  isEmpty = true,
}: MealCellProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card
      className={`w-[116px] h-[120px] bg-white border-2 ${isEmpty ? "border-dashed border-gray-300" : "border-solid border-green-500"} 
        flex items-center justify-center transition-all hover:border-green-400 cursor-pointer`}
      onDragOver={handleDragOver}
      onDrop={onDrop}
    >
      {isEmpty ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <PlusCircle className="w-8 h-8 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Drag a meal here</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className="p-2 text-center">
          <h4 className="font-medium text-sm mb-1">{meal?.name}</h4>
          <p className="text-xs text-gray-600 mb-1">{meal?.time}</p>
          <p className="text-xs text-gray-500">{meal?.servings} servings</p>
        </div>
      )}
    </Card>
  );
};

export default MealCell;
