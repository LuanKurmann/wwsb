// Player Login System Types

export interface PlayerInvitation {
  id: string;
  player_id: string;
  email: string;
  token: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerProfile {
  player_id: string;
  preferred_language: 'de' | 'en' | 'fr' | 'it';
  notifications_enabled: boolean;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  allergies: string | null;
  medical_notes: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  player_id: string;
  team_id: string;
  event_type: 'training' | 'match';
  event_id: string | null;
  event_date: string;
  status: 'attending' | 'absent' | 'maybe' | 'unknown';
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerWithAccount {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string | null;
  has_account: boolean;
  invitation_status?: 'pending' | 'expired' | 'none';
  invitation_email?: string;
}
