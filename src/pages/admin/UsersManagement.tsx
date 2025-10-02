import { useEffect, useState } from 'react';
import { supabase, Profile, UserRole, UserRoleData } from '../../lib/supabase';
import { CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function UsersManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole[]>>({});
  const [roles, setRoles] = useState<{ id: string; name: UserRole; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const { isSuperAdmin } = useAuth();

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
        setUsers(usersRes.data);

        const rolesMap: Record<string, UserRole[]> = {};
        for (const user of usersRes.data) {
          const { data } = await supabase
            .from('user_roles')
            .select('*, roles(*)')
            .eq('user_id', user.id);

          if (data) {
            rolesMap[user.id] = (data as unknown as UserRoleData[]).map(ur => ur.roles.name);
          }
        }
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

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">You do not have permission to manage users.</p>
      </div>
    );
  }

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
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
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
      </div>
    </div>
  );
}
