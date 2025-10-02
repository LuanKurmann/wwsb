import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchClubGames, enrichGamesWithLogos, Game } from '../../lib/swissunihockey';
import GamesTabView from '../../components/games/GamesTabView';

interface Match {
  id: string;
  opponent_name: string;
  match_date: string;
  location: string;
  is_home_game: boolean;
}

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
}

interface TrainingSchedule {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string;
  teams: {
    name: string;
    slug: string;
  };
}

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [trainingSchedules, setTrainingSchedules] = useState<TrainingSchedule[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [pastGames, setPastGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  useEffect(() => {
    loadData();
    loadGames();
  }, []);

  async function loadGames() {
    try {
      const { upcoming, past } = await fetchClubGames();
      const upcomingFirst5 = upcoming.slice(0, 5);
      const pastFirst5 = past.slice(0, 5);

      const [enrichedUpcoming, enrichedPast] = await Promise.all([
        enrichGamesWithLogos(upcomingFirst5),
        enrichGamesWithLogos(pastFirst5),
      ]);

      setUpcomingGames(enrichedUpcoming);
      setPastGames(enrichedPast);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoadingGames(false);
    }
  }

  async function loadData() {
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .gte('match_date', new Date().toISOString())
      .order('match_date')
      .limit(5);

    const { data: sponsorsData } = await supabase
      .from('sponsors')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    const { data: schedulesData } = await supabase
      .from('training_schedules')
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        location,
        teams (
          name,
          slug
        )
      `)
      .order('day_of_week');

    if (matchesData) setMatches(matchesData);
    if (sponsorsData) setSponsors(sponsorsData);
    if (schedulesData) setTrainingSchedules(schedulesData);
  }

  return (
    <div>
      <section
        className="relative h-[600px] bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1920,fit=crop/A85wNDxl5XH4bz7w/image8-YbNv3D5o38cnbPP7.jpeg)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-600/70"></div>
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">White Wings</h1>
            <p className="text-xl md:text-2xl mb-2">Unihockey Club Schüpfen - Busswil</p>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Tradition trifft Leidenschaft auf dem Spielfeld
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/teams/u21"
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-blue-50 transition"
              >
                Unsere Teams
              </Link>
              <Link
                to="/kontakt"
                className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-md hover:bg-white hover:text-blue-600 transition"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Instagram</h2>
          <div className="max-w-4xl mx-auto">
            <iframe
              src="https://cdn.lightwidget.com/widgets/147f28eb129c55c69ea5729bdad00795.html"
              scrolling="no"
              allowTransparency={true}
              className="lightwidget-widget w-full border-0 overflow-hidden"
              style={{ width: '100%', border: 0, overflow: 'hidden' }}
            />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Spiele</h2>
          <GamesTabView upcomingGames={upcomingGames} pastGames={pastGames} loading={loadingGames} />
        </div>
      </section>

    

      {sponsors.length > 0 && (
        <section className="py-16 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Unsere Sponsoren</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="flex items-center justify-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition"
                >
                  {sponsor.logo_url ? (
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="max-h-20 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium">{sponsor.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
