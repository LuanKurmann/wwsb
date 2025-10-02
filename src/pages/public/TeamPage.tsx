import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User, Calendar, MapPin, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchTeamGames, enrichGamesWithLogos, fetchTeamRanking, Game, RankingData } from '../../lib/swissunihockey';
import GamesTabView from '../../components/games/GamesTabView';
import RankingTable from '../../components/games/RankingTable';

interface Team {
  id: string;
  name: string;
  description: string | null;
  team_photo_url: string | null;
  api_id: string | null;
}

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  position: string | null;
  photo_url: string | null;
}

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Match {
  id: string;
  opponent_name: string;
  match_date: string;
  location: string;
  is_home_game: boolean;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

interface TrainingSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
  notes: string | null;
}

const WEEKDAYS = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag'
];

export default function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [trainingSchedules, setTrainingSchedules] = useState<TrainingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [pastGames, setPastGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loadingRanking, setLoadingRanking] = useState(true);

  useEffect(() => {
    if (slug) {
      loadTeamData();
    }
  }, [slug]);

  useEffect(() => {
    if (team?.api_id) {
      loadGames();
      loadRanking();
    }
  }, [team]);

  async function loadGames() {
    if (!team?.api_id) return;

    try {
      setLoadingGames(true);
      const { upcoming, past } = await fetchTeamGames(team.api_id);
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

  async function loadRanking() {
    if (!team?.api_id) return;

    try {
      setLoadingRanking(true);
      const ranking = await fetchTeamRanking(team.api_id);
      setRankingData(ranking);
    } catch (error) {
      console.error('Error loading ranking:', error);
    } finally {
      setLoadingRanking(false);
    }
  }

  async function loadTeamData() {
    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!teamData) {
        setLoading(false);
        return;
      }

      setTeam(teamData);

      const [playersRes, trainersRes, matchesRes, schedulesRes] = await Promise.all([
        supabase
          .from('team_players')
          .select('*, players(*)')
          .eq('team_id', teamData.id)
          .eq('season', '2024/2025'),
        supabase
          .from('team_trainers')
          .select('*, trainers(*)')
          .eq('team_id', teamData.id)
          .eq('season', '2024/2025'),
        supabase
          .from('matches')
          .select('*')
          .eq('team_id', teamData.id)
          .order('match_date'),
        supabase
          .from('training_schedules')
          .select('*')
          .eq('team_id', teamData.id)
          .eq('is_active', true)
          .order('day_of_week'),
      ]);

      if (playersRes.data) {
        setPlayers(playersRes.data.map((tp: any) => tp.players));
      }

      if (trainersRes.data) {
        setTrainers(trainersRes.data.map((tt: any) => tt.trainers));
      }

      if (matchesRes.data) {
        setMatches(matchesRes.data);
      }

      if (schedulesRes.data) {
        setTrainingSchedules(schedulesRes.data);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Team not found</h2>
          <p className="text-gray-600">The team you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">{team.name}</h1>
          {team.description && <p className="text-xl">{team.description}</p>}
        </div>
      </section>

      {team.team_photo_url && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <img
              src={team.team_photo_url}
              alt={team.name}
              className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
            />
          </div>
        </section>
      )}

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Unser Kader</h2>

          {players.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {players.map((player) => (
                <div key={player.id} className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="w-20 h-20 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={`${player.first_name} ${player.last_name}`}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">
                    {player.first_name} {player.last_name}
                  </p>
                  {player.jersey_number && (
                    <p className="text-sm text-gray-500">#{player.jersey_number}</p>
                  )}
                  {player.position && (
                    <p className="text-xs text-gray-400 capitalize">{player.position}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No players assigned to this team yet.</p>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Trainerteam</h3>
              {trainers.length > 0 ? (
                <div className="space-y-4">
                  {trainers.map((trainer) => (
                    <div key={trainer.id} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-900">
                        {trainer.first_name} {trainer.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{trainer.role}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No trainers assigned yet.</p>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Trainingszeiten</h3>
              {trainingSchedules.length > 0 ? (
                <div className="space-y-3">
                  {trainingSchedules.map((schedule) => (
                    <div key={schedule.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                        <p className="font-semibold text-gray-900">{WEEKDAYS[schedule.day_of_week]}</p>
                      </div>
                      <div className="flex items-center mb-1 ml-7">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        <p className="text-sm text-gray-700">{schedule.start_time} - {schedule.end_time}</p>
                      </div>
                      <div className="flex items-center ml-7">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        <p className="text-sm text-gray-500">{schedule.location}</p>
                      </div>
                      {schedule.notes && (
                        <p className="text-sm text-gray-600 mt-2 ml-7">{schedule.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No training schedules set yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Spiele</h2>

          {team?.api_id ? (
            <GamesTabView upcomingGames={upcomingGames} pastGames={pastGames} loading={loadingGames} />
          ) : (
            <p className="text-gray-500 text-center py-8">Keine API ID konfiguriert</p>
          )}
        </div>
      </section>

      <section className="py-16 bg-gray-50 hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Spiele (Old)</h2>

          {loadingGames ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : team?.api_id ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 hidden">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Kommende Spiele</h3>
                {upcomingGames.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingGames.map((game, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {game.date} um {game.time}
                            </div>
                            <div className="flex items-center mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {game.locationLink ? (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${game.locationLink.y},${game.locationLink.x}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {game.location}
                                </a>
                              ) : (
                                game.location
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${game.homeHighlighted ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                            {game.homeTeam}
                          </span>
                          <span className="text-gray-500 mx-2">vs</span>
                          <span className={`text-sm font-medium ${game.awayHighlighted ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                            {game.awayTeam}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Keine kommenden Spiele</p>
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Vergangene Spiele</h3>
                {pastGames.length > 0 ? (
                  <div className="space-y-4">
                    {pastGames.map((game, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {game.date} um {game.time}
                            </div>
                            <div className="flex items-center mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {game.location}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${game.homeHighlighted ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                            {game.homeTeam}
                          </span>
                          <span className="text-lg font-bold text-gray-900 mx-2">{game.result}</span>
                          <span className={`text-sm font-medium ${game.awayHighlighted ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                            {game.awayTeam}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Keine vergangenen Spiele</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Keine API ID konfiguriert</p>
          )}
        </div>
      </section>

      {team?.api_id && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Rangliste</h2>
            {loadingRanking ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : rankingData ? (
              <RankingTable rankingData={rankingData} />
            ) : (
              <p className="text-gray-500 text-center py-8">Keine Rangliste verfügbar</p>
            )}
          </div>
        </section>
      )}

      <section className="py-16 bg-gray-100 hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Alte Spielplan (Datenbank)</h2>

          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match) => (
                <div key={match.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">
                          {new Date(match.match_date).toLocaleDateString('de-CH')}
                        </p>
                        <p className="font-semibold">
                          {new Date(match.match_date).toLocaleTimeString('de-CH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {match.is_home_game ? team.name : match.opponent_name} vs{' '}
                          {match.is_home_game ? match.opponent_name : team.name}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {match.location}
                        </p>
                      </div>
                    </div>
                    {match.status === 'completed' && match.home_score !== null && (
                      <div className="text-2xl font-bold text-gray-900">
                        {match.home_score} : {match.away_score}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No matches scheduled yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
