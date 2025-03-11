-- Create user_preferences table with multi-tenant support
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select only their own preferences
CREATE POLICY "Users can view their own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own preferences
CREATE POLICY "Users can insert their own preferences" 
  ON user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own preferences
CREATE POLICY "Users can update their own preferences" 
  ON user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own preferences
CREATE POLICY "Users can delete their own preferences" 
  ON user_preferences FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX user_preferences_user_id_idx ON user_preferences(user_id);
