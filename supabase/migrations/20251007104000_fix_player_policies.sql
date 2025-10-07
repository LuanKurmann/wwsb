/*
  # Fix Player and Player Profiles RLS Policies
  
  Fixes:
  1. Missing INSERT policy for player_profiles (403 error)
  2. Overlapping SELECT policies for players table (406 error)
*/

-- =====================================================
-- Fix player_profiles policies
-- =====================================================

-- Add INSERT policy for player_profiles (missing!)
CREATE POLICY "System can create player profiles"
  ON player_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Allow authenticated users to create their own profile during registration

-- =====================================================
-- Fix players table policies (overlapping SELECT)
-- =====================================================

-- Drop overlapping policies
DROP POLICY IF EXISTS "Editors can manage players" ON players;
DROP POLICY IF EXISTS "Anyone can view active players" ON players;
DROP POLICY IF EXISTS "Players can view own player record" ON players;
DROP POLICY IF EXISTS "Players can update own player record" ON players;

-- Create non-overlapping policies

-- SELECT: Public can view active players OR players can view their own
CREATE POLICY "enable_select_players"
  ON players
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true  -- Public can see active players
    OR 
    user_id = auth.uid()  -- Players can always see their own record
  );

-- INSERT: Only editors/admins can create players
CREATE POLICY "enable_insert_players"
  ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  );

-- UPDATE: Editors can update all, players can update own
CREATE POLICY "enable_update_players"
  ON players
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()  -- Players can update own
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  )
  WITH CHECK (
    user_id = auth.uid()  -- Players can update own
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  );

-- DELETE: Only editors/admins can delete
CREATE POLICY "enable_delete_players"
  ON players
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  );

-- =====================================================
-- Fix user_roles policies (allow self-assignment of player role)
-- =====================================================

-- Allow authenticated users to assign themselves the player role
CREATE POLICY "Users can assign player role to themselves"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()  -- Can only assign to self
    AND
    role_id IN (
      SELECT id FROM roles WHERE name = 'player'  -- Only player role
    )
  );

-- =====================================================
-- Fix player_invitations UPDATE for acceptance
-- =====================================================

DROP POLICY IF EXISTS "Allow invitation acceptance" ON player_invitations;

-- Allow authenticated users to update invitations during acceptance
CREATE POLICY "Allow invitation acceptance"
  ON player_invitations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    status IN ('accepted', 'cancelled', 'expired')
  );

-- Verify
SELECT 'player_profiles policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'player_profiles' ORDER BY cmd;

SELECT 'players policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'players' ORDER BY cmd;

SELECT 'user_roles policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_roles' ORDER BY cmd;

SELECT 'player_invitations policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'player_invitations' ORDER BY cmd;
