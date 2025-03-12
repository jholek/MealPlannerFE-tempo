import { useState } from "react";
import { useToast } from "./ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Share, Copy, Check } from "lucide-react";
import { createSharedList } from "@/lib/supabase/sharedLists";

export default function ShareListDialog(props) {
  const { ingredients, checkedItems, trigger } = props;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listName, setListName] = useState(
    `My Shopping List - ${new Date().toLocaleDateString()}`,
  );
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCreateShareableList = async () => {
    if (!listName.trim()) {
      toast({
        title: "List name required",
        description: "Please enter a name for your shopping list.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Format ingredients for the shared list
      const formattedItems = ingredients.map((ing) => {
        // Ensure each ingredient has a unique ID in the correct format
        const itemId =
          ing.id ||
          `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        return {
          id: itemId,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: ing.category,
          notes: ing.notes,
          checked: !!checkedItems[ing.id || ""],
          createdAt: new Date().toISOString(),
        };
      });

      console.log("Formatted items for shared list:", formattedItems);

      // Create the shared list
      const sharedList = await createSharedList(listName, formattedItems);

      // Generate the share URL
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/shared-list/${sharedList.shareId}`;

      setShareUrl(shareUrl);
      toast({
        title: "List shared successfully",
        description:
          "Your shopping list is now available via a shareable link.",
      });
    } catch (error) {
      console.error("Error creating shared list:", error);
      toast({
        title: "Error sharing list",
        description:
          "There was a problem creating your shared list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied",
      description: "The shareable link has been copied to your clipboard.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Share className="h-4 w-4" />
            Share List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Shopping List</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!shareUrl ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="listName">List Name</Label>
                <Input
                  id="listName"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Enter a name for your shopping list"
                />
              </div>
              <p className="text-sm text-gray-500">
                Create a shareable link that allows anyone to view and update
                this shopping list.
              </p>
            </>
          ) : (
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
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          {!shareUrl ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateShareableList}
                disabled={loading || !listName.trim()}
              >
                {loading ? "Creating..." : "Create Shareable Link"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpen(false)} className="ml-auto">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
