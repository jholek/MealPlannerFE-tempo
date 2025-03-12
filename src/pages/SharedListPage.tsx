import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  getSharedListByShareId,
  updateSharedList,
  SharedListItem,
} from "@/lib/supabase/sharedLists";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ListFilter,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";

export default function SharedListPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [loading, setLoading] = useState(true);
  const [listName, setListName] = useState("");
  const [items, setItems] = useState<SharedListItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [completedOpen, setCompletedOpen] = useState(false);
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    name: "",
    amount: "",
    unit: "",
    notes: "",
  });

  useEffect(() => {
    if (!shareId) return;

    const fetchSharedList = async () => {
      try {
        setLoading(true);
        const list = await getSharedListByShareId(shareId);

        if (!list) {
          toast({
            title: "List not found",
            description:
              "The shared list you're looking for doesn't exist or has been deleted.",
            variant: "destructive",
          });
          return;
        }

        setListName(list.name);
        setItems(list.items);

        // Initialize checked state from items
        const initialCheckedState: Record<string, boolean> = {};
        list.items.forEach((item) => {
          initialCheckedState[item.id] = item.checked || false;
        });
        setCheckedItems(initialCheckedState);

        console.log(
          "Setting up Supabase realtime subscription in SharedListPage with filter:",
          `share_id=eq.${shareId}`,
        );
        console.log("List ID for subscription:", list.id);

        // Set up real-time subscription for this shared list
        const subscription = supabase
          .channel(`shared_list_${list.id}`)
          .on(
            "postgres_changes",
            {
              event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
              schema: "public",
              table: "shared_lists",
            },
            (payload) => {
              console.log(
                "REALTIME UPDATE RECEIVED IN SHARED LIST PAGE:",
                payload,
              );
              console.log(
                "Real-time update received for shared list:",
                payload,
              );

              // Always fetch fresh data regardless of payload content
              supabase
                .from("shared_lists")
                .select("*")
                .eq("share_id", shareId)
                .single()
                .then(({ data: refreshedList, error }) => {
                  if (error) {
                    console.error("Error refreshing shared list data:", error);
                    return;
                  }

                  if (refreshedList && refreshedList.items) {
                    console.log("Refreshed shared list data:", refreshedList);
                    setItems(refreshedList.items);

                    // Update checked state for all items
                    const updatedCheckedState = { ...checkedItems };
                    refreshedList.items.forEach((item) => {
                      updatedCheckedState[item.id] = item.checked || false;
                    });
                    setCheckedItems(updatedCheckedState);
                  }
                });
            },
          )
          .subscribe();

        // Clean up subscription when component unmounts
        return () => {
          console.log("Cleaning up real-time subscription");
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error fetching shared list:", error);
        toast({
          title: "Error",
          description:
            "Failed to load the shared list. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSharedList();
    // No need to return cleanup function here as fetchSharedList already returns one
  }, [shareId, toast]);

  const handleCheckboxChange = async (id: string) => {
    if (!shareId) return;

    const newCheckedItems = { ...checkedItems };
    newCheckedItems[id] = !newCheckedItems[id];
    setCheckedItems(newCheckedItems);

    // Update items with new checked state
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        return { ...item, checked: newCheckedItems[id] };
      }
      return item;
    });
    setItems(updatedItems);

    // Save to database
    try {
      await updateSharedList(shareId, updatedItems);

      // Verify the update was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from("shared_lists")
        .select("*")
        .eq("share_id", shareId)
        .single();

      if (verifyError) {
        console.error("Error verifying checkbox update:", verifyError);
      } else if (verifyData) {
        const updatedItem = verifyData.items.find((item) => item.id === id);
        console.log("Verified checkbox state in database:", {
          itemId: id,
          expectedState: newCheckedItems[id],
          actualState: updatedItem?.checked,
        });

        // If the database state doesn't match our expected state, update local state
        if (updatedItem && updatedItem.checked !== newCheckedItems[id]) {
          console.warn(
            "Database checkbox state doesn't match local state, updating local state",
          );
          setCheckedItems((prev) => ({
            ...prev,
            [id]: updatedItem.checked,
          }));
        }
      }
    } catch (error) {
      console.error("Error updating shared list:", error);
      toast({
        title: "Error",
        description: "Failed to update the list. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async () => {
    if (!shareId || !newItem.name.trim()) return;

    const newItemObject: SharedListItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newItem.name.trim(),
      amount: parseFloat(newItem.amount) || 1,
      unit: newItem.unit.trim(),
      category: "Manual",
      notes: newItem.notes.trim() || undefined,
      checked: false,
      createdAt: new Date().toISOString(),
    };

    // Add the new item to the local state
    const updatedItems = [...items, newItemObject];

    // Reset form
    setNewItem({ name: "", amount: "", unit: "", notes: "" });

    // Save to database
    try {
      // Log the items being sent to the database
      console.log("Sending updated items to database:", updatedItems);

      // First, get the current shared list to ensure we have the latest data
      const { data: currentList, error: fetchError } = await supabase
        .from("shared_lists")
        .select("*")
        .eq("share_id", shareId)
        .single();

      if (fetchError) {
        console.error("Error fetching current shared list:", fetchError);
        throw new Error(
          `Failed to fetch current shared list: ${fetchError.message}`,
        );
      }

      console.log("Current shared list before update:", currentList);

      // Use the current list's items and add our new item
      const mergedItems = [...(currentList.items || []), newItemObject];

      // Update the database with the merged items
      await updateSharedList(shareId, mergedItems);

      // Update local state with the merged items
      setItems(mergedItems);

      toast({
        title: "Item added",
        description: "The item has been added to the list.",
      });

      // Manually refresh the list to ensure we have the latest data
      const { data: refreshedList, error: refreshError } = await supabase
        .from("shared_lists")
        .select("*")
        .eq("share_id", shareId)
        .single();

      if (!refreshError && refreshedList) {
        console.log("Refreshed list after adding item:", refreshedList);
        setItems(refreshedList.items);
      }
    } catch (error) {
      console.error("Error adding item to shared list:", error);
      toast({
        title: "Error",
        description: "Failed to add the item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (!shareId) return;

    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);

    // Remove from checked items if it was checked
    if (checkedItems[id]) {
      const newCheckedItems = { ...checkedItems };
      delete newCheckedItems[id];
      setCheckedItems(newCheckedItems);
    }

    // Save to database
    try {
      await updateSharedList(shareId, updatedItems);
      toast({
        title: "Item removed",
        description: "The item has been removed from the list.",
      });
    } catch (error) {
      console.error("Error removing item from shared list:", error);
      toast({
        title: "Error",
        description: "Failed to remove the item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeselectAll = async () => {
    if (!shareId) return;

    // Uncheck all items
    setCheckedItems({});

    // Update items with new checked state
    const updatedItems = items.map((item) => ({ ...item, checked: false }));
    setItems(updatedItems);

    // Save to database
    try {
      await updateSharedList(shareId, updatedItems);
      toast({
        title: "All items deselected",
        description: "All items have been marked as not completed.",
      });
    } catch (error) {
      console.error("Error updating shared list:", error);
      toast({
        title: "Error",
        description: "Failed to update the list. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Group items by category
  const groupedItems = items.reduce(
    (acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, SharedListItem[]>,
  );

  // Separate completed and uncompleted items
  const completedItems = items.filter((item) => checkedItems[item.id]);
  const uncompletedItems = items.filter((item) => !checkedItems[item.id]);

  // Group completed items by category
  const groupedCompletedItems = completedItems.reduce(
    (acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, SharedListItem[]>,
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl font-bold">{listName}</h1>
              <p className="text-gray-500 text-sm mt-1">
                Created:{" "}
                {new Date(
                  items[0]?.createdAt || Date.now(),
                ).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!shareId) return;
                try {
                  setLoading(true);
                  const { data: refreshedList, error } = await supabase
                    .from("shared_lists")
                    .select("*")
                    .eq("share_id", shareId)
                    .single();

                  if (error) {
                    console.error("Error refreshing shared list data:", error);
                    toast({
                      title: "Refresh failed",
                      description:
                        "Could not refresh the list. Please try again.",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (refreshedList && refreshedList.items) {
                    console.log(
                      "Manually refreshed shared list data:",
                      refreshedList,
                    );
                    setItems(refreshedList.items);

                    // Update checked state for all items
                    const updatedCheckedState = { ...checkedItems };
                    refreshedList.items.forEach((item) => {
                      updatedCheckedState[item.id] = item.checked || false;
                    });
                    setCheckedItems(updatedCheckedState);

                    toast({
                      title: "List refreshed",
                      description:
                        "The shopping list has been refreshed with the latest data.",
                    });
                  }
                } catch (error) {
                  console.error("Error manually refreshing list:", error);
                  toast({
                    title: "Refresh failed",
                    description:
                      "Could not refresh the list. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setLoading(false);
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                <path d="M16 21h5v-5"></path>
              </svg>
              Refresh List
            </Button>
          </div>
          <p className="text-gray-600 mb-4">
            This is a shared shopping list. Anyone with this link can view and
            update the list.
          </p>

          {/* Quick add manual item */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Add Item
              </Badge>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddItem();
              }}
              className="border rounded-md p-3"
            >
              <div className="grid grid-cols-12 gap-2">
                <Input
                  placeholder="Item name"
                  className="col-span-4"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      name: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Amount"
                  type="number"
                  className="col-span-2"
                  value={newItem.amount}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      amount: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Unit"
                  className="col-span-2"
                  value={newItem.unit}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      unit: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Notes (optional)"
                  className="col-span-3"
                  value={newItem.notes}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      notes: e.target.value,
                    })
                  }
                />
                <Button
                  className="col-span-1"
                  size="sm"
                  type="submit"
                  disabled={!newItem.name.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          {/* Shopping list items */}
          <div className="space-y-6">
            {/* Active shopping list items */}
            {/* Show Manual category first */}
            {groupedItems["Manual"] &&
              groupedItems["Manual"].some((item) => !checkedItems[item.id]) && (
                <div key="Manual">
                  <div className="flex items-center gap-1 mb-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      Manual
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {
                        groupedItems["Manual"].filter(
                          (item) => !checkedItems[item.id],
                        ).length
                      }{" "}
                      items
                    </span>
                  </div>
                  <div className="border rounded-md mb-6">
                    {groupedItems["Manual"]
                      .filter((item) => !checkedItems[item.id])
                      .map((item) => (
                        <div
                          key={item.id}
                          className="py-2 px-3 border-b last:border-b-0"
                        >
                          <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => handleCheckboxChange(item.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={item.id}
                                checked={checkedItems[item.id]}
                                onCheckedChange={() =>
                                  handleCheckboxChange(item.id)
                                }
                              />
                              <span className="font-medium">
                                {item.name}
                                {item.notes && (
                                  <span className="font-normal text-sm text-gray-500 ml-2">
                                    ({item.notes})
                                  </span>
                                )}
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs py-0 px-1 bg-blue-50 text-blue-700"
                                >
                                  Manual
                                </Badge>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">
                                {item.amount} {item.unit}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveItem(item.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Other categories */}
            {Object.entries(groupedItems)
              .filter(
                ([category, items]) =>
                  category !== "Manual" &&
                  items.some((item) => !checkedItems[item.id]),
              )
              .map(([category, categoryItems]) => {
                const uncheckedItems = categoryItems.filter(
                  (item) => !checkedItems[item.id],
                );
                if (uncheckedItems.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-1 mb-2">
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-700"
                      >
                        {category}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {uncheckedItems.length} items
                      </span>
                    </div>

                    <div className="border rounded-md">
                      {uncheckedItems.map((item) => (
                        <div
                          key={item.id}
                          className="py-2 px-3 border-b last:border-b-0"
                        >
                          <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => handleCheckboxChange(item.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={item.id}
                                checked={checkedItems[item.id]}
                                onCheckedChange={() =>
                                  handleCheckboxChange(item.id)
                                }
                              />
                              <span className="font-medium">
                                {item.name}
                                {item.notes && (
                                  <span className="font-normal text-sm text-gray-500 ml-2">
                                    ({item.notes})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">
                                {item.amount} {item.unit}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveItem(item.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            {/* Completed items section */}
            {completedItems.length > 0 && (
              <Collapsible
                open={completedOpen}
                onOpenChange={setCompletedOpen}
                className="mt-8"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      Completed Items
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {completedItems.length} items
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-7 w-7">
                        {completedOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent>
                  {Object.entries(groupedCompletedItems).map(
                    ([category, items]) => (
                      <div key={`completed-${category}`} className="mb-4">
                        <div className="flex items-center gap-1 mb-2">
                          <Badge variant="outline" className="text-gray-500">
                            {category}
                          </Badge>
                        </div>
                        <div className="border border-gray-200 rounded-md">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="py-2 px-3 border-b last:border-b-0 bg-gray-50"
                            >
                              <div
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => handleCheckboxChange(item.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={item.id}
                                    checked={checkedItems[item.id]}
                                    onCheckedChange={() =>
                                      handleCheckboxChange(item.id)
                                    }
                                  />
                                  <span className="font-medium line-through text-gray-500">
                                    {item.name}
                                    {item.notes && (
                                      <span className="font-normal text-sm text-gray-400 ml-2 line-through">
                                        ({item.notes})
                                      </span>
                                    )}
                                    {item.category === "Manual" && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-xs py-0 px-1 bg-blue-50 text-blue-700 no-underline"
                                      >
                                        Manual
                                      </Badge>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 line-through">
                                    {item.amount} {item.unit}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveItem(item.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
