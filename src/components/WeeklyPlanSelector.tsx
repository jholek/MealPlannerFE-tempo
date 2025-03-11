import React, { useState, useEffect, useImperativeHandle } from "react";
import { MealPlan } from "@/types";
import { fetchMealPlans } from "@/lib/supabase/mealPlans";
import { Button } from "./ui/button";
import { Calendar, Save, Plus, Trash2, Share, Copy, Check } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import {
  createSharedList,
  getSharedListByShareId,
} from "@/lib/supabase/sharedLists";

interface WeeklyPlanSelectorProps {
  onPlanSelect: (plan: MealPlan) => void;
  onSavePlan: (name: string) => Promise<void>;
  currentPlanId?: string;
  onCreateNewPlan: () => void;
  onDeletePlan: (planId: string) => Promise<void>;
}

const WeeklyPlanSelector = React.forwardRef(function WeeklyPlanSelector(
  {
    onPlanSelect,
    onSavePlan,
    currentPlanId,
    onCreateNewPlan,
    onDeletePlan,
  }: WeeklyPlanSelectorProps,
  ref,
) {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (currentPlanId) {
      setSelectedPlanId(currentPlanId);
      // Reset share URL when current plan ID changes
      setShareUrl("");
      setShareDialogOpen(false);
    }
  }, [currentPlanId]);

  const loadPlans = async () => {
    try {
      setLoading(true);

      // Get all meal plans directly from the database to ensure we have the most up-to-date data
      const { data: dbPlans, error: dbPlansError } = await supabase
        .from("meal_plans")
        .select("*, shared_list_id")
        .order("created_at", { ascending: false });

      if (dbPlansError) {
        console.error("Error fetching meal plans from database:", dbPlansError);
        throw new Error(`Failed to fetch meal plans: ${dbPlansError.message}`);
      }

      console.log("Raw database meal plans:", dbPlans);

      // Process the database plans to ensure consistent structure
      const processedPlans = await Promise.all(
        dbPlans.map(async (dbPlan) => {
          // Extract plan data from the JSON field
          const planData = dbPlan.data || {};

          // Always prioritize the database shared_list_id column over the data field
          const sharedListId = dbPlan.shared_list_id;

          if (sharedListId) {
            // Verify the shared list exists
            const { data: sharedList, error: sharedListError } = await supabase
              .from("shared_lists")
              .select("id, share_id")
              .eq("id", sharedListId)
              .single();

            if (sharedListError || !sharedList) {
              console.warn(
                `Shared list ${sharedListId} not found for plan ${dbPlan.id}`,
              );

              // Clear the invalid shared list reference
              await supabase
                .from("meal_plans")
                .update({ shared_list_id: null })
                .eq("id", dbPlan.id);

              return {
                ...planData,
                id: dbPlan.id,
                userId: dbPlan.user_id,
                sharedListId: null,
                createdAt: dbPlan.created_at,
                updatedAt: dbPlan.updated_at,
              };
            }

            // If the shared list exists but the data field doesn't have it, update the data field
            if (
              !planData.sharedListId ||
              planData.sharedListId !== sharedListId
            ) {
              const updatedData = {
                ...planData,
                sharedListId: sharedListId,
              };

              await supabase
                .from("meal_plans")
                .update({ data: updatedData })
                .eq("id", dbPlan.id);
            }
          }

          // Return the processed plan with consistent structure
          return {
            ...planData,
            id: dbPlan.id,
            userId: dbPlan.user_id,
            sharedListId: sharedListId,
            createdAt: dbPlan.created_at,
            updatedAt: dbPlan.updated_at,
          };
        }),
      );

      console.log(
        "Processed plans with verified shared lists:",
        processedPlans,
      );
      setPlans(processedPlans);

      // If there's a current plan, select it
      if (currentPlanId && processedPlans.find((p) => p.id === currentPlanId)) {
        setSelectedPlanId(currentPlanId);
      } else if (processedPlans.length > 0 && !currentPlanId) {
        // Otherwise select the most recent plan
        setSelectedPlanId(processedPlans[0].id);
        const selectedPlan = processedPlans.find(
          (p) => p.id === processedPlans[0].id,
        );
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

  const handlePlanSelect = async (planId: string) => {
    setSelectedPlanId(planId);

    // Get the most up-to-date plan data directly from the database
    const { data: dbPlan, error: dbPlanError } = await supabase
      .from("meal_plans")
      .select("*, shared_list_id")
      .eq("id", planId)
      .single();

    if (dbPlanError) {
      console.error("Error fetching selected plan from database:", dbPlanError);
      toast({
        title: "Error loading plan",
        description: "Failed to load the selected meal plan",
        variant: "destructive",
      });
      return;
    }

    // Process the plan data
    const planData = dbPlan.data || {};

    // Always use the shared_list_id from the database column
    const selectedPlan = {
      ...planData,
      id: dbPlan.id,
      userId: dbPlan.user_id,
      sharedListId: dbPlan.shared_list_id,
      createdAt: dbPlan.created_at,
      updatedAt: dbPlan.updated_at,
    };

    console.log("Selected plan from database:", selectedPlan);
    console.log("  - shared_list_id from DB column:", dbPlan.shared_list_id);
    console.log("  - sharedListId from data field:", planData.sharedListId);

    // If the data field doesn't match the database column, fix it
    if (
      dbPlan.shared_list_id &&
      (!planData.sharedListId ||
        planData.sharedListId !== dbPlan.shared_list_id)
    ) {
      console.log("Fixing inconsistent sharedListId in data field");
      const updatedData = {
        ...planData,
        sharedListId: dbPlan.shared_list_id,
      };

      await supabase
        .from("meal_plans")
        .update({ data: updatedData })
        .eq("id", dbPlan.id);
    }

    // Reset share URL when changing plans
    setShareUrl("");
    setShareDialogOpen(false);
    onPlanSelect(selectedPlan);
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

  const handleShareShoppingList = async () => {
    if (!currentPlanId) return;

    try {
      // First, directly query the database for the current plan to get the most up-to-date data
      const { data: dbPlan, error: dbPlanError } = await supabase
        .from("meal_plans")
        .select("*, shared_list_id")
        .eq("id", currentPlanId)
        .single();

      if (dbPlanError) {
        console.error("Error fetching meal plan from database:", dbPlanError);
        throw new Error(`Failed to fetch meal plan: ${dbPlanError.message}`);
      }

      // Check if this plan already has a shared list in the database
      if (dbPlan.shared_list_id) {
        console.log(
          "Found existing shared list ID in database:",
          dbPlan.shared_list_id,
        );

        // Get the existing shared list directly from the shared lists table
        const { data: sharedList, error: sharedListError } = await supabase
          .from("shared_lists")
          .select("*")
          .eq("id", dbPlan.shared_list_id)
          .single();

        if (!sharedListError && sharedList) {
          console.log("Retrieved existing shared list:", sharedList);

          // Set the share URL using the existing shared list
          const baseUrl = window.location.origin;
          setShareUrl(`${baseUrl}/shared-list/${sharedList.share_id}`);
          setShareDialogOpen(true);

          toast({
            title: "Existing shopping list shared",
            description: "Using your previously created shopping list.",
          });
          return;
        } else {
          console.error("Error retrieving shared list:", sharedListError);
          // If the shared list doesn't exist anymore, we'll create a new one
        }
      }

      // Get the current plan from local state for ingredients
      const currentPlan = plans.find((plan) => plan.id === currentPlanId);
      if (!currentPlan) {
        throw new Error("Current plan not found in local state");
      }

      // Extract all ingredients from the meal plan
      const allIngredients = Object.values(currentPlan.meals || {})
        .filter((meal) => !meal.isLeftover) // Only include non-leftover meals
        .flatMap((meal) => meal.ingredients || []); // Use original recipe quantities

      // Format ingredients for sharing
      const formattedItems = allIngredients.map((ing) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        category: ing.category,
        notes: ing.notes,
        checked: false,
        createdAt: new Date().toISOString(),
      }));

      // Create a shared list with the ingredients
      const listName = `Shopping List for ${currentPlan.name} - ${new Date().toLocaleDateString()}`;
      const sharedList = await createSharedList(listName, formattedItems);

      console.log("Created new shared list:", sharedList);

      // CRITICAL: Update both the shared_list_id column AND the data JSON field in a single operation
      // This ensures atomicity and prevents data inconsistency
      const updatedPlanData = {
        ...dbPlan.data,
        sharedListId: sharedList.id,
      };

      console.log("Updating meal plan with:", {
        shared_list_id: sharedList.id,
        updatedPlanData,
      });

      // First update the shared_list_id column
      const { error: updateError } = await supabase
        .from("meal_plans")
        .update({
          shared_list_id: sharedList.id,
        })
        .eq("id", currentPlanId);

      if (updateError) {
        console.error("Error updating meal plan shared_list_id:", updateError);
        throw new Error(`Failed to update meal plan: ${updateError.message}`);
      }

      // Then update the data field separately to ensure both updates happen
      const { error: dataUpdateError } = await supabase
        .from("meal_plans")
        .update({
          data: updatedPlanData,
        })
        .eq("id", currentPlanId);

      if (dataUpdateError) {
        console.error("Error updating meal plan data:", dataUpdateError);
        throw new Error(
          `Failed to update meal plan data: ${dataUpdateError.message}`,
        );
      }

      console.log(
        "Successfully updated meal plan with shared list ID:",
        sharedList.id,
      );

      // Set the share URL
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/shared-list/${sharedList.shareId}`);
      setShareDialogOpen(true);

      // Refresh plans to get updated data
      await loadPlans();

      toast({
        title: "Shopping list shared",
        description:
          "Your shopping list is now available via a shareable link.",
      });
    } catch (error) {
      console.error("Error sharing shopping list:", error);
      toast({
        title: "Failed to share shopping list",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Expose the handleShareShoppingList method via ref
  React.useImperativeHandle(ref, () => ({
    handleShareShoppingList,
  }));

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied",
      description: "The shareable link has been copied to your clipboard.",
    });
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

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Shopping List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {shareUrl ? (
              <>
                <p className="text-sm text-gray-500 mb-2">
                  Your shopping list is now available at the following URL:
                </p>
                <div className="flex items-center space-x-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Anyone with this link can view and update the shopping list in
                  real-time.
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default WeeklyPlanSelector;
