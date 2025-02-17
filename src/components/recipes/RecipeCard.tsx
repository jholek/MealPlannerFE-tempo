import { Recipe } from "@/types";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Clock, Users } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  className?: string;
}

export default function RecipeCard({
  recipe,
  onClick,
  className = "",
}: RecipeCardProps) {
  return (
    <Card
      className={`w-full bg-white hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
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

        <div className="flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
