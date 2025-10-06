/*
  # Move Player-Specific Fields to Team-Players Junction Table
  
  This migration moves player-specific fields (jersey_number, position, photo_url)
  from the players table to the team_players junction table.
  
  Rationale:
  - A player can be in multiple teams
  - Each team assignment may have different jersey numbers, positions, and photos
  - This allows proper data modeling for multi-team players
  
  Changes:
  1. Add photo_url to team_players table
  2. Migrate existing photo_url data from players to team_players
  3. Remove jersey_number, position, and photo_url columns from players table
*/

-- Step 1: Add photo_url column to team_players
ALTER TABLE team_players 
ADD COLUMN IF NOT EXISTS photo_url text;

-- Step 2: Migrate existing photo_url data from players to team_players
-- This copies the player's photo to all their team assignments
UPDATE team_players tp
SET photo_url = p.photo_url
FROM players p
WHERE tp.player_id = p.id 
  AND p.photo_url IS NOT NULL
  AND tp.photo_url IS NULL;

-- Step 3: Remove the columns from players table
-- These fields are now only stored in team_players
ALTER TABLE players 
DROP COLUMN IF EXISTS jersey_number,
DROP COLUMN IF EXISTS position,
DROP COLUMN IF EXISTS photo_url;

-- Note: jersey_number and position already exist in team_players from initial schema
-- (or were added in a previous migration based on the current schema)
