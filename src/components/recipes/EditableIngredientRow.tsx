import { Input } from "../ui/input";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { INGREDIENT_TAGS } from "@/lib/ingredientTags";

interface EditableIngredientRowProps {
  quantity: number;
  unit: string;
  item: string;
  notes?: string;
  category?: string;
  onUpdate: (updated: {
    quantity: number;
    unit: string;
    item: string;
    notes?: string;
    category?: string;
  }) => void;
  onDelete: () => void;
}

export function EditableIngredientRow({
  quantity,
  unit,
  item,
  notes = "",
  category = "Other",
  onUpdate,
  onDelete,
}: EditableIngredientRowProps) {
  return (
    <tr className="border-b last:border-0 hover:bg-slate-50">
      <td className="p-2">
        <Input
          type="number"
          value={quantity}
          onChange={(e) =>
            onUpdate({
              quantity: Number(e.target.value),
              unit,
              item,
              notes,
              category,
            })
          }
          className="w-20 h-8 text-sm"
        />
      </td>
      <td className="p-2">
        <Input
          value={unit}
          onChange={(e) =>
            onUpdate({
              quantity,
              unit: e.target.value,
              item,
              notes,
              category,
            })
          }
          className="w-24 h-8 text-sm"
        />
      </td>
      <td className="p-2">
        <Input
          value={item}
          onChange={(e) =>
            onUpdate({
              quantity,
              unit,
              item: e.target.value,
              notes,
              category,
            })
          }
          className="h-8 text-sm"
        />
      </td>
      <td className="p-2">
        <Input
          value={notes}
          onChange={(e) =>
            onUpdate({
              quantity,
              unit,
              item,
              notes: e.target.value,
              category,
            })
          }
          className="h-8 text-sm text-slate-500"
        />
      </td>
      <td className="p-2 min-w-[180px]">
        <Select
          value={category}
          onValueChange={(value) =>
            onUpdate({
              quantity,
              unit,
              item,
              notes,
              category: value,
            })
          }
        >
          <SelectTrigger className="h-8 text-sm w-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {INGREDIENT_TAGS.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 h-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
