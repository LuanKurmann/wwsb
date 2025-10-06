import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Shield } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  display_name: string | null;
  slug: string;
  category: string;
  description: string | null;
  team_photo_url: string | null;
}

export default function AllTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Unsere Teams</h1>
          <p className="text-xl text-blue-100">Eine Übersicht über alle White Wings Mannschaften</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  to={`/teams/${team.slug}`}
                  className="block bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <div className="h-48 w-full bg-gray-200 flex items-center justify-center relative">
                    {team.team_photo_url ? (
                      <img
                        src={team.team_photo_url}
                        alt={team.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Shield className="w-20 h-20 text-gray-400" />
                    )}
                    <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs font-semibold px-3 py-1 m-2 rounded-full">
                        {team.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{team.display_name || team.name}</h2>
                    {team.description ? (
                        <p className="text-sm text-gray-600 line-clamp-3">
                           {team.description}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Keine Beschreibung vorhanden.</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">Keine aktiven Teams gefunden.</p>
          )}
        </div>
      </section>
    </div>
  );
}