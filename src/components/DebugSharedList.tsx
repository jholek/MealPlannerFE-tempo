import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { supabase } from "@/lib/supabase";

export default function DebugSharedList() {
  const [mealPlanId, setMealPlanId] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMealPlanDetails = async () => {
    if (!mealPlanId) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Fetch the meal plan
      const { data: mealPlan, error: mealPlanError } = await supabase
        .from("meal_plans")
        .select("*, shared_list_id")
        .eq("id", mealPlanId)
        .single();

      if (mealPlanError) {
        throw new Error(`Error fetching meal plan: ${mealPlanError.message}`);
      }

      let sharedListData = null;

      // If the meal plan has a shared list ID, fetch the shared list
      if (mealPlan.shared_list_id) {
        const { data: sharedList, error: sharedListError } = await supabase
          .from("shared_lists")
          .select("*")
          .eq("id", mealPlan.shared_list_id)
          .single();

        if (sharedListError) {
          console.warn(
            `Error fetching shared list: ${sharedListError.message}`,
          );
        } else {
          sharedListData = sharedList;
        }
      }

      // Set the results
      setResults({
        mealPlan,
        sharedList: sharedListData,
        dataSharedListId: mealPlan.data?.sharedListId || null,
      });
    } catch (error) {
      console.error("Debug error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fixSharedListId = async () => {
    if (!results?.mealPlan) return;

    setLoading(true);
    setError(null);

    try {
      const mealPlan = results.mealPlan;
      const sharedListId = mealPlan.shared_list_id;

      if (!sharedListId) {
        throw new Error("No shared_list_id to fix");
      }

      // Update the data field with the correct sharedListId
      const updatedData = {
        ...mealPlan.data,
        sharedListId: sharedListId,
      };

      const { error: updateError } = await supabase
        .from("meal_plans")
        .update({ data: updatedData })
        .eq("id", mealPlan.id);

      if (updateError) {
        throw new Error(`Error updating meal plan: ${updateError.message}`);
      }

      // Refresh the data
      await fetchMealPlanDetails();

      alert("Fixed successfully!");
    } catch (error) {
      console.error("Fix error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Debug Shared List</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="mealPlanId">Meal Plan ID</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="mealPlanId"
              value={mealPlanId}
              onChange={(e) => setMealPlanId(e.target.value)}
              placeholder="Enter meal plan ID"
            />
            <Button
              onClick={fetchMealPlanDetails}
              disabled={loading || !mealPlanId}
            >
              {loading ? "Loading..." : "Fetch Details"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-md">{error}</div>
        )}

        {results && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-100 rounded-md">
              <h3 className="font-semibold mb-2">Meal Plan</h3>
              <div className="space-y-2">
                <div>
                  <strong>ID:</strong> {results.mealPlan.id}
                </div>
                <div>
                  <strong>Name:</strong> {results.mealPlan.name}
                </div>
                <div>
                  <strong>shared_list_id column:</strong>{" "}
                  {results.mealPlan.shared_list_id || "null"}
                </div>
                <div>
                  <strong>data.sharedListId:</strong>{" "}
                  {results.dataSharedListId || "null"}
                </div>
                <div className="flex gap-2 mt-2">
                  {results.mealPlan.shared_list_id &&
                    results.dataSharedListId !==
                      results.mealPlan.shared_list_id && (
                      <Button
                        onClick={fixSharedListId}
                        size="sm"
                        variant="outline"
                      >
                        Fix data.sharedListId
                      </Button>
                    )}
                </div>
              </div>
            </div>

            {results.sharedList ? (
              <div className="p-3 bg-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">Shared List</h3>
                <div className="space-y-2">
                  <div>
                    <strong>ID:</strong> {results.sharedList.id}
                  </div>
                  <div>
                    <strong>Name:</strong> {results.sharedList.name}
                  </div>
                  <div>
                    <strong>Share ID:</strong> {results.sharedList.share_id}
                  </div>
                  <div>
                    <strong>Items:</strong>{" "}
                    {results.sharedList.items?.length || 0} items
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(results.sharedList.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md">
                No shared list found for this meal plan.
              </div>
            )}

            <div className="p-3 bg-gray-100 rounded-md">
              <h3 className="font-semibold mb-2">Raw Data</h3>
              <pre className="text-xs overflow-auto max-h-[300px] p-2 bg-gray-50 rounded">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
