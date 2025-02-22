import { useState } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { UserPreferences } from "@/types";

interface PreferencesFormProps {
  onSubmit: (preferences: UserPreferences) => void;
  initialPreferences?: UserPreferences;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  householdSize: 2,
  mealTypes: ["breakfast", "lunch", "dinner"],
};

export default function PreferencesForm({
  onSubmit,
  initialPreferences = DEFAULT_PREFERENCES,
  open,
  onOpenChange,
}: PreferencesFormProps) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(initialPreferences);

  const mealTypeOptions = [
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" },
    { id: "snacks", label: "Snacks" },
  ];

  if (open === undefined) {
    return (
      <Card className="w-[600px] p-6 bg-white">
        <h2 className="text-2xl font-semibold mb-6">Household Preferences</h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="householdSize">Household Size</Label>
            <Input
              id="householdSize"
              type="number"
              min={1}
              value={preferences.householdSize}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  householdSize: parseInt(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Meal Types</Label>
            <div className="grid grid-cols-2 gap-4">
              {mealTypeOptions.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={preferences.mealTypes.includes(type.id as any)}
                    onCheckedChange={(checked) => {
                      setPreferences((prev) => ({
                        ...prev,
                        mealTypes: checked
                          ? [...prev.mealTypes, type.id as any]
                          : prev.mealTypes.filter((t) => t !== type.id),
                      }));
                    }}
                  />
                  <Label htmlFor={type.id}>{type.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={() => onSubmit(preferences)}>
            Save Preferences
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Household Preferences</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="householdSize">Household Size</Label>
            <Input
              id="householdSize"
              type="number"
              min={1}
              value={preferences.householdSize}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  householdSize: parseInt(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Meal Types</Label>
            <div className="grid grid-cols-2 gap-4">
              {mealTypeOptions.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={preferences.mealTypes.includes(type.id as any)}
                    onCheckedChange={(checked) => {
                      setPreferences((prev) => ({
                        ...prev,
                        mealTypes: checked
                          ? [...prev.mealTypes, type.id as any]
                          : prev.mealTypes.filter((t) => t !== type.id),
                      }));
                    }}
                  />
                  <Label htmlFor={type.id}>{type.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onSubmit(preferences)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
