/*
  # Add API ID to Teams Table

  1. Changes
    - Add `api_id` column to `teams` table
    - This column will store the Swissunihockey API team ID for fetching games

  2. Notes
    - Column is nullable to allow teams without API integration
    - No unique constraint as teams might share API IDs in some cases
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'api_id'
  ) THEN
    ALTER TABLE teams ADD COLUMN api_id text;
  END IF;
END $$;