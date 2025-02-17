import { Recipe } from "@/types";
import RecipeCard from "./RecipeCard";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import AddRecipeDialog from "./AddRecipeDialog";

interface RecipeBrowserProps {
  recipes?: Recipe[];
  onDragStart?: (e: React.DragEvent, recipe: Recipe) => void;
}

const DEFAULT_RECIPES: Recipe[] = [
  {
    id: "1",
    name: "Spaghetti Bolognese",
    description: "Classic Italian pasta dish with rich meat sauce",
    servings: 4,
    prepTime: 15,
    cookTime: 45,
    ingredients: [
      { name: "Ground Beef", amount: 1, unit: "lb", category: "Meat" },
      { name: "Spaghetti", amount: 1, unit: "lb", category: "Pasta" },
      {
        name: "Tomato Sauce",
        amount: 24,
        unit: "oz",
        category: "Canned Goods",
      },
    ],
    instructions: ["Brown meat", "Cook pasta", "Combine and simmer"],
    nutritionalInfo: { calories: 650, protein: 35, carbs: 70, fat: 25 },
    tags: ["Italian", "Pasta", "Dinner"],
    image: "https://images.unsplash.com/photo-1598866594230-a7c12756260f",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Chicken Caesar Salad",
    description:
      "Fresh romaine lettuce with grilled chicken and creamy dressing",
    servings: 2,
    prepTime: 20,
    cookTime: 15,
    ingredients: [
      { name: "Chicken Breast", amount: 2, unit: "pieces", category: "Meat" },
      { name: "Romaine Lettuce", amount: 1, unit: "head", category: "Produce" },
      {
        name: "Caesar Dressing",
        amount: 4,
        unit: "oz",
        category: "Condiments",
      },
    ],
    instructions: ["Grill chicken", "Chop lettuce", "Assemble salad"],
    nutritionalInfo: { calories: 400, protein: 35, carbs: 10, fat: 28 },
    tags: ["Salad", "Healthy", "Lunch"],
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function RecipeBrowser({
  recipes = DEFAULT_RECIPES,
  onDragStart = () => {},
}: RecipeBrowserProps) {
  return (
    <div className="w-[300px] h-full bg-gray-50 p-4 border-r">
      <div className="mb-4 space-y-4">
        <h2 className="text-xl font-semibold">Recipes</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search recipes..." className="pl-8" />
        </div>
        <AddRecipeDialog
          onRecipeAdd={(recipe) => {
            // Add the new recipe to the list
            recipes = [recipe, ...recipes];
          }}
        />
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              draggable
              onDragStart={(e) => onDragStart(e, recipe)}
            >
              <RecipeCard
                recipe={recipe}
                className="hover:shadow-md transition-shadow"
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
