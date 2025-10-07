/*
  # Fix Player Invitations RLS Policies
  
  Fixes 406 errors by splitting overlapping policies.
  Problem: FOR ALL policy overlaps with FOR SELECT policy for authenticated users.
  Solution: Separate policies for each operation (SELECT, INSERT, UPDATE, DELETE).
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "admins_manage_invitations" ON player_invitations;
DROP POLICY IF EXISTS "anyone_view_invitations" ON player_invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON player_invitations;
DROP POLICY IF EXISTS "Anyone can view their own invitation by token" ON player_invitations;
DROP POLICY IF EXISTS "Admins can view all invitations" ON player_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON player_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON player_invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON player_invitations;

-- Create non-overlapping policies

-- SELECT: Everyone can read (needed for token validation and admin listing)
CREATE POLICY "enable_select_for_all"
  ON player_invitations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT: Only admins can create invitations
CREATE POLICY "enable_insert_for_admins"
  ON player_invitations
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

-- UPDATE: Only admins can update invitations
CREATE POLICY "enable_update_for_admins"
  ON player_invitations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'editor')
    )
  );

-- DELETE: Only admins can delete invitations
CREATE POLICY "enable_delete_for_admins"
  ON player_invitations
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

-- Verify policies
SELECT 
    policyname,
    cmd,
    roles::text,
    permissive
FROM pg_policies 
WHERE tablename = 'player_invitations'
ORDER BY cmd, policyname;
