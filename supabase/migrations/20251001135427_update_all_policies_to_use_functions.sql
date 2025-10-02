/*
  # Update All RLS Policies to Use Helper Functions

  ## Overview
  Update all remaining table policies to use the helper functions instead of direct EXISTS queries.
  This ensures consistency and prevents any potential recursion issues.

  ## Changes
  - Update policies for teams, players, trainers, sponsors, documents, pages, and other tables
  - Use user_has_any_role() helper function for cleaner, non-recursive checks
*/

-- Drop and recreate policies for teams
DROP POLICY IF EXISTS "Editors can manage teams" ON teams;

CREATE POLICY "Editors can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for players
DROP POLICY IF EXISTS "Editors can manage players" ON players;

CREATE POLICY "Editors can manage players"
  ON players FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for team_players
DROP POLICY IF EXISTS "Editors can manage team players" ON team_players;

CREATE POLICY "Editors can manage team players"
  ON team_players FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for trainers
DROP POLICY IF EXISTS "Editors can manage trainers" ON trainers;

CREATE POLICY "Editors can manage trainers"
  ON trainers FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for team_trainers
DROP POLICY IF EXISTS "Editors can manage team trainers" ON team_trainers;

CREATE POLICY "Editors can manage team trainers"
  ON team_trainers FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for training_schedules
DROP POLICY IF EXISTS "Editors can manage training schedules" ON training_schedules;

CREATE POLICY "Editors can manage training schedules"
  ON training_schedules FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for sponsors
DROP POLICY IF EXISTS "Editors can manage sponsors" ON sponsors;

CREATE POLICY "Editors can manage sponsors"
  ON sponsors FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for document_categories
DROP POLICY IF EXISTS "Editors can manage document categories" ON document_categories;

CREATE POLICY "Editors can manage document categories"
  ON document_categories FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for documents
DROP POLICY IF EXISTS "Editors can manage documents" ON documents;

CREATE POLICY "Editors can manage documents"
  ON documents FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for pages
DROP POLICY IF EXISTS "Editors can manage pages" ON pages;

CREATE POLICY "Editors can manage pages"
  ON pages FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for contact_submissions
DROP POLICY IF EXISTS "Admins can view contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON contact_submissions;

CREATE POLICY "Admins can view contact submissions"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin']));

CREATE POLICY "Admins can update contact submissions"
  ON contact_submissions FOR UPDATE
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin']));

-- Drop and recreate policies for matches
DROP POLICY IF EXISTS "Editors can manage matches" ON matches;

CREATE POLICY "Editors can manage matches"
  ON matches FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));

-- Drop and recreate policies for standings
DROP POLICY IF EXISTS "Editors can manage standings" ON standings;

CREATE POLICY "Editors can manage standings"
  ON standings FOR ALL
  TO authenticated
  USING (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']))
  WITH CHECK (user_has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'editor']));
