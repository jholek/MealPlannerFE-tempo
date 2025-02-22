import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Utensils } from "lucide-react";

interface LeftoverCardProps {
  recipeName: string;
  servingsLeft: number;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function LeftoverCard({
  recipeName,
  servingsLeft,
  onDragStart = () => {},
}: LeftoverCardProps) {
  return (
    <Card
      className="p-2 cursor-move bg-white hover:shadow-md transition-shadow border-orange-200 border"
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-orange-500" />
          <span className="font-medium text-sm">{recipeName}</span>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          {servingsLeft} servings left
        </Badge>
      </div>
    </Card>
  );
}
