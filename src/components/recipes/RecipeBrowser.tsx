import { Recipe } from "@/types";
import RecipeCard from "./RecipeCard";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import AddRecipeDialog from "./AddRecipeDialog";

interface RecipeBrowserProps {
  recipes?: Recipe[];
  onDragStart?: (e: React.DragEvent, recipe: Recipe) => void;
  initialOpenAddRecipe?: boolean;
  onAddRecipeOpenChange?: (open: boolean) => void;
}

import { fetchRecipes } from "@/lib/supabase/recipes";
import { useEffect, useState } from "react";
import { useToast } from "../ui/use-toast";

const DEFAULT_RECIPES: Recipe[] = [];

export default function RecipeBrowser({
  onDragStart = () => {},
  initialOpenAddRecipe = false,
  onAddRecipeOpenChange = () => {},
}: RecipeBrowserProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(DEFAULT_RECIPES);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadRecipes = async () => {
    try {
      const data = await fetchRecipes();
      setRecipes(data);
    } catch (error) {
      console.error("Error loading recipes:", error);
      toast({
        title: "Error loading recipes",
        description:
          error.message ||
          "Failed to load recipes. Please check your database connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);
  return (
    <div className="w-full h-full bg-gray-50 p-4 border rounded-lg">
      <div className="mb-4 space-y-4">
        <h2 className="text-xl font-semibold">Recipes</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search recipes..." className="pl-8" />
        </div>
        <AddRecipeDialog
          initialOpen={initialOpenAddRecipe}
          onOpenChange={onAddRecipeOpenChange}
          onRecipeAdd={(recipe) => {
            // Always refresh the list to ensure we have the latest data
            loadRecipes();
          }}
        />
      </div>

      <ScrollArea className="h-[400px] md:h-[500px]">
        <div className="space-y-4 pr-2">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              draggable
              onDragStart={(e) => onDragStart(e, recipe)}
            >
              <RecipeCard
                recipe={recipe}
                className="hover:shadow-md transition-shadow"
                onUpdate={(updatedRecipe) => {
                  if (!updatedRecipe) {
                    // Recipe was deleted, refresh the list
                    loadRecipes();
                  }
                }}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
