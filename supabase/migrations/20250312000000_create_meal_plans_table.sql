-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS meal_plans_created_at_idx ON meal_plans(created_at);

-- Add RLS policies
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Policy for selecting own meal plans
CREATE POLICY select_own_meal_plans ON meal_plans
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for inserting own meal plans
CREATE POLICY insert_own_meal_plans ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating own meal plans
CREATE POLICY update_own_meal_plans ON meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for deleting own meal plans
CREATE POLICY delete_own_meal_plans ON meal_plans
  FOR DELETE USING (auth.uid() = user_id);
