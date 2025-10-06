-- Create activity_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Add comment
COMMENT ON TABLE activity_logs IS 'Logs all admin actions for audit trail';

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only super admins can view logs
CREATE POLICY "Only super admins can view activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      JOIN roles ON user_roles.role_id = roles.id
      WHERE user_roles.user_id = auth.uid()
      AND roles.name = 'super_admin'
    )
  );

-- Policy: Authenticated users can insert their own logs
CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix contact_submissions RLS for admin deletion
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON contact_submissions;

CREATE POLICY "Admins can delete contact submissions"
  ON contact_submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      JOIN roles ON user_roles.role_id = roles.id
      WHERE user_roles.user_id = auth.uid()
      AND roles.name IN ('admin', 'super_admin')
    )
  );
