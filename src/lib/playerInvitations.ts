import { supabase } from './supabase';
import { PlayerInvitation } from '../types/player';

/**
 * Send an invitation to a player to create an account
 */
export async function sendPlayerInvitation(
  playerId: string,
  email: string,
  invitedBy: string
): Promise<{ data: PlayerInvitation | null; error: Error | null }> {
  try {
    // Check if player already has an account
    const { data: player } = await supabase
      .from('players')
      .select('user_id, first_name, last_name')
      .eq('id', playerId)
      .single();

    if (player?.user_id) {
      return { data: null, error: new Error('Spieler hat bereits einen Account') };
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('player_invitations')
      .select('id, email, status')
      .eq('player_id', playerId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvitation) {
      return { data: null, error: new Error('Es existiert bereits eine ausstehende Einladung') };
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('player_invitations')
      .insert({
        player_id: playerId,
        email,
        invited_by: invitedBy,
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Send email with invitation link
    // For now, we just create the invitation in DB
    // Email sending can be implemented with Supabase Edge Functions or external service
    console.log(`Invitation created for ${player?.first_name} ${player?.last_name}`);
    console.log(`Invitation link: ${window.location.origin}/invite/${invitation.token}`);

    return { data: invitation, error: null };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(
  token: string
): Promise<{ data: (PlayerInvitation & { player: any }) | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('player_invitations')
      .select(`
        *,
        player:players(id, first_name, last_name, birth_date)
      `)
      .eq('token', token)
      .single();

    if (error) throw error;

    // Check if expired
    if (data.status === 'expired' || new Date(data.expires_at) < new Date()) {
      await supabase
        .from('player_invitations')
        .update({ status: 'expired' })
        .eq('id', data.id);

      return { data: null, error: new Error('Einladung ist abgelaufen') };
    }

    if (data.status !== 'pending') {
      return { data: null, error: new Error('Einladung wurde bereits verwendet') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting invitation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Accept invitation and create user account
 */
export async function acceptInvitation(
  token: string,
  password: string
): Promise<{ data: any; error: Error | null }> {
  try {
    // Get invitation
    const { data: invitationData, error: invError } = await getInvitationByToken(token);
    if (invError || !invitationData) {
      return { data: null, error: invError || new Error('Einladung nicht gefunden') };
    }

    const invitation = invitationData;
    const player = invitation.player as any;

    // Create user account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password: password,
      options: {
        data: {
          full_name: `${player.first_name} ${player.last_name}`,
          player_id: player.id,
        },
      },
    });

    if (signUpError) throw signUpError;

    if (!authData.user) {
      throw new Error('Benutzer-Erstellung fehlgeschlagen');
    }

    // Link user to player
    const { error: linkError } = await supabase
      .from('players')
      .update({ user_id: authData.user.id })
      .eq('id', player.id);

    if (linkError) throw linkError;

    // Assign player role (trigger only sets status, not role)
    const { data: playerRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'player')
      .single();

    if (playerRole) {
      await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role_id: playerRole.id,
      });
    }
    
    // Create player profile for the linked player (if not exists)
    const { data: existingProfile } = await supabase
      .from('player_profiles')
      .select('player_id')
      .eq('player_id', player.id)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileError } = await supabase.from('player_profiles').insert({
        player_id: player.id,
      });

      if (profileError && profileError.code !== '23505') {
        // Ignore duplicate key errors (profile already exists)
        console.error('Error creating player profile:', profileError);
      }
    }

    // Mark invitation as accepted
    await supabase
      .from('player_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    return { data: authData, error: null };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(invitationId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('player_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return { error: error as Error };
  }
}

/**
 * Resend invitation (creates new token with extended expiry)
 */
export async function resendInvitation(
  playerId: string
): Promise<{ data: PlayerInvitation | null; error: Error | null }> {
  try {
    // Cancel old invitations
    await supabase
      .from('player_invitations')
      .update({ status: 'cancelled' })
      .eq('player_id', playerId)
      .in('status', ['pending', 'expired']);

    // Get player email from last invitation
    const { data: lastInvitation } = await supabase
      .from('player_invitations')
      .select('email, invited_by')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastInvitation) {
      return { data: null, error: new Error('Keine vorherige Einladung gefunden') };
    }

    // Create new invitation
    return await sendPlayerInvitation(playerId, lastInvitation.email, lastInvitation.invited_by);
  } catch (error) {
    console.error('Error resending invitation:', error);
    return { data: null, error: error as Error };
  }
}
