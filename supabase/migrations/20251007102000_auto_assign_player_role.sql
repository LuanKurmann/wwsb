/*
  # Auto-Activate New User Profiles
  
  Sets profile status to 'active' automatically for new registrations.
  This allows self-registration without admin approval.
  
  NOTE: Player role assignment is handled in application code to avoid
  transaction conflicts during auth signup.
*/

-- Function to set profile status to active on creation
CREATE OR REPLACE FUNCTION set_profile_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Set profile status to active for new profiles (no approval needed)
  IF NEW.status IS NULL OR NEW.status = 'pending' THEN
    NEW.status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BEFORE trigger to set status
DROP TRIGGER IF EXISTS before_profile_created_set_active ON profiles;
CREATE TRIGGER before_profile_created_set_active
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_active();

COMMENT ON FUNCTION set_profile_active IS 'Automatically activates new user profiles';

-- Clean up old triggers if they exist
DROP TRIGGER IF EXISTS on_profile_created_assign_player_role ON profiles;
DROP TRIGGER IF EXISTS after_profile_created_assign_role ON profiles;
DROP FUNCTION IF EXISTS auto_assign_player_role();
DROP FUNCTION IF EXISTS assign_player_role();
