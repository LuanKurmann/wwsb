const API_BASE_URL = 'https://api-v2.swissunihockey.ch/api/games';
const RANKINGS_BASE_URL = 'https://api-v2.swissunihockey.ch/api/rankings';
const SEASON_ID = '2025';
const CLUB_ID = '447636';

export interface Game {
  gameId: string;
  date: string;
  time: string;
  location: string;
  locationLink?: { x: number; y: number };
  league?: string;
  homeTeam: string;
  awayTeam: string;
  result: string;
  isHighlighted: boolean;
  homeHighlighted: boolean;
  awayHighlighted: boolean;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
}

export interface GameDetails {
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  homeTeam: string;
  awayTeam: string;
  result: string;
  date: string;
  time: string;
  location: string;
  locationLink?: { x: number; y: number };
  firstReferee?: string;
  secondReferee?: string;
  spectators?: string;
}

export interface RankingCell {
  text?: string[];
  image?: {
    url: string;
    alt: string;
  };
  link?: {
    type: string;
    x?: number;
    y?: number;
  };
  highlight?: boolean;
}

export interface RankingRow {
  cells: RankingCell[];
  highlight?: boolean;
}

export interface RankingHeader {
  text: string;
  short?: string;
  align?: 'l' | 'c' | 'r';
  width?: number;
}

export interface RankingData {
  title: string;
  headers: RankingHeader[];
  rows: RankingRow[];
}

interface APICell {
  text?: string[];
  link?: { type: string; x: number; y: number };
  highlight?: boolean;
}

interface APIRow {
  cells: APICell[];
  highlight?: boolean;
  link?: { type: string; page: string; ids: number[] };
}

interface APIRegion {
  rows: APIRow[];
}

interface APIResponse {
  data: {
    regions: APIRegion[];
  };
}

async function fetchGames(mode: 'club' | 'team', id: string): Promise<Game[]> {
  const url = `${API_BASE_URL}?mode=${mode}&${mode}_id=${id}&season=${SEASON_ID}&games_per_page=100`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: APIResponse = await response.json();
    const allGames: Game[] = [];

    data.data.regions?.forEach((region) => {
      region.rows?.forEach((row) => {
        const cells = row.cells;
        if (!cells || cells.length < 5) return;

        const dateTime = cells[0].text || ['N/A'];
        const location = cells[1].text ? cells[1].text.join(', ') : 'N/A';
        const locationLink = cells[1].link?.type === 'map' ? cells[1].link : undefined;

        let league: string | undefined;
        let teamOffset = 0;

        if (mode === 'club' && cells.length >= 6) {
          league = cells[2].text ? cells[2].text.join(' ') : undefined;
          teamOffset = 0;
        } else if (mode === 'team') {
          teamOffset = -1;
        }

        const homeTeam = cells[3 + teamOffset].text ? cells[3 + teamOffset].text.join('') : 'Heim';
        const awayTeam = cells[4 + teamOffset].text ? cells[4 + teamOffset].text.join('') : 'Gast';
        const result = cells[5 + teamOffset].text ? cells[5 + teamOffset].text.join('') : '-';

        const gameId = row.link?.ids?.[0]?.toString() || '';

        const game: Game = {
          gameId,
          date: dateTime[0] || 'N/A',
          time: dateTime[1] || '00:00',
          location,
          locationLink,
          league,
          homeTeam,
          awayTeam,
          result,
          isHighlighted: row.highlight || false,
          homeHighlighted: cells[3 + teamOffset].highlight || false,
          awayHighlighted: cells[4 + teamOffset].highlight || false,
        };

        allGames.push(game);
      });
    });

    return allGames;
  } catch (error) {
    console.error(`Error fetching ${mode} games:`, error);
    return [];
  }
}

function parseGameDate(game: Game): Date {
  const [day, month, year] = game.date.split('.');
  return new Date(`${year}-${month}-${day}T${game.time}:00`);
}

export function separateGames(games: Game[]): { upcoming: Game[]; past: Game[] } {
  const now = new Date();
  const upcoming: Game[] = [];
  const past: Game[] = [];

  games.forEach((game) => {
    const gameDate = parseGameDate(game);
    if (gameDate > now) {
      upcoming.push(game);
    } else {
      past.push(game);
    }
  });

  upcoming.sort((a, b) => parseGameDate(a).getTime() - parseGameDate(b).getTime());
  past.sort((a, b) => parseGameDate(b).getTime() - parseGameDate(a).getTime());

  return { upcoming, past };
}

export async function fetchClubGames(): Promise<{ upcoming: Game[]; past: Game[] }> {
  const games = await fetchGames('club', CLUB_ID);
  return separateGames(games);
}

export async function fetchTeamGames(teamApiId: string): Promise<{ upcoming: Game[]; past: Game[] }> {
  const games = await fetchGames('team', teamApiId);
  return separateGames(games);
}

export async function fetchGameDetails(gameId: string): Promise<GameDetails | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/${gameId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const row = data.data.regions?.[0]?.rows?.[0];
    if (!row) return null;

    const cells = row.cells;

    const gameDetails: GameDetails = {
      homeLogoUrl: cells[0]?.image?.url,
      homeTeam: cells[1]?.text?.[0] || '',
      awayLogoUrl: cells[2]?.image?.url,
      awayTeam: cells[3]?.text?.[0] || '',
      result: cells[4]?.text?.[0] || '-',
      date: cells[5]?.text?.[0] || '',
      time: cells[6]?.text?.[0] || '',
      location: cells[7]?.text?.[0] || '',
      locationLink: cells[7]?.link?.type === 'map' ? { x: cells[7].link.x, y: cells[7].link.y } : undefined,
      firstReferee: cells[8]?.text?.[0],
      secondReferee: cells[9]?.text?.[0],
      spectators: cells[10]?.text?.[0],
    };

    return gameDetails;
  } catch (error) {
    console.error(`Error fetching game details for ${gameId}:`, error);
    return null;
  }
}

export async function enrichGamesWithLogos(games: Game[]): Promise<Game[]> {
  const enrichedGames = await Promise.all(
    games.map(async (game) => {
      if (!game.gameId) return game;

      const details = await fetchGameDetails(game.gameId);
      if (details) {
        return {
          ...game,
          homeLogoUrl: details.homeLogoUrl,
          awayLogoUrl: details.awayLogoUrl,
        };
      }
      return game;
    })
  );

  return enrichedGames;
}

export async function fetchTeamRanking(teamApiId: string): Promise<RankingData | null> {
  try {
    const gamesUrl = `${API_BASE_URL}?mode=list&season=${SEASON_ID}&team_id=${teamApiId}`;
    const gamesResponse = await fetch(gamesUrl);

    if (!gamesResponse.ok) {
      throw new Error(`HTTP error! Status: ${gamesResponse.status}`);
    }

    const gamesData = await gamesResponse.json();
    const context = gamesData.data.context;

    const league = context.league;
    const game_class = context.game_class;
    const group = encodeURIComponent(context.group || '');

    if (!league || !game_class || !group) {
      throw new Error('Missing league parameters');
    }

    const rankingsUrl = `${RANKINGS_BASE_URL}?season=${SEASON_ID}&league=${league}&game_class=${game_class}&group=${group}`;
    const rankingsResponse = await fetch(rankingsUrl);

    if (!rankingsResponse.ok) {
      throw new Error(`HTTP error! Status: ${rankingsResponse.status}`);
    }

    const rankingsData = await rankingsResponse.json();

    if (!rankingsData.data || !rankingsData.data.headers || !rankingsData.data.regions) {
      throw new Error('Invalid ranking data format');
    }

    const allRows: RankingRow[] = [];
    rankingsData.data.regions.forEach((region: any) => {
      if (region.rows) {
        region.rows.forEach((row: any) => {
          allRows.push({
            cells: row.cells,
            highlight: row.highlight || false,
          });
        });
      }
    });

    return {
      title: rankingsData.data.title || 'Rangliste',
      headers: rankingsData.data.headers,
      rows: allRows,
    };
  } catch (error) {
    console.error('Error fetching team ranking:', error);
    return null;
  }
}
