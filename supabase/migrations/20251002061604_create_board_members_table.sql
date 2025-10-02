/*
  # Create Board Members Table

  1. New Tables
    - `board_members`
      - `id` (uuid, primary key)
      - `first_name` (text) - First name of board member
      - `last_name` (text) - Last name of board member
      - `position` (text) - Position/role in the organization
      - `category` (text) - Category (Vorstand, Besitzer/Nebenämter, Grossfeld)
      - `email` (text) - Contact email
      - `phone` (text) - Contact phone
      - `photo_url` (text) - Photo URL
      - `display_order` (integer) - Order for display
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `board_members` table
    - Add policy for public read access
    - Add policies for authenticated users to manage
*/

CREATE TABLE IF NOT EXISTS board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  position text NOT NULL,
  category text NOT NULL CHECK (category IN ('Vorstand', 'Besitzer/Nebenämter', 'Grossfeld')),
  email text,
  phone text,
  photo_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active board members"
  ON board_members FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all board members"
  ON board_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert board members"
  ON board_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update board members"
  ON board_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete board members"
  ON board_members FOR DELETE
  TO authenticated
  USING (true);