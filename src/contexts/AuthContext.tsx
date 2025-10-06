import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, UserRole, UserRoleData } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userRoles: UserRole[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
          setUserRoles([]);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    setProfile(profileData);

    if (profileData && profileData.status === 'active') {
      // Load user roles from user_roles table
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', userId);

      if (rolesData) {
        const roles = (rolesData as unknown as UserRoleData[]).map(ur => ur.roles.name);
        setUserRoles(roles);
      }
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  function hasRole(role: UserRole): boolean {
    return userRoles.includes(role);
  }

  const isSuperAdmin = userRoles.includes('super_admin');
  const isAdmin = isSuperAdmin || userRoles.includes('admin');
  const canEdit = isAdmin || userRoles.includes('editor');

  const value: AuthContextType = {
    user,
    profile,
    userRoles,
    loading,
    signUp,
    signIn,
    signOut,
    hasRole,
    isAdmin,
    isSuperAdmin,
    canEdit,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
