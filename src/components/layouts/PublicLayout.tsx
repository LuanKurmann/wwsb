import { Outlet, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Instagram, Facebook, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Team {
  id: string;
  name: string;
  slug: string;
}

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
            <img
                src="/img/logo.png" // ERSETZEN SIE DIESEN PFAD
                alt="White Wings Logo"
                className="h-10 w-auto" // Passen Sie die Höhe (h-10) nach Bedarf an
              />
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition">Startseite</Link>
              <div className="relative group">
                <Link to="/teams" className="flex items-center text-gray-700 hover:text-blue-600 transition">
                  Teams
                  <ChevronDown className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:rotate-180" />
                </Link>                
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    {teams.map((team) => (
                      <Link
                        key={team.id}
                        to={`/teams/${team.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      >
                        {team.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <button className="flex items-center text-gray-700 hover:text-blue-600 transition">
                  Verein
                  <ChevronDown className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:rotate-180" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      to="/geschichte"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Geschichte
                    </Link>
                    <Link
                      to="/funktionaere"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Funktionäre
                    </Link>
                    <Link
                      to="/dokumente"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Dokumente
                    </Link>
                    <Link
                      to="/kontakt"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Kontakt
                    </Link>
                  </div>
                </div>
              </div>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-600 transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-4">
                <Link to="/" className="text-gray-700 hover:text-blue-600 transition" onClick={() => setMobileMenuOpen(false)}>Startseite</Link>
                <div className="text-gray-500 text-sm font-semibold">Teams</div>
                {teams.map((team) => (
                  <Link
                    key={team.id}
                    to={`/teams/${team.slug}`}
                    className="text-gray-700 hover:text-blue-600 transition pl-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {team.name}
                  </Link>
                ))}
                <div className="text-gray-500 text-sm font-semibold">Verein</div>
                <Link to="/geschichte" className="text-gray-700 hover:text-blue-600 transition pl-4" onClick={() => setMobileMenuOpen(false)}>Geschichte</Link>
                <Link to="/funktionaere" className="text-gray-700 hover:text-blue-600 transition pl-4" onClick={() => setMobileMenuOpen(false)}>Funktionäre</Link>
                <Link to="/dokumente" className="text-gray-700 hover:text-blue-600 transition pl-4" onClick={() => setMobileMenuOpen(false)}>Dokumente</Link>
                <Link to="/kontakt" className="text-gray-700 hover:text-blue-600 transition pl-4" onClick={() => setMobileMenuOpen(false)}>Kontakt</Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">White Wings</h3>
              <p className="text-gray-400">Schüpfen - Busswil</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">KONTAKT</h4>
              <p className="text-gray-400 text-sm">UHC White Wings Schüpfen-Busswil Postfach 211</p>
              <p className="text-gray-400 text-sm">3054 Schüpfen</p>
              <p className="text-gray-400 text-sm mt-2">info@whitewings.ch</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">SOCIAL MEDIA</h4>
              <div className="flex space-x-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                  <Facebook className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© 2024. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
