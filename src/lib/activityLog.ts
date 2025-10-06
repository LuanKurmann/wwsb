import { supabase } from './supabase';

export type ActivityAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout'
  | 'view'
  | 'export'
  | 'import';

export type EntityType = 
  | 'user' 
  | 'team' 
  | 'player' 
  | 'trainer' 
  | 'sponsor' 
  | 'document' 
  | 'training_schedule'
  | 'board_member'
  | 'message'
  | 'match';

interface LogActivityParams {
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, any>;
}

/**
 * Logs an activity performed by the current user
 */
export async function logActivity({
  action,
  entityType,
  entityId,
  details,
}: LogActivityParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No user found for activity log');
      return;
    }

    const logEntry = {
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
      ip_address: null, // Could be populated from a backend service
      user_agent: navigator.userAgent,
    };

    const { error } = await supabase
      .from('activity_logs')
      .insert([logEntry]);

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Helper function to log create actions
 */
export async function logCreate(entityType: EntityType, entityId: string, details?: Record<string, any>) {
  return logActivity({ action: 'create', entityType, entityId, details });
}

/**
 * Helper function to log update actions
 */
export async function logUpdate(entityType: EntityType, entityId: string, details?: Record<string, any>) {
  return logActivity({ action: 'update', entityType, entityId, details });
}

/**
 * Helper function to log delete actions
 */
export async function logDelete(entityType: EntityType, entityId: string, details?: Record<string, any>) {
  return logActivity({ action: 'delete', entityType, entityId, details });
}

/**
 * Get formatted action label
 */
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    create: 'Erstellt',
    update: 'Aktualisiert',
    delete: 'Gelöscht',
    login: 'Angemeldet',
    logout: 'Abgemeldet',
    view: 'Angesehen',
    export: 'Exportiert',
    import: 'Importiert',
  };
  return labels[action] || action;
}

/**
 * Get formatted entity type label
 */
export function getEntityTypeLabel(entityType: string): string {
  const labels: Record<string, string> = {
    user: 'Benutzer',
    team: 'Team',
    player: 'Spieler',
    trainer: 'Trainer',
    sponsor: 'Sponsor',
    document: 'Dokument',
    training_schedule: 'Trainingsplan',
    board_member: 'Funktionär',
    message: 'Nachricht',
    match: 'Spiel',
  };
  return labels[entityType] || entityType;
}
