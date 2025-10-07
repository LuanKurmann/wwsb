/*
  # Add Swiss Unihockey ID columns
  
  This migration adds swiss_id columns to teams and players tables
  to track which entities are synced from Swiss Unihockey API.
  
  Players and teams with swiss_id should not be manually edited or deleted
  in the admin panel (except for team display_name which remains editable).
*/

-- Add swiss_id to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS swiss_id integer UNIQUE;

-- Add swiss_id to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS swiss_id integer UNIQUE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_swiss_id ON teams(swiss_id);
CREATE INDEX IF NOT EXISTS idx_players_swiss_id ON players(swiss_id);

-- Add comments
COMMENT ON COLUMN teams.swiss_id IS 'Swiss Unihockey API Team ID - teams with this ID are managed by API sync';
COMMENT ON COLUMN players.swiss_id IS 'Swiss Unihockey API Player ID - players with this ID are managed by API sync';
