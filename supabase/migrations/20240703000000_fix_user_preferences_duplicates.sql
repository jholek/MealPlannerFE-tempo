-- First, create a temporary table to hold the most recent preference for each user
CREATE TEMP TABLE latest_preferences AS
SELECT DISTINCT ON (user_id) 
  id,
  user_id,
  data,
  created_at,
  updated_at
FROM user_preferences
ORDER BY user_id, updated_at DESC;

-- Delete all preferences
DELETE FROM user_preferences;

-- Re-insert only the latest preference for each user
INSERT INTO user_preferences
SELECT * FROM latest_preferences;

-- Add a unique constraint to prevent duplicates in the future
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);

-- Drop the temporary table
DROP TABLE latest_preferences;
