/*
  # Fix RLS Policy Infinite Recursion with Helper Function

  ## Problem
  Policies were causing infinite recursion by checking user_roles while reading profiles.

  ## Solution
  Create a security definer function that can check roles without triggering RLS recursion.

  ## Changes
  - Create helper function to check user roles
  - Update policies to use the helper function
  - This breaks the recursion chain
*/

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can assign roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can remove roles" ON user_roles;

-- Create a helper function to check if user has a specific role
-- This function runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.user_has_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_has_role.user_id
    AND r.name = role_name::role_type
  );
END;
$$;

-- Create a helper function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.user_has_any_role(user_id uuid, role_names text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_has_any_role.user_id
    AND r.name::text = ANY(role_names)
  );
END;
$$;

-- Recreate profiles policies using the helper function
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin']));

CREATE POLICY "Super admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_has_role(auth.uid(), 'super_admin'))
  WITH CHECK (user_has_role(auth.uid(), 'super_admin'));

-- Recreate user_roles policies using the helper function
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin']));

CREATE POLICY "Super admins can assign roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can remove roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (user_has_role(auth.uid(), 'super_admin'));
