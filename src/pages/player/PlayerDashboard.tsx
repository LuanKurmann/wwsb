import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User, Users, Calendar, FileText, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PlayerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPlayerData();
    }
  }, [user]);

  async function loadPlayerData() {
    try {
      // Load player info
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select(`
          *,
          team_players(
            team_id,
            jersey_number,
            position,
            photo_url,
            teams(id, name, display_name, category, team_photo_url)
          )
        `)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (playerError) throw playerError;

      if (!playerData) {
        // No player record found for this user
        setPlayer(null);
        setTeams([]);
        return;
      }

      const teamsData = playerData.team_players?.map((tp: any) => ({
        ...tp.teams,
        jersey_number: tp.jersey_number,
        position: tp.position,
        photo_url: tp.photo_url,
      })) || [];

      setPlayer(playerData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading player data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kein Spielerprofil gefunden</h2>
          <p className="text-gray-600 mb-6">
            Ihr Account ist keinem Spielerprofil zugeordnet.
          </p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Abmelden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {player.first_name[0]}{player.last_name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {player.first_name} {player.last_name}
                </h1>
                <p className="text-sm text-gray-600">Spieler Portal</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {player.is_active ? 'Aktiv' : 'Inaktiv'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Teams</p>
                <p className="text-lg font-semibold text-gray-900">{teams.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nächstes Spiel</p>
                <p className="text-sm font-semibold text-gray-900">Bald verfügbar</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Dokumente</p>
                <p className="text-sm font-semibold text-gray-900">Bald verfügbar</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Teams */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Meine Teams</h2>
          </div>
          <div className="p-6">
            {teams.length === 0 ? (
              <p className="text-gray-600">Sie sind keinem Team zugeordnet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                    {team.team_photo_url && (
                      <img
                        src={team.team_photo_url}
                        alt={team.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {team.display_name || team.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{team.category}</p>
                    <div className="space-y-1 text-sm">
                      {team.jersey_number && (
                        <p className="text-gray-700">
                          <span className="font-medium">Trikotnummer:</span> #{team.jersey_number}
                        </p>
                      )}
                      {team.position && (
                        <p className="text-gray-700 capitalize">
                          <span className="font-medium">Position:</span> {team.position}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coming Soon Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Trainingsplan</h2>
            <p className="text-gray-600">Ihre Trainingszeiten werden hier angezeigt.</p>
            <p className="text-sm text-gray-500 mt-2">🚧 In Entwicklung</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Spielplan</h2>
            <p className="text-gray-600">Kommende Spiele und Ergebnisse.</p>
            <p className="text-sm text-gray-500 mt-2">🚧 In Entwicklung</p>
          </div>
        </div>
      </main>
    </div>
  );
}
