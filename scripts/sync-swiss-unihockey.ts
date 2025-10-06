import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Lade .env Datei
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const CLUB_ID = 805;
const API_BASE = 'https://unihockey.swiss/api';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SwissTeam {
  TeamID: number;
  TeamName: string;
  TeamAlias: string;
  TeamBanner?: {
    PictureURLimage800?: string;
  };
}

interface SwissPlayer {
  PlayerID: number;
  TeamPlayerID: number;
  TeamID: number;
  FirstName: string;
  LastName: string;
  ShirtNumber: number | null;
  Position: string;
  ThumbnailURL?: string;
}

async function syncTeams() {
  console.log('📥 Hole Teams von Swiss Unihockey API...');
  
  const response = await fetch(`${API_BASE}/clubapi/initclubteams?ClubID=${CLUB_ID}`);
  const data = await response.json();
  const apiTeams: SwissTeam[] = data.Teams || [];
  
  console.log(`✅ ${apiTeams.length} Teams gefunden`);
  
  // Hole alle Teams aus DB mit swiss_id (inkl. display_name zum Schutz)
  const { data: dbTeams, error: dbError } = await supabase
    .from('teams')
    .select('id, swiss_id, name, display_name')
    .not('swiss_id', 'is', null);
  
  if (dbError) throw dbError;
  
  const dbTeamMap = new Map(dbTeams?.map(t => [t.swiss_id, t]) || []);
  const apiTeamIds = new Set(apiTeams.map(t => t.TeamID));
  
  let created = 0, updated = 0, deleted = 0;
  
  // INSERT oder UPDATE Teams
  for (const apiTeam of apiTeams) {
    const dbTeam = dbTeamMap.get(apiTeam.TeamID);
    
    const teamData = {
      swiss_id: apiTeam.TeamID,
      name: apiTeam.TeamName,
      slug: apiTeam.TeamAlias.toLowerCase().replace(/\s+/g, '-'),
      team_photo_url: apiTeam.TeamBanner?.PictureURLimage800 || null,
      is_active: true,
      // WICHTIG: display_name wird NICHT überschrieben, bleibt bestehen
    };
    
    if (dbTeam) {
      // UPDATE - display_name wird bewusst NICHT im Update enthalten, um es zu schützen
      const { error } = await supabase
        .from('teams')
        .update(teamData)
        .eq('id', dbTeam.id);
      
      if (error) {
        console.error(`❌ Fehler beim Update von Team ${apiTeam.TeamName}:`, error);
      } else {
        updated++;
        console.log(`🔄 Team aktualisiert: ${apiTeam.TeamName}`);
      }
    } else {
      // INSERT
      const { error } = await supabase
        .from('teams')
        .insert(teamData);
      
      if (error) {
        console.error(`❌ Fehler beim Erstellen von Team ${apiTeam.TeamName}:`, error);
      } else {
        created++;
        console.log(`➕ Team erstellt: ${apiTeam.TeamName}`);
      }
    }
  }
  
  // DELETE Teams die nicht mehr in der API sind
  for (const [swissId, dbTeam] of dbTeamMap) {
    if (!apiTeamIds.has(swissId)) {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', dbTeam.id);
      
      if (error) {
        console.error(`❌ Fehler beim Löschen von Team ${dbTeam.name}:`, error);
      } else {
        deleted++;
        console.log(`🗑️  Team gelöscht: ${dbTeam.name}`);
      }
    }
  }
  
  console.log(`\n📊 Teams: ${created} erstellt, ${updated} aktualisiert, ${deleted} gelöscht\n`);
}

async function syncPlayersForTeam(teamId: string, swissTeamId: number) {
  console.log(`\n📥 Hole Spieler für Team ${swissTeamId}...`);
  
  const response = await fetch(`${API_BASE}/teamapi/initplayersadminvc?TeamID=${swissTeamId}`);
  const apiPlayers: SwissPlayer[] = await response.json();
  
  console.log(`✅ ${apiPlayers.length} Spieler gefunden`);
  
  // Hole alle Spieler aus DB mit swiss_id
  const { data: dbPlayers, error: dbError } = await supabase
    .from('players')
    .select('id, swiss_id, first_name, last_name')
    .not('swiss_id', 'is', null);
  
  if (dbError) throw dbError;
  
  const dbPlayerMap = new Map(dbPlayers?.map(p => [p.swiss_id, p]) || []);
  
  // Hole team_players für dieses Team
  const { data: teamPlayers, error: tpError } = await supabase
    .from('team_players')
    .select('player_id, team_id, players!inner(swiss_id)')
    .eq('team_id', teamId)
    .not('players.swiss_id', 'is', null);
  
  if (tpError) throw tpError;
  
  const currentTeamPlayerIds = new Set(
    teamPlayers?.map(tp => (tp.players as any).swiss_id) || []
  );
  const apiPlayerIds = new Set(apiPlayers.map(p => p.PlayerID));
  
  let created = 0, updated = 0, deleted = 0;
  
  // INSERT oder UPDATE Spieler
  for (const apiPlayer of apiPlayers) {
    const dbPlayer = dbPlayerMap.get(apiPlayer.PlayerID);
    
    const playerData = {
      swiss_id: apiPlayer.PlayerID,
      first_name: apiPlayer.FirstName,
      last_name: apiPlayer.LastName,
      is_active: true,
    };
    
    let playerId: string;
    
    if (dbPlayer) {
      // UPDATE Player
      const { error } = await supabase
        .from('players')
        .update(playerData)
        .eq('id', dbPlayer.id);
      
      if (error) {
        console.error(`❌ Fehler beim Update von Spieler ${apiPlayer.FirstName} ${apiPlayer.LastName}:`, error);
        continue;
      }
      
      playerId = dbPlayer.id;
      updated++;
    } else {
      // INSERT Player
      const { data: newPlayer, error } = await supabase
        .from('players')
        .insert(playerData)
        .select()
        .single();
      
      if (error || !newPlayer) {
        console.error(`❌ Fehler beim Erstellen von Spieler ${apiPlayer.FirstName} ${apiPlayer.LastName}:`, error);
        continue;
      }
      
      playerId = newPlayer.id;
      created++;
      console.log(`➕ Spieler erstellt: ${apiPlayer.FirstName} ${apiPlayer.LastName}`);
    }
    
    // Sync team_players Zuordnung
    const position = apiPlayer.Position?.toLowerCase() === 'goalkeeper' ? 'goalkeeper' 
                    : apiPlayer.Position?.toLowerCase() === 'defender' ? 'defender'
                    : apiPlayer.Position?.toLowerCase() === 'forward' ? 'forward'
                    : null;
    
    const teamPlayerData = {
      player_id: playerId,
      team_id: teamId,
      jersey_number: apiPlayer.ShirtNumber,
      position: position,
      photo_url: apiPlayer.ThumbnailURL?.includes('defaultplayeravatar') 
                ? null 
                : apiPlayer.ThumbnailURL || null,
    };
    
    // Check if team_player assignment exists
    const { data: existingTP } = await supabase
      .from('team_players')
      .select('*')
      .eq('player_id', playerId)
      .eq('team_id', teamId)
      .single();
    
    if (existingTP) {
      // UPDATE
      await supabase
        .from('team_players')
        .update(teamPlayerData)
        .eq('player_id', playerId)
        .eq('team_id', teamId);
    } else {
      // INSERT
      await supabase
        .from('team_players')
        .insert(teamPlayerData);
    }
  }
  
  // DELETE Spieler die nicht mehr in diesem Team sind
  for (const tp of teamPlayers || []) {
    const swissId = (tp.players as any).swiss_id;
    if (!apiPlayerIds.has(swissId)) {
      // Entferne nur die team_players Zuordnung
      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('player_id', tp.player_id)
        .eq('team_id', teamId);
      
      if (error) {
        console.error(`❌ Fehler beim Löschen der Team-Zuordnung:`, error);
      } else {
        deleted++;
        console.log(`🗑️  Team-Zuordnung entfernt für Spieler-ID: ${tp.player_id}`);
      }
      
      // Optional: Lösche Spieler komplett wenn er in keinem Team mehr ist
      const { data: otherTeams } = await supabase
        .from('team_players')
        .select('player_id')
        .eq('player_id', tp.player_id);
      
      if (!otherTeams || otherTeams.length === 0) {
        await supabase
          .from('players')
          .delete()
          .eq('id', tp.player_id);
        
        console.log(`🗑️  Spieler komplett gelöscht (keine Teams mehr)`);
      }
    }
  }
  
  console.log(`📊 Spieler: ${created} erstellt, ${updated} aktualisiert, ${deleted} entfernt`);
}

async function syncPlayers() {
  console.log('\n🔄 Synchronisiere Spieler...\n');
  
  // Hole alle Teams mit swiss_id
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, swiss_id, name')
    .not('swiss_id', 'is', null);
  
  if (error) throw error;
  
  for (const team of teams || []) {
    await syncPlayersForTeam(team.id, team.swiss_id);
  }
}

async function main() {
  console.log('🚀 Starte Swiss Unihockey Synchronisation...\n');
  console.log(`📍 Club ID: ${CLUB_ID}\n`);
  
  try {
    await syncTeams();
    await syncPlayers();
    
    console.log('\n✅ Synchronisation erfolgreich abgeschlossen!');
  } catch (error) {
    console.error('\n❌ Fehler bei der Synchronisation:', error);
    process.exit(1);
  }
}

main();
