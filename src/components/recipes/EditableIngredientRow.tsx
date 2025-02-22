import { Input } from "../ui/input";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";

interface EditableIngredientRowProps {
  quantity: number;
  unit: string;
  item: string;
  notes?: string;
  onUpdate: (updated: {
    quantity: number;
    unit: string;
    item: string;
    notes?: string;
  }) => void;
  onDelete: () => void;
}

export function EditableIngredientRow({
  quantity,
  unit,
  item,
  notes = "",
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
            })
          }
          className="h-8 text-sm text-slate-500"
        />
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
