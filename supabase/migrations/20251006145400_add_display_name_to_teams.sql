-- Add display_name column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add comment
COMMENT ON COLUMN teams.display_name IS 'Optional display name for the team. If NULL, the regular name is shown instead.';
