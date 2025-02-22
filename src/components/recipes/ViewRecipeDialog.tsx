import { useState } from "react";
import { Recipe } from "@/types";
import { EditableIngredientRow } from "./EditableIngredientRow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { PlusCircle, Pencil, Save } from "lucide-react";
import { useToast } from "../ui/use-toast";

interface ViewRecipeDialogProps {
  recipe: Recipe;
  onRecipeUpdate: (recipe: Recipe) => void;
  trigger?: React.ReactNode;
}

export default function ViewRecipeDialog({
  recipe: initialRecipe,
  onRecipeUpdate,
  trigger,
}: ViewRecipeDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const { toast } = useToast();

  const handleSave = () => {
    onRecipeUpdate({
      ...recipe,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
    toast({
      title: "Recipe updated",
      description: "Your changes have been saved.",
    });
  };

  const updateIngredient = (
    index: number,
    updated: {
      quantity: number;
      unit: string;
      item: string;
      notes?: string;
    },
  ) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index] = {
      name: updated.item,
      amount: updated.quantity,
      unit: updated.unit,
      category: "Uncategorized",
    };
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const deleteIngredient = (index: number) => {
    setRecipe({
      ...recipe,
      ingredients: recipe.ingredients.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button variant="ghost">View Recipe</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl w-screen h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>View Recipe</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              "Cancel Editing"
            ) : (
              <>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Recipe
              </>
            )}
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="pb-16 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Recipe Name</Label>
                <Input
                  id="name"
                  value={recipe.name}
                  onChange={(e) =>
                    setRecipe({ ...recipe, name: e.target.value })
                  }
                  className="mt-2"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="url">Recipe URL</Label>
                <Input
                  id="url"
                  value={recipe.url}
                  onChange={(e) =>
                    setRecipe({ ...recipe, url: e.target.value })
                  }
                  placeholder="Original recipe URL"
                  className="mt-2"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  min={1}
                  value={recipe.servings}
                  onChange={(e) =>
                    setRecipe({ ...recipe, servings: Number(e.target.value) })
                  }
                  className="mt-2"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="prepTime">Prep (mins)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  min={0}
                  value={recipe.prepTime}
                  onChange={(e) =>
                    setRecipe({ ...recipe, prepTime: Number(e.target.value) })
                  }
                  className="mt-2"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="cookTime">Cook (mins)</Label>
                <Input
                  id="cookTime"
                  type="number"
                  min={0}
                  value={recipe.cookTime}
                  onChange={(e) =>
                    setRecipe({ ...recipe, cookTime: Number(e.target.value) })
                  }
                  className="mt-2"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label>Macronutrients (per serving)</Label>
              <div className="grid grid-cols-4 gap-4 mt-2">
                <div>
                  <Input
                    type="number"
                    min={0}
                    value={recipe.nutritionalInfo.calories}
                    onChange={(e) =>
                      setRecipe({
                        ...recipe,
                        nutritionalInfo: {
                          ...recipe.nutritionalInfo,
                          calories: Number(e.target.value),
                        },
                      })
                    }
                    className="text-sm"
                    disabled={!isEditing}
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Calories
                  </span>
                </div>
                <div>
                  <Input
                    type="number"
                    min={0}
                    value={recipe.nutritionalInfo.protein}
                    onChange={(e) =>
                      setRecipe({
                        ...recipe,
                        nutritionalInfo: {
                          ...recipe.nutritionalInfo,
                          protein: Number(e.target.value),
                        },
                      })
                    }
                    className="text-sm"
                    disabled={!isEditing}
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Protein (g)
                  </span>
                </div>
                <div>
                  <Input
                    type="number"
                    min={0}
                    value={recipe.nutritionalInfo.carbs}
                    onChange={(e) =>
                      setRecipe({
                        ...recipe,
                        nutritionalInfo: {
                          ...recipe.nutritionalInfo,
                          carbs: Number(e.target.value),
                        },
                      })
                    }
                    className="text-sm"
                    disabled={!isEditing}
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Carbs (g)
                  </span>
                </div>
                <div>
                  <Input
                    type="number"
                    min={0}
                    value={recipe.nutritionalInfo.fat}
                    onChange={(e) =>
                      setRecipe({
                        ...recipe,
                        nutritionalInfo: {
                          ...recipe.nutritionalInfo,
                          fat: Number(e.target.value),
                        },
                      })
                    }
                    className="text-sm"
                    disabled={!isEditing}
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Fat (g)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Ingredients</Label>
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRecipe({
                        ...recipe,
                        ingredients: [
                          ...recipe.ingredients,
                          {
                            name: "",
                            amount: 0,
                            unit: "",
                            category: "Uncategorized",
                          },
                        ],
                      })
                    }
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                )}
              </div>
              <div className="border rounded-md">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b sticky top-0">
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-slate-500">
                        Amount
                      </th>
                      <th className="p-2 text-left text-sm font-medium text-slate-500">
                        Unit
                      </th>
                      <th className="p-2 text-left text-sm font-medium text-slate-500">
                        Ingredient
                      </th>
                      <th className="p-2 text-left text-sm font-medium text-slate-500">
                        Notes
                      </th>
                      {isEditing && <th className="p-2 w-10"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.ingredients.map((ing, idx) => (
                      <EditableIngredientRow
                        key={idx}
                        quantity={ing.amount}
                        unit={ing.unit}
                        item={ing.name}
                        notes=""
                        onUpdate={(updated) => updateIngredient(idx, updated)}
                        onDelete={() => deleteIngredient(idx)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="border-t bg-white p-4 mt-auto">
            <Button
              onClick={handleSave}
              className="w-full bg-slate-600 hover:bg-slate-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
