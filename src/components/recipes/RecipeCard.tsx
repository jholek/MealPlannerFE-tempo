import { Recipe } from "@/types";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Clock, Users, Link2 } from "lucide-react";
import ViewRecipeDialog from "./ViewRecipeDialog";

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
  onUpdate?: (recipe: Recipe | null) => void;
  onDragStart?: (e: React.DragEvent, recipe: any) => void;
}

export default function RecipeCard({
  recipe,
  className = "",
  onUpdate = () => {},
  onDragStart = () => {},
}: RecipeCardProps) {
  return (
    <Card
      className={`overflow-hidden ${className} cursor-move hover:shadow-lg transition-all`}
      draggable
      onDragStart={(e) =>
        onDragStart(e, {
          id: recipe.id,
          name: recipe.name,
          servings: recipe.servings,
          time: "",
          ingredients: recipe.ingredients,
        })
      }
    >
      <div className="p-4 relative">
        {recipe.url && (
          <a
            href={recipe.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 text-blue-500 hover:text-blue-700 transition-colors cursor-pointer p-2 rounded-full hover:bg-blue-50"
            onClick={(e) => e.stopPropagation()}
          >
            <Link2 className="w-5 h-5" />
          </a>
        )}
        <h3 className="font-medium mb-2 pr-8">{recipe.name}</h3>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{recipe.servings}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{recipe.prepTime + recipe.cookTime} mins</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <ViewRecipeDialog
        recipe={recipe}
        onRecipeUpdate={onUpdate}
        trigger={
          <div className="px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-sm text-center border-t">
            View Recipe
          </div>
        }
      />
    </Card>
  );
}
