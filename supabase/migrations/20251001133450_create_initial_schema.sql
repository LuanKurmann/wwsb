/*
  # White Wings Hockey Club - Initial Database Schema

  ## Overview
  Complete database schema for the White Wings hockey club website with admin CMS functionality.
  Excludes Kinderunihockey (children's hockey) sections as per requirements.

  ## Tables Created

  ### Authentication & User Management
  - `profiles` - Extended user profile information
  - `user_roles` - Role assignments for users
  - `roles` - Available system roles (super_admin, admin, editor, viewer)

  ### Teams Management
  - `teams` - Hockey teams (U21, seniors, etc.)
  - `team_players` - Junction table linking players to teams

  ### Players Management
  - `players` - Player information (name, number, position, etc.)

  ### Trainers/Coaches Management
  - `trainers` - Trainer/coach information
  - `team_trainers` - Junction table linking trainers to teams

  ### Training Schedule
  - `training_schedules` - Training times and locations for teams

  ### Sponsors Management
  - `sponsors` - Sponsor information and logos

  ### Documents Management
  - `document_categories` - Categories for organizing documents
  - `documents` - Downloadable documents and files

  ### Content Management
  - `pages` - CMS pages (history, vision, etc.)
  - `contact_submissions` - Contact form submissions

  ### Future API Integration (Placeholders)
  - `matches` - Match fixtures and results (will be populated via API)
  - `standings` - Team standings (will be populated via API)

  ## Security
  - RLS enabled on all tables
  - Policies restrict access based on authentication and roles
  - Public read access for public-facing content
  - Write access restricted to authenticated users with appropriate roles
*/

-- Create enum types
CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
CREATE TYPE role_type AS ENUM ('super_admin', 'admin', 'editor', 'viewer');
CREATE TYPE player_position AS ENUM ('goalkeeper', 'defender', 'forward');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'completed', 'postponed', 'cancelled');

-- =====================================================
-- AUTHENTICATION & USER MANAGEMENT
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  status user_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name role_type UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES profiles(id),
  UNIQUE(user_id, role_id)
);

-- =====================================================
-- TEAMS MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL,
  description text,
  team_photo_url text,
  contact_email text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- PLAYERS MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  jersey_number int,
  position player_position,
  photo_url text,
  birth_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Team players junction table
CREATE TABLE IF NOT EXISTS team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  season text NOT NULL,
  is_captain boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, player_id, season)
);

-- =====================================================
-- TRAINERS/COACHES MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL,
  photo_url text,
  email text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Team trainers junction table
CREATE TABLE IF NOT EXISTS team_trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
  season text NOT NULL,
  is_head_coach boolean DEFAULT false,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(team_id, trainer_id, season)
);

-- =====================================================
-- TRAINING SCHEDULES
-- =====================================================

CREATE TABLE IF NOT EXISTS training_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text NOT NULL,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SPONSORS MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  tier text DEFAULT 'standard',
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- DOCUMENTS MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES document_categories(id) ON DELETE SET NULL,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  category_id uuid REFERENCES document_categories(id) ON DELETE SET NULL,
  display_order int DEFAULT 0,
  download_count int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- CONTENT MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text,
  meta_description text,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  email text,
  is_read boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now()
);

-- =====================================================
-- MATCHES & STANDINGS (API Integration Placeholders)
-- =====================================================

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  opponent_name text NOT NULL,
  opponent_logo_url text,
  match_date timestamptz NOT NULL,
  location text,
  home_score int,
  away_score int,
  is_home_game boolean DEFAULT true,
  status match_status DEFAULT 'scheduled',
  api_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  season text NOT NULL,
  league text NOT NULL,
  position int,
  games_played int DEFAULT 0,
  wins int DEFAULT 0,
  draws int DEFAULT 0,
  losses int DEFAULT 0,
  goals_for int DEFAULT 0,
  goals_against int DEFAULT 0,
  points int DEFAULT 0,
  api_id text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, season, league)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_season ON team_players(season);
CREATE INDEX IF NOT EXISTS idx_team_trainers_team_id ON team_trainers(team_id);
CREATE INDEX IF NOT EXISTS idx_training_schedules_team_id ON training_schedules(team_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_standings_team_season ON standings(team_id, season);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
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
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  );

-- Roles policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Super admins can assign roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

CREATE POLICY "Super admins can remove roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

-- Public content policies (teams, players, etc.)
CREATE POLICY "Anyone can view active teams"
  ON teams FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Editors can manage teams"
  ON teams FOR ALL
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

CREATE POLICY "Anyone can view active players"
  ON players FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Editors can manage players"
  ON players FOR ALL
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

CREATE POLICY "Anyone can view team players"
  ON team_players FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Editors can manage team players"
  ON team_players FOR ALL
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

CREATE POLICY "Anyone can view active trainers"
  ON trainers FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Editors can manage trainers"
  ON trainers FOR ALL
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

CREATE POLICY "Anyone can view team trainers"
  ON team_trainers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Editors can manage team trainers"
  ON team_trainers FOR ALL
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

CREATE POLICY "Anyone can view active training schedules"
  ON training_schedules FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Editors can manage training schedules"
  ON training_schedules FOR ALL
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

CREATE POLICY "Anyone can view active sponsors"
  ON sponsors FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Editors can manage sponsors"
  ON sponsors FOR ALL
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

CREATE POLICY "Anyone can view active document categories"
  ON document_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Editors can manage document categories"
  ON document_categories FOR ALL
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

CREATE POLICY "Anyone can view active documents"
  ON documents FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Editors can manage documents"
  ON documents FOR ALL
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

CREATE POLICY "Anyone can view published pages"
  ON pages FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Editors can manage pages"
  ON pages FOR ALL
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

CREATE POLICY "Anyone can submit contact forms"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view contact submissions"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update contact submissions"
  ON contact_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Anyone can view matches"
  ON matches FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Editors can manage matches"
  ON matches FOR ALL
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

CREATE POLICY "Anyone can view standings"
  ON standings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Editors can manage standings"
  ON standings FOR ALL
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

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_schedules_updated_at BEFORE UPDATE ON training_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON sponsors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Full system access with user management'),
  ('admin', 'Administrative access to CMS'),
  ('editor', 'Can create and edit content'),
  ('viewer', 'Read-only access')
ON CONFLICT (name) DO NOTHING;