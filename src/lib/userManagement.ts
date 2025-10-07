import { supabase } from './supabase';

// Get Supabase URL from environment or construct from client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || (supabase as any).supabaseUrl;

/**
 * Delete a user account
 * For player accounts, unlinks the player instead of deleting them
 */
export async function deleteUserAccount(userId: string): Promise<{ error: Error | null }> {
  try {
    // Check if user is linked to a player
    const { data: player } = await supabase
      .from('players')
      .select('id, first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle();

    // If user is a player, unlink them (keep player record)
    if (player) {
      // Delete player invitations
      await supabase
        .from('player_invitations')
        .delete()
        .eq('player_id', player.id);

      // Unlink player from user
      const { error: unlinkError } = await supabase
        .from('players')
        .update({ user_id: null })
        .eq('id', player.id);

      if (unlinkError) throw unlinkError;

      console.log(`Unlinked player ${player.first_name} ${player.last_name} from user account`);
    }

    // Delete user roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Delete player profiles if exists
    await supabase
      .from('player_profiles')
      .delete()
      .eq('player_id', player?.id);

    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // Delete from auth.users via Edge Function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete auth user:', errorData);
        // Don't throw - profile is already deleted
      }
    } catch (authError) {
      console.error('Error calling delete-user function:', authError);
      // Don't throw - profile is already deleted
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { error: error as Error };
  }
}

/**
 * Unlink a player from their user account
 * This allows the player to be re-invited
 */
export async function unlinkPlayerAccount(playerId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('players')
      .update({ user_id: null })
      .eq('id', playerId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error unlinking player account:', error);
    return { error: error as Error };
  }
}
