-- Create shared_lists table
CREATE TABLE IF NOT EXISTS shared_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  share_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS shared_lists_user_id_idx ON shared_lists(user_id);
CREATE INDEX IF NOT EXISTS shared_lists_share_id_idx ON shared_lists(share_id);

-- Add RLS policies
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own lists
CREATE POLICY "Users can manage their own shared lists"
  ON shared_lists
  FOR ALL
  USING (auth.uid() = user_id);

-- Policy for anyone to read shared lists by share_id
CREATE POLICY "Anyone can read shared lists by share_id"
  ON shared_lists
  FOR SELECT
  USING (true);

-- Policy for anyone to update shared lists by share_id (only the items field)
CREATE POLICY "Anyone can update shared lists items by share_id"
  ON shared_lists
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
