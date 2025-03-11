-- Add shared_list_id column to meal_plans table
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS shared_list_id UUID REFERENCES shared_lists(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meal_plans_shared_list_id ON meal_plans(shared_list_id);
