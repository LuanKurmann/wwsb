import { useEffect, useState } from 'react';
import { supabase, Profile, UserRole, UserRoleData } from '../../lib/supabase';
import { CheckCircle, XCircle, UserPlus, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deleteUserAccount } from '../../lib/userManagement';

interface UserWithTeams extends Profile {
  player?: {
    id: string;
    first_name: string;
    last_name: string;
    teams: Array<{
      id: string;
      name: string;
      display_name: string | null;
    }>;
  } | null;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserWithTeams[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole[]>>({});
  const [roles, setRoles] = useState<{ id: string; name: UserRole; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const { isSuperAdmin } = useAuth();
  
  // Filter & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('roles').select('*'),
      ]);

      if (usersRes.data) {
        // Load users with player/team info
        const usersWithTeams: UserWithTeams[] = [];
        const rolesMap: Record<string, UserRole[]> = {};
        
        for (const user of usersRes.data) {
          // Get user roles
          const { data: userRolesData } = await supabase
            .from('user_roles')
            .select('*, roles(*)')
            .eq('user_id', user.id);

          if (userRolesData) {
            rolesMap[user.id] = (userRolesData as unknown as UserRoleData[]).map(ur => ur.roles.name);
          }

          // Get player info if user is a player
          const { data: playerData } = await supabase
            .from('players')
            .select(`
              id,
              first_name,
              last_name,
              team_players(
                teams(
                  id,
                  name,
                  display_name
                )
              )
            `)
            .eq('user_id', user.id)
            .maybeSingle();

          usersWithTeams.push({
            ...user,
            player: playerData ? {
              ...playerData,
              teams: playerData.team_players?.map((tp: any) => tp.teams).filter(Boolean) || []
            } : null
          });
        }
        
        setUsers(usersWithTeams);
        setUserRoles(rolesMap);
      }

      if (rolesRes.data) {
        setRoles(rolesRes.data as { id: string; name: UserRole; description: string }[]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended') {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  }

  async function assignRole(userId: string, roleId: string) {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId });

      if (error) throw error;

      await loadData();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      if (error.code === '23505') {
        alert('User already has this role');
      } else {
        alert('Failed to assign role');
      }
    }
  }

  async function removeRole(userId: string, roleId: string) {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Error removing role:', error);
      alert('Failed to remove role');
    }
  }

  async function handleDeleteUser(userId: string, userName: string, userStatus: string) {
    // Only allow deletion of inactive/suspended users
    if (userStatus === 'active') {
      alert('Benutzer muss zuerst deaktiviert werden, bevor er gelöscht werden kann.');
      return;
    }

    if (!confirm(`Möchten Sie den Benutzer "${userName}" wirklich löschen?\n\nHinweis: Bei Spielern wird nur die Verknüpfung gelöscht, das Spielerprofil bleibt erhalten.`)) {
      return;
    }

    try {
      const { error } = await deleteUserAccount(userId);
      
      if (error) throw error;

      alert('Benutzer erfolgreich gelöscht');
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Fehler beim Löschen des Benutzers');
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">You do not have permission to manage users.</p>
      </div>
    );
  }

  // Filter and paginate users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    const matchesRole = roleFilter === 'all' || 
      (userRoles[user.id]?.includes(roleFilter as UserRole));
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-600 mt-1">Approve users and assign roles</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Suche nach Name oder Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Alle Status</option>
            <option value="active">Aktiv</option>
            <option value="pending">Ausstehend</option>
            <option value="inactive">Inaktiv</option>
            <option value="suspended">Gesperrt</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Alle Rollen</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            {filteredUsers.length} von {users.length} Benutzern
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.player && user.player.teams.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {user.player.teams.map((team) => (
                          <span
                            key={team.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                          >
                            {team.display_name || team.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {userRoles[user.id]?.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                    {(!userRoles[user.id] || userRoles[user.id].length === 0) && (
                      <span className="text-sm text-gray-400">No roles assigned</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    {user.status === 'pending' && (
                      <button
                        onClick={() => updateUserStatus(user.id, 'active')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                    )}
                    {user.status === 'active' && (
                      <button
                        onClick={() => updateUserStatus(user.id, 'inactive')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Deactivate
                      </button>
                    )}
                    {(user.status === 'inactive' || user.status === 'suspended') && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.full_name || user.email, user.status)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                        title="Benutzer löschen"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Löschen
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Roles
                    </button>
                  </div>

                  {selectedUser === user.id && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-xs font-medium text-gray-700 mb-2">Assign/Remove Roles:</p>
                      <div className="space-y-1">
                        {roles.map((role) => {
                          const hasRole = userRoles[user.id]?.includes(role.name);
                          return (
                            <div key={role.id} className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">{role.name}</span>
                              {hasRole ? (
                                <button
                                  onClick={() => removeRole(user.id, role.id)}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              ) : (
                                <button
                                  onClick={() => assignRole(user.id, role.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Seite {currentPage} von {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
