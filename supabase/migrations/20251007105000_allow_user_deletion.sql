/*
  # Allow User Account Deletion
  
  Allows super admins to delete user accounts.
  For player accounts, the player record is preserved but unlinked.
*/

-- Allow super admins to delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

-- Allow deletion of player_profiles when user is deleted
CREATE POLICY "Super admins can delete player profiles"
  ON player_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

-- Allow super admins to delete user roles (cleanup on deletion)
CREATE POLICY "Super admins can delete user roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

-- Allow super admins to delete player invitations (cleanup on deletion)
CREATE POLICY "Super admins can delete player invitations"
  ON player_invitations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

COMMENT ON POLICY "Super admins can delete profiles" ON profiles IS 'Allows super admins to delete user accounts';
COMMENT ON POLICY "Super admins can delete player profiles" ON player_profiles IS 'Cleanup player profiles when deleting users';
COMMENT ON POLICY "Super admins can delete user roles" ON user_roles IS 'Cleanup user roles when deleting users';
COMMENT ON POLICY "Super admins can delete player invitations" ON player_invitations IS 'Cleanup player invitations when deleting player accounts';
