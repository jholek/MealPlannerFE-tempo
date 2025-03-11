-- Create recipes table with multi-tenant support
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select only their own recipes
CREATE POLICY "Users can view their own recipes" 
  ON recipes FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own recipes
CREATE POLICY "Users can insert their own recipes" 
  ON recipes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own recipes
CREATE POLICY "Users can update their own recipes" 
  ON recipes FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own recipes
CREATE POLICY "Users can delete their own recipes" 
  ON recipes FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX recipes_user_id_idx ON recipes(user_id);
