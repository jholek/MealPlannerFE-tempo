import React, { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { ListFilter, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: string;
  notes?: string;
  id?: string;
}

interface IngredientsSidebarProps {
  ingredients?: Ingredient[];
}

const IngredientsSidebar = ({ ingredients = [] }: IngredientsSidebarProps) => {
  const [open, setOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [completedOpen, setCompletedOpen] = useState(false);

  // Add unique IDs to ingredients if they don't have them
  const ingredientsWithIds = ingredients.map((ing) => ({
    ...ing,
    id:
      ing.id ||
      `${ing.name}-${ing.amount}-${ing.unit}`
        .replace(/\s+/g, "-")
        .toLowerCase(),
  }));

  // Group ingredients by category and filter out checked items
  const groupedIngredients = ingredientsWithIds.reduce(
    (acc, ingredient) => {
      // Skip checked items for the main list
      if (checkedItems[ingredient.id]) return acc;

      // Use the ingredient's category or default to "Other"
      const category = ingredient.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(ingredient);
      return acc;
    },
    {} as Record<string, Ingredient[]>,
  );

  // Get completed items
  const completedItems = ingredientsWithIds.filter(
    (ing) => checkedItems[ing.id],
  );

  // Group completed items by category
  const groupedCompletedItems = completedItems.reduce(
    (acc, ingredient) => {
      const category = ingredient.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(ingredient);
      return acc;
    },
    {} as Record<string, Ingredient[]>,
  );

  // Get top categories for preview
  const topCategories = Object.entries(groupedIngredients)
    .slice(0, 3)
    .map(([category, items]) => ({ category, count: items.length }));

  const handleCheckboxChange = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeselectAll = () => {
    // Create a new object with all items set to false
    const resetCheckedItems = Object.keys(checkedItems).reduce(
      (acc, id) => {
        acc[id] = false;
        return acc;
      },
      {} as Record<string, boolean>,
    );

    setCheckedItems(resetCheckedItems);
  };

  return (
    <>
      <Card className="w-full h-auto bg-white p-3 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-xl font-semibold">Shopping List</h2>
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-500">
                Ingredients needed for your meal plan
              </p>
              <Badge variant="outline" className="ml-1 text-xs py-0 px-2">
                Total: {ingredients.length} items
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 h-8 text-sm"
            size="sm"
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            View Full List
          </Button>
        </div>

        {/* Preview of ingredients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {topCategories.map(({ category, count }) => (
            <Card
              key={category}
              className="p-2 hover:shadow-md cursor-pointer"
              onClick={() => setOpen(true)}
            >
              <div className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 text-xs py-0"
                >
                  {category}
                </Badge>
                <span className="text-xs text-gray-500">{count} items</span>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {groupedIngredients[category].slice(0, 3).map((ingredient) => (
                  <div
                    key={ingredient.name}
                    className="flex justify-between py-0.5"
                  >
                    <span className="truncate mr-2">
                      {ingredient.name}
                      {ingredient.notes && (
                        <span className="text-xs text-gray-500 italic ml-1">
                          ({ingredient.notes})
                        </span>
                      )}
                    </span>
                    <span className="whitespace-nowrap">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </div>
                ))}
                {groupedIngredients[category].length > 3 && (
                  <div className="text-purple-600 text-xs text-right">
                    +{groupedIngredients[category].length - 3} more items
                  </div>
                )}
              </div>
            </Card>
          ))}
          {Object.keys(groupedIngredients).length > 3 && (
            <Card
              className="p-2 hover:shadow-md cursor-pointer flex items-center justify-center"
              onClick={() => setOpen(true)}
            >
              <div className="text-center text-purple-600">
                <ListFilter className="w-4 h-4 mx-auto" />
                <span className="text-xs">
                  View {Object.keys(groupedIngredients).length - 3} more
                  categories
                </span>
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* Full ingredients modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-4">
          <DialogHeader className="p-0 mb-2">
            <div className="flex items-center justify-between">
              <DialogTitle>Shopping List</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Total: {ingredientsWithIds.length} items
                </Badge>
                <Badge variant="outline" className="text-xs bg-green-50">
                  Completed: {completedItems.length} items
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-2 max-h-[calc(90vh-80px)]">
            <div className="space-y-6">
              {/* Active shopping list items */}
              {Object.entries(groupedIngredients).map(
                ([category, items], index) => (
                  <div key={category}>
                    <div className="flex items-center gap-1 mb-2">
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

                    <div className="border rounded-md">
                      {items.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className="py-2 px-3 border-b last:border-b-0"
                        >
                          <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => handleCheckboxChange(ingredient.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={ingredient.id}
                                checked={checkedItems[ingredient.id]}
                                onCheckedChange={() =>
                                  handleCheckboxChange(ingredient.id)
                                }
                              />
                              <span className="font-medium">
                                {ingredient.name}
                                {ingredient.notes && (
                                  <span className="font-normal text-sm text-gray-500 ml-2">
                                    ({ingredient.notes})
                                  </span>
                                )}
                              </span>
                            </div>
                            <span className="text-gray-600">
                              {ingredient.amount} {ingredient.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}

              {/* Completed items section */}
              {completedItems.length > 0 && (
                <Collapsible
                  open={completedOpen}
                  onOpenChange={setCompletedOpen}
                  className="mt-8"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        Completed Items
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {completedItems.length} items
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleDeselectAll}
                      >
                        Deselect All
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-7 w-7"
                        >
                          {completedOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  <CollapsibleContent>
                    {Object.entries(groupedCompletedItems).map(
                      ([category, items]) => (
                        <div key={`completed-${category}`} className="mb-4">
                          <div className="flex items-center gap-1 mb-2">
                            <Badge variant="outline" className="text-gray-500">
                              {category}
                            </Badge>
                          </div>
                          <div className="border border-gray-200 rounded-md">
                            {items.map((ingredient) => (
                              <div
                                key={ingredient.id}
                                className="py-2 px-3 border-b last:border-b-0 bg-gray-50"
                              >
                                <div
                                  className="flex justify-between items-center cursor-pointer"
                                  onClick={() =>
                                    handleCheckboxChange(ingredient.id)
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={ingredient.id}
                                      checked={checkedItems[ingredient.id]}
                                      onCheckedChange={() =>
                                        handleCheckboxChange(ingredient.id)
                                      }
                                    />
                                    <span className="font-medium line-through text-gray-500">
                                      {ingredient.name}
                                      {ingredient.notes && (
                                        <span className="font-normal text-sm text-gray-400 ml-2 line-through">
                                          ({ingredient.notes})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-gray-400 line-through">
                                    {ingredient.amount} {ingredient.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IngredientsSidebar;
