import { useEffect, useState } from 'react';
import { Users, Shield, UserCog, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  users: number;
  teams: number;
  players: number;
  sponsors: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, teams: 0, players: 0, sponsors: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [usersRes, teamsRes, playersRes, sponsorsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('players').select('id', { count: 'exact', head: true }),
        supabase.from('sponsors').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        users: usersRes.count || 0,
        teams: teamsRes.count || 0,
        players: playersRes.count || 0,
        sponsors: sponsorsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'blue' },
    { label: 'Teams', value: stats.teams, icon: Shield, color: 'green' },
    { label: 'Players', value: stats.players, icon: UserCog, color: 'purple' },
    { label: 'Sponsors', value: stats.sponsors, icon: Award, color: 'orange' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome to the White Wings admin panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-500">Approve and assign roles</p>
            </div>
          </a>
          <a
            href="/admin/teams"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <Shield className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Manage Teams</p>
              <p className="text-sm text-gray-500">Add and edit teams</p>
            </div>
          </a>
          <a
            href="/admin/players"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <UserCog className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Manage Players</p>
              <p className="text-sm text-gray-500">Add and edit players</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
