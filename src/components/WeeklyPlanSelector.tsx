import { useState, useEffect } from "react";
import { MealPlan } from "@/types";
import { fetchMealPlans } from "@/lib/supabase/mealPlans";
import { Button } from "./ui/button";
import { Calendar, Save, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { format } from "date-fns";
import { useToast } from "./ui/use-toast";

interface WeeklyPlanSelectorProps {
  onPlanSelect: (plan: MealPlan) => void;
  onSavePlan: (name: string) => Promise<void>;
  currentPlanId?: string;
  onCreateNewPlan: () => void;
  onDeletePlan: (planId: string) => Promise<void>;
}

export default function WeeklyPlanSelector({
  onPlanSelect,
  onSavePlan,
  currentPlanId,
  onCreateNewPlan,
  onDeletePlan,
}: WeeklyPlanSelectorProps) {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (currentPlanId) {
      setSelectedPlanId(currentPlanId);
    }
  }, [currentPlanId]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const mealPlans = await fetchMealPlans();
      setPlans(mealPlans);

      // If there's a current plan, select it
      if (currentPlanId && mealPlans.find((p) => p.id === currentPlanId)) {
        setSelectedPlanId(currentPlanId);
      } else if (mealPlans.length > 0 && !currentPlanId) {
        // Otherwise select the most recent plan
        setSelectedPlanId(mealPlans[0].id);
        const selectedPlan = mealPlans.find((p) => p.id === mealPlans[0].id);
        if (selectedPlan) onPlanSelect(selectedPlan);
      }
    } catch (error) {
      console.error("Error loading meal plans:", error);
      toast({
        title: "Failed to load meal plans",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    const selectedPlan = plans.find((plan) => plan.id === planId);
    if (selectedPlan) {
      onPlanSelect(selectedPlan);
    }
  };

  const handleSaveClick = () => {
    // If we're editing an existing plan, use its name as default
    if (currentPlanId) {
      const currentPlan = plans.find((plan) => plan.id === currentPlanId);
      if (currentPlan) {
        setPlanName(currentPlan.name);
      }
    } else {
      // Default name for a new plan
      setPlanName(`Meal Plan - ${format(new Date(), "MMM d, yyyy")}`);
    }
    setSaveDialogOpen(true);
  };

  const handleSaveConfirm = async () => {
    try {
      await onSavePlan(planName);
      setSaveDialogOpen(false);
      loadPlans(); // Refresh the plans list
      toast({
        title: "Plan saved",
        description: "Your meal plan has been saved successfully",
      });
    } catch (error) {
      console.error("Error saving meal plan:", error);
      toast({
        title: "Failed to save plan",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!planId) return;

    try {
      await onDeletePlan(planId);
      loadPlans(); // Refresh the plans list
      toast({
        title: "Plan deleted",
        description: "Your meal plan has been deleted",
      });

      // If we deleted the currently selected plan, create a new one
      if (planId === selectedPlanId) {
        onCreateNewPlan();
      }
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      toast({
        title: "Failed to delete plan",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <Select
          value={selectedPlanId}
          onValueChange={handlePlanSelect}
          disabled={loading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a meal plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{plan.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleSaveClick}
        title="Save plan"
      >
        <Save className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onCreateNewPlan}
        title="New plan"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {selectedPlanId && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleDeletePlan(selectedPlanId)}
          title="Delete plan"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Meal Plan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="mt-2"
              placeholder="Enter a name for your meal plan"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm} disabled={!planName.trim()}>
              Save Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
