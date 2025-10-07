import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer' | 'player';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'suspended';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserRoleData {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  roles: {
    name: UserRole;
    description: string | null;
  };
}
