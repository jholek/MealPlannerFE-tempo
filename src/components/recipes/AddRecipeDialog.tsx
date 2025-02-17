import { useState } from "react";
import { Recipe } from "@/types";
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
import { ScrollArea } from "../ui/scroll-area";
import {
  parseIngredientsFromText,
  parseIngredientsFromImage,
} from "@/lib/recipeParser";

interface AddRecipeDialogProps {
  onRecipeAdd: (recipe: Recipe) => void;
}

interface ParsedIngredient {
  quantity: number;
  unit: string;
  item: string;
  notes?: string;
}

export default function AddRecipeDialog({ onRecipeAdd }: AddRecipeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");
  const [parsedIngredients, setParsedIngredients] =
    useState<ParsedIngredient[]>();
  const [recipeName, setRecipeName] = useState("");
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState(0);
  const [cookTime, setCookTime] = useState(0);
  const { toast } = useToast();

  const handleTextImport = async () => {
    if (!ingredientsText) return;

    setIsLoading(true);
    try {
      const ingredients = await parseIngredientsFromText(ingredientsText);
      setParsedIngredients(ingredients);
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

  const handleCreateRecipe = () => {
    if (!parsedIngredients || !recipeName) return;

    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      name: recipeName,
      description: "",
      servings,
      prepTime,
      cookTime,
      ingredients: parsedIngredients.map((ing) => ({
        name: ing.item,
        amount: ing.quantity,
        unit: ing.unit,
        category: "Uncategorized",
      })),
      instructions: [],
      nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onRecipeAdd(newRecipe);
    toast({
      title: "Recipe created",
      description: "The recipe has been added to your collection.",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              From Text
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              From Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredients List</Label>
                <Textarea
                  id="ingredients"
                  placeholder="Paste ingredients list here..."
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  className="h-[200px] font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Paste a list of ingredients, one per line
                </p>
                <Button
                  onClick={handleTextImport}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Parse Ingredients"
                  )}
                </Button>
              </div>

              {parsedIngredients && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Recipe Name</Label>
                    <Input
                      id="name"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      placeholder="Enter recipe name"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="servings">Servings</Label>
                      <Input
                        id="servings"
                        type="number"
                        min={1}
                        value={servings}
                        onChange={(e) => setServings(Number(e.target.value))}
                        className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Parsed Ingredients</Label>
                    <ScrollArea className="h-[120px] w-full rounded-md border p-2 mt-1">
                      {parsedIngredients.map((ing, idx) => (
                        <div key={idx} className="text-sm py-1">
                          {ing.quantity} {ing.unit} {ing.item}
                          {ing.notes && (
                            <span className="text-gray-500">
                              {" "}
                              ({ing.notes})
                            </span>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>

                  <Button
                    onClick={handleCreateRecipe}
                    disabled={!recipeName}
                    className="w-full"
                  >
                    Create Recipe
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image">Upload Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageImport}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Upload an image of your ingredients list
                </p>
              </div>

              {parsedIngredients && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Recipe Name</Label>
                    <Input
                      id="name"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      placeholder="Enter recipe name"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="servings">Servings</Label>
                      <Input
                        id="servings"
                        type="number"
                        min={1}
                        value={servings}
                        onChange={(e) => setServings(Number(e.target.value))}
                        className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Parsed Ingredients</Label>
                    <ScrollArea className="h-[120px] w-full rounded-md border p-2 mt-1">
                      {parsedIngredients.map((ing, idx) => (
                        <div key={idx} className="text-sm py-1">
                          {ing.quantity} {ing.unit} {ing.item}
                          {ing.notes && (
                            <span className="text-gray-500">
                              {" "}
                              ({ing.notes})
                            </span>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>

                  <Button
                    onClick={handleCreateRecipe}
                    disabled={!recipeName}
                    className="w-full"
                  >
                    Create Recipe
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
