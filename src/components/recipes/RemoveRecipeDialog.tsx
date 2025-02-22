import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface RemoveRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeName: string;
  onConfirm: () => void;
}

export default function RemoveRecipeDialog({
  open,
  onOpenChange,
  recipeName,
  onConfirm,
}: RemoveRecipeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Recipe from Meal Plan</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {recipeName} from your meal plan?
            This will remove all instances of this recipe, including any
            leftovers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
