import { useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { Game } from '../../lib/swissunihockey';

interface GamesTabViewProps {
  upcomingGames: Game[];
  pastGames: Game[];
  loading: boolean;
}

export default function GamesTabView({ upcomingGames, pastGames, loading }: GamesTabViewProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showUpcomingCount, setShowUpcomingCount] = useState(5);
  const [showPastCount, setShowPastCount] = useState(5);

  const displayedUpcoming = upcomingGames.slice(0, showUpcomingCount);
  const displayedPast = pastGames.slice(0, showPastCount);

  const hasMoreUpcoming = upcomingGames.length > showUpcomingCount;
  const hasMorePast = pastGames.length > showPastCount;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4 md:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition ${
              activeTab === 'upcoming'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kommende Spiele ({upcomingGames.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition ${
              activeTab === 'past'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vergangene Spiele ({pastGames.length})
          </button>
        </nav>
      </div>

      {activeTab === 'upcoming' && (
        <div>
          {displayedUpcoming.length > 0 ? (
            <div className="space-y-3">
              {displayedUpcoming.map((game, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-3">
                    <div className="text-xs md:text-sm text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                        <span>{game.date} um {game.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                        {game.locationLink ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${game.locationLink.y},${game.locationLink.x}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {game.location}
                          </a>
                        ) : (
                          <span className="truncate">{game.location}</span>
                        )}
                      </div>
                    </div>
                    {game.league && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full self-start md:self-center whitespace-nowrap">
                        {game.league}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {game.homeLogoUrl && (
                        <img src={game.homeLogoUrl} alt={game.homeTeam} className="w-8 h-8 md:w-10 md:h-10 object-contain flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm md:text-base font-medium truncate ${
                          game.homeHighlighted ? 'text-blue-600 font-bold' : 'text-gray-900'
                        }`}
                      >
                        {game.homeTeam}
                      </span>
                    </div>

                    <span className="text-gray-500 font-bold text-xs md:text-sm flex-shrink-0">vs</span>

                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span
                        className={`text-sm md:text-base font-medium truncate text-right ${
                          game.awayHighlighted ? 'text-blue-600 font-bold' : 'text-gray-900'
                        }`}
                      >
                        {game.awayTeam}
                      </span>
                      {game.awayLogoUrl && (
                        <img src={game.awayLogoUrl} alt={game.awayTeam} className="w-8 h-8 md:w-10 md:h-10 object-contain flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {hasMoreUpcoming && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setShowUpcomingCount((prev) => prev + 5)}
                    className="px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                  >
                    Mehr anzeigen
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Keine kommenden Spiele</p>
          )}
        </div>
      )}

      {activeTab === 'past' && (
        <div>
          {displayedPast.length > 0 ? (
            <div className="space-y-3">
              {displayedPast.map((game, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-3">
                    <div className="text-xs md:text-sm text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                        <span>{game.date} um {game.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                        <span className="truncate">{game.location}</span>
                      </div>
                    </div>
                    {game.league && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full self-start md:self-center whitespace-nowrap">
                        {game.league}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {game.homeLogoUrl && (
                        <img src={game.homeLogoUrl} alt={game.homeTeam} className="w-8 h-8 md:w-10 md:h-10 object-contain flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm md:text-base font-medium truncate ${
                          game.homeHighlighted ? 'text-blue-600 font-bold' : 'text-gray-900'
                        }`}
                      >
                        {game.homeTeam}
                      </span>
                    </div>

                    <div className="flex items-center flex-shrink-0">
                      <span className="text-lg md:text-xl font-bold text-gray-900">{game.result}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span
                        className={`text-sm md:text-base font-medium truncate text-right ${
                          game.awayHighlighted ? 'text-blue-600 font-bold' : 'text-gray-900'
                        }`}
                      >
                        {game.awayTeam}
                      </span>
                      {game.awayLogoUrl && (
                        <img src={game.awayLogoUrl} alt={game.awayTeam} className="w-8 h-8 md:w-10 md:h-10 object-contain flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {hasMorePast && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setShowPastCount((prev) => prev + 5)}
                    className="px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                  >
                    Mehr anzeigen
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Keine vergangenen Spiele</p>
          )}
        </div>
      )}
    </div>
  );
}
