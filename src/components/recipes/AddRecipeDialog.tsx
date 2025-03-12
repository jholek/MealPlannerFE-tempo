import { useState, useEffect } from "react";
import { Recipe } from "@/types";
import { EditableIngredientRow } from "./EditableIngredientRow";
import { createRecipe } from "@/lib/supabase/recipes";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  PlusCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "../ui/use-toast";
import { Textarea } from "../ui/textarea";
import {
  parseIngredientsFromText,
  parseIngredientsFromImage,
} from "@/lib/recipeParser";
import { parseIngredientsWithRules } from "@/lib/ruleBasedParser";
import { parseIngredientsWithGemini } from "@/lib/geminiParser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import ParserDebugDialog from "./ParserDebugDialog";

interface AddRecipeDialogProps {
  onRecipeAdd: (recipe: Recipe) => void;
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ParsedIngredient {
  quantity: number;
  unit: string;
  item: string;
  notes?: string;
  category?: string;
}

export default function AddRecipeDialog({
  onRecipeAdd,
  initialOpen = false,
  onOpenChange = () => {},
}: AddRecipeDialogProps) {
  const [open, setOpen] = useState(initialOpen);

  // Effect to sync with external state
  useEffect(() => {
    setOpen(initialOpen);
  }, [initialOpen]);

  // Custom setter that also calls the external handler
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange(newOpen);

    // Update URL directly when opening the add recipe dialog
    if (newOpen) {
      window.history.pushState({}, "", "/add-recipe");
    } else if (window.location.pathname === "/add-recipe") {
      window.history.pushState({}, "", "/");
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");
  const [parsedIngredients, setParsedIngredients] =
    useState<ParsedIngredient[]>();
  const [recipeName, setRecipeName] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState(0);
  const [cookTime, setCookTime] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [calories, setCalories] = useState(0);
  const [showIngredientInput, setShowIngredientInput] = useState(true);
  const [parserType, setParserType] = useState<"llm" | "rules" | "gemini">(
    "gemini",
  );
  const { toast } = useToast();

  const handleTextImport = async () => {
    if (!ingredientsText) return;

    setIsLoading(true);
    try {
      let ingredients;
      if (parserType === "llm") {
        ingredients = await parseIngredientsFromText(ingredientsText);
      } else if (parserType === "gemini") {
        ingredients = await parseIngredientsWithGemini(ingredientsText);
      } else {
        ingredients = parseIngredientsWithRules(ingredientsText);
      }
      setParsedIngredients(ingredients);
      setShowIngredientInput(false);
      toast({
        title: "Ingredients parsed",
        description: "Review the ingredients and add recipe details.",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to parse ingredients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const ingredients = await parseIngredientsFromImage(file);
      setParsedIngredients(ingredients);
      setShowIngredientInput(false);
      toast({
        title: "Image processed",
        description: "Review the extracted ingredients and add recipe details.",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRecipe = async () => {
    if (!parsedIngredients || !recipeName) return;

    const newRecipe: Omit<Recipe, "id" | "createdAt" | "updatedAt" | "userId"> =
      {
        name: recipeName,
        description: "",
        servings,
        prepTime,
        cookTime,
        url: recipeUrl,
        ingredients: parsedIngredients.map((ing) => ({
          name: ing.item,
          amount: ing.quantity,
          unit: ing.unit,
          category: ing.category || "Other",
          notes: ing.notes,
        })),
        instructions: [],
        nutritionalInfo: {
          calories: calories || protein * 4 + carbs * 4 + fat * 9,
          protein: protein / servings,
          carbs: carbs / servings,
          fat: fat / servings,
        },
        tags: [],
      };

    try {
      const savedRecipe = await createRecipe(newRecipe);
      toast({
        title: "Success",
        description: "Recipe has been created",
      });
      setOpen(false);
      // Update the list after dialog is closed
      onRecipeAdd(savedRecipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to create recipe. Please try again.",
        variant: "destructive",
      });
      return;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        handleOpenChange(isOpen);
        if (!open) {
          // Reset form state when dialog is closed
          setIngredientsText("");
          setParsedIngredients(undefined);
          setRecipeName("");
          setRecipeUrl("");
          setServings(4);
          setPrepTime(0);
          setCookTime(0);
          setProtein(0);
          setCarbs(0);
          setFat(0);
          setCalories(0);
          setShowIngredientInput(true);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-screen h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="text"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              From Text
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              From Image
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-1">
            <TabsContent value="text" className="pb-16">
              {showIngredientInput && (
                <div className="space-y-4 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="ingredients">Ingredients List</Label>
                      <div className="flex items-center gap-2">
                        <ParserDebugDialog />
                        <Select
                          value={parserType}
                          onValueChange={(value: "llm" | "rules" | "gemini") =>
                            setParserType(value)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select parser type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rules">
                              Rule-based Parser
                            </SelectItem>
                            <SelectItem value="llm">GPT-4</SelectItem>
                            <SelectItem value="gemini">Gemini 1.5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea
                      id="ingredients"
                      placeholder="Paste ingredients list here..."
                      value={ingredientsText}
                      onChange={(e) => setIngredientsText(e.target.value)}
                      className="h-[120px] mt-2 font-mono resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleTextImport}
                    disabled={isLoading}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Parse Ingredients"
                    )}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="name">Recipe Name</Label>
                  <Input
                    id="name"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="Enter recipe name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="url">Recipe URL</Label>
                  <Input
                    id="url"
                    value={recipeUrl}
                    onChange={(e) => setRecipeUrl(e.target.value)}
                    placeholder="Original recipe URL"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    min={1}
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="prepTime">Prep (mins)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    min={0}
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="cookTime">Cook (mins)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    min={0}
                    value={cookTime}
                    onChange={(e) => setCookTime(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="mb-6">
                <Label>Macronutrients (per serving)</Label>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  <div>
                    <Input
                      type="number"
                      min={0}
                      value={calories}
                      onChange={(e) => setCalories(Number(e.target.value))}
                      placeholder="Calories"
                      className="text-sm"
                    />
                    <span className="text-xs text-slate-500 mt-1 block">
                      Calories
                    </span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min={0}
                      value={protein}
                      onChange={(e) => setProtein(Number(e.target.value))}
                      placeholder="Protein"
                      className="text-sm"
                    />
                    <span className="text-xs text-slate-500 mt-1 block">
                      Protein (g)
                    </span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min={0}
                      value={carbs}
                      onChange={(e) => setCarbs(Number(e.target.value))}
                      placeholder="Carbs"
                      className="text-sm"
                    />
                    <span className="text-xs text-slate-500 mt-1 block">
                      Carbs (g)
                    </span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min={0}
                      value={fat}
                      onChange={(e) => setFat(Number(e.target.value))}
                      placeholder="Fat"
                      className="text-sm"
                    />
                    <span className="text-xs text-slate-500 mt-1 block">
                      Fat (g)
                    </span>
                  </div>
                </div>
              </div>

              {parsedIngredients && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Parsed Ingredients</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setParsedIngredients([
                          ...parsedIngredients,
                          {
                            quantity: 0,
                            unit: "",
                            item: "",
                            notes: "",
                            category: "Other",
                          },
                        ])
                      }
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Row
                    </Button>
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
                          <th className="p-2 text-left text-sm font-medium text-slate-500 min-w-[180px]">
                            Category
                          </th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedIngredients.map((ing, idx) => (
                          <EditableIngredientRow
                            key={idx}
                            {...ing}
                            onUpdate={(updated) => {
                              const newIngredients = [...parsedIngredients];
                              newIngredients[idx] = updated;
                              setParsedIngredients(newIngredients);
                            }}
                            onDelete={() => {
                              setParsedIngredients(
                                parsedIngredients.filter((_, i) => i !== idx),
                              );
                            }}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="image">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image">Upload Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageImport}
                    disabled={isLoading}
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="border-t bg-white p-4 mt-auto">
          <Button
            onClick={handleCreateRecipe}
            disabled={!recipeName || !parsedIngredients}
            className="w-full bg-slate-600 hover:bg-slate-700"
          >
            Create Recipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
