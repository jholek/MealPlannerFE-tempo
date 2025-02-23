import React from "react";
import { Card } from "./ui/card";
import { PlusCircle, Utensils, UtensilsCrossed, X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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
    requiredServings?: number;
    time: string;
    originalServings?: number;
    recipeId?: string;
    isLeftover?: boolean;
  };
  onDrop?: (e: React.DragEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isEmpty?: boolean;
  onRemove?: () => void;
}

const MealCell = ({
  meal = null,
  onDrop = () => {},
  onDragStart = () => {},
  onDragEnd = () => {},
  isEmpty = true,
  onRemove,
}: MealCellProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Check if this is explicitly marked as a leftover
  const isLeftover = meal?.isLeftover === true;
  const isPartialServing = meal?.servings < meal?.requiredServings;

  return (
    <Card
      className={`w-[116px] h-[120px] bg-white border relative
        ${
          isEmpty
            ? "border-2 border-dashed border-gray-300"
            : isPartialServing
              ? "border border-red-400"
              : isLeftover
                ? "border border-orange-200"
                : "border border-green-200"
        } 
        flex items-center justify-center transition-all hover:border-opacity-80 cursor-pointer`}
      onDragOver={handleDragOver}
      onDrop={onDrop}
      draggable={!isEmpty}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
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
          {/* Status badge in top-left corner */}
          <div className="absolute -top-2 -left-2">
            <Badge
              variant="secondary"
              className={`${
                isPartialServing
                  ? "bg-red-500"
                  : isLeftover
                    ? "bg-orange-500"
                    : "bg-green-500"
              } 
                text-white shadow-sm`}
            >
              {isLeftover ? "Leftover" : "Fresh"}
            </Badge>
          </div>

          {/* Icon in top-right corner */}
          <div className="absolute top-1 right-1 flex items-center gap-1">
            {isLeftover ? (
              <UtensilsCrossed
                className={`w-4 h-4 ${isPartialServing ? "text-red-500" : "text-orange-500"}`}
              />
            ) : (
              <Utensils className="w-4 h-4 text-green-500" />
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0.5 hover:bg-red-100 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <h4 className="font-medium text-sm mb-1 mt-2">{meal?.name}</h4>
          <p className="text-xs text-gray-600 mb-1">{meal?.time}</p>
          <Badge
            variant="secondary"
            className={`${
              isPartialServing
                ? "bg-red-100 text-red-700"
                : isLeftover
                  ? "bg-orange-100 text-orange-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            {meal?.servings}
            {meal?.requiredServings ? `/${meal.requiredServings}` : ""} servings
          </Badge>
        </div>
      )}
    </Card>
  );
};

export default MealCell;
