import { Recipe } from "@/types";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Clock, Users } from "lucide-react";
import ViewRecipeDialog from "./ViewRecipeDialog";

interface RecipeCardProps {
  recipe: Recipe;
  onUpdate: (recipe: Recipe) => void;
  className?: string;
}

export default function RecipeCard({
  recipe,
  onUpdate,
  className = "",
}: RecipeCardProps) {
  return (
    <ViewRecipeDialog
      recipe={recipe}
      onRecipeUpdate={onUpdate}
      trigger={
        <Card
          className={`w-full bg-white hover:shadow-lg transition-shadow cursor-pointer ${className}`}
        >
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={
                recipe.image ||
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
              }
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{recipe.name}</h3>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {recipe.description}
            </p>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{recipe.servings} servings</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{recipe.prepTime + recipe.cookTime} mins</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              {recipe.url && (
                <a
                  href={recipe.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Original Recipe
                </a>
              )}
            </div>
          </div>
        </Card>
      }
    />
  );
}
