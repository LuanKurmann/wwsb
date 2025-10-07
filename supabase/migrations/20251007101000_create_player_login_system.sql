/*
  # Player Login System - Part 1: Database Schema
  
  This migration creates the infrastructure for player login accounts:
  1. Links players to user accounts
  2. Creates invitation system
  3. Adds player profile extensions
  4. Updates role system for player role
  5. Implements attendance tracking (optional)
*/

-- =====================================================
-- STEP 1: Add player role to enum
-- =====================================================

-- Add player to role_type enum
ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'player';

-- =====================================================
-- STEP 2: Link players to user accounts
-- =====================================================

-- Add user_id to players table (nullable - not all players have accounts)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);

COMMENT ON COLUMN players.user_id IS 'Link to user account if player has login access';

-- =====================================================
-- STEP 3: Player Invitations System
-- =====================================================

CREATE TABLE IF NOT EXISTS player_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid REFERENCES profiles(id) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_id, email)
);

CREATE INDEX IF NOT EXISTS idx_player_invitations_token ON player_invitations(token);
CREATE INDEX IF NOT EXISTS idx_player_invitations_player_id ON player_invitations(player_id);
CREATE INDEX IF NOT EXISTS idx_player_invitations_status ON player_invitations(status);

COMMENT ON TABLE player_invitations IS 'Manages player account invitations sent by admins';

-- =====================================================
-- STEP 4: Player Profile Extensions
-- =====================================================

CREATE TABLE IF NOT EXISTS player_profiles (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  preferred_language text DEFAULT 'de' CHECK (preferred_language IN ('de', 'en', 'fr', 'it')),
  notifications_enabled boolean DEFAULT true,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  allergies text,
  medical_notes text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE player_profiles IS 'Extended player profile information managed by the player';

-- =====================================================
-- STEP 5: Attendance Tracking (Optional)
-- =====================================================

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('training', 'match')),
  event_id uuid, -- Can reference matches table or training_schedules
  event_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('attending', 'absent', 'maybe', 'unknown')),
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_id, event_type, event_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_player_id ON attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_attendance_team_id ON attendance(team_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_date ON attendance(event_date);

COMMENT ON TABLE attendance IS 'Tracks player attendance for trainings and matches';

-- =====================================================
-- STEP 6: RLS Policies for Player Access
-- =====================================================

-- Enable RLS
ALTER TABLE player_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Player Invitations Policies
CREATE POLICY "Admins can view all invitations"
  ON player_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  );

CREATE POLICY "Admins can create invitations"
  ON player_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  );

CREATE POLICY "Admins can update invitations"
  ON player_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  );

CREATE POLICY "Anyone can view invitation by token"
  ON player_invitations FOR SELECT
  TO anon, authenticated
  USING (true); -- Token validation happens in application logic

-- Player Profiles Policies
CREATE POLICY "Players can view own profile"
  ON player_profiles FOR SELECT
  TO authenticated
  USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Players can update own profile"
  ON player_profiles FOR UPDATE
  TO authenticated
  USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all player profiles"
  ON player_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  );

-- Attendance Policies
CREATE POLICY "Players can manage own attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  );

-- Update players table policies for player role
CREATE POLICY "Players can view own player record"
  ON players FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Players can update own player record"
  ON players FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STEP 7: Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_player_invitations_updated_at
  BEFORE UPDATE ON player_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 8: Insert player role
-- =====================================================

INSERT INTO roles (name, description) VALUES
  ('player', 'Player with access to own profile and team information')
ON CONFLICT (name) DO NOTHING;
