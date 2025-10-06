import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, X, Filter, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  birth_date: string | null;
  is_active: boolean;
  team_assignments: Array<{
    team: { id: string; name: string };
    jersey_number: number | null;
    position: 'goalkeeper' | 'defender' | 'forward' | null;
  }>;
}

interface Team {
  id: string;
  name: string;
  slug: string;
}

export default function PlayersManagement() {
  const { canEdit, isAdmin } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [teamDetails, setTeamDetails] = useState<Record<string, { jersey_number: string; position: string }>>({});
  const [filterTeamId, setFilterTeamId] = useState<string>('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    photo_url: '',
    birth_date: '',
    is_active: true,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadPlayers();
    loadTeams();
  }, []);

  async function loadPlayers() {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team_players(
            team_id,
            jersey_number,
            position,
            teams(id, name)
          )
        `)
        .order('last_name');

      if (error) throw error;

      const playersWithTeams = (data || []).map((player: any) => ({
        ...player,
        team_assignments:
          player.team_players?.
            filter((tp: any) => tp.teams).
            map((tp: any) => ({
              team: tp.teams,
              jersey_number: tp.jersey_number,
              position: tp.position,
            })) || []
      }));

      setAllPlayers(playersWithTeams);
      setPlayers(playersWithTeams);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  }

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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5242880) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `players/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, photo_url: publicUrl });
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const playerData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      jersey_number: null,
      position: null,
      photo_url: formData.photo_url || null,
      birth_date: formData.birth_date || null,
      is_active: formData.is_active,
    };

    try {
      let playerId: string;

      if (editingPlayer) {
        const { error } = await supabase
          .from('players')
          .update(playerData)
          .eq('id', editingPlayer.id);

        if (error) throw error;
        playerId = editingPlayer.id;

        await supabase
          .from('team_players')
          .delete()
          .eq('player_id', playerId);
      } else {
        const { data, error } = await supabase
          .from('players')
          .insert([playerData])
          .select()
          .single();

        if (error) throw error;
        playerId = data.id;
      }

      if (selectedTeams.length > 0) {
        const teamPlayerData = selectedTeams.map(teamId => ({
          player_id: playerId,
          team_id: teamId,
          jersey_number: teamDetails[teamId]?.jersey_number
            ? parseInt(teamDetails[teamId].jersey_number)
            : null,
          position: teamDetails[teamId]?.position || null,
        }));

        const { error: teamError } = await supabase
          .from('team_players')
          .insert(teamPlayerData);

        if (teamError) throw teamError;
      }

      setShowModal(false);
      setEditingPlayer(null);
      resetForm();
      loadPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Failed to save player');
    }
  }

  async function deletePlayer(id: string) {
    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) throw error;
      loadPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player');
    }
  }

  function resetForm() {
    setFormData({
      first_name: '',
      last_name: '',
      photo_url: '',
      birth_date: '',
      is_active: true,
    });
    setSelectedTeams([]);
    setTeamDetails({});
  }

  function openModal(player?: Player) {
    if (player) {
      setEditingPlayer(player);
      setFormData({
        first_name: player.first_name,
        last_name: player.last_name,
        photo_url: player.photo_url || '',
        birth_date: player.birth_date || '',
        is_active: player.is_active,
      });
      const assignments = player.team_assignments || [];
      setSelectedTeams(assignments.map((assignment) => assignment.team.id));
      setTeamDetails(assignments.reduce((acc: Record<string, { jersey_number: string; position: string }>, assignment) => {
        acc[assignment.team.id] = {
          jersey_number: assignment.jersey_number?.toString() || '',
          position: assignment.position || '',
        };
        return acc;
      }, {}));
    } else {
      setEditingPlayer(null);
      resetForm();
    }
    setShowModal(true);
  }

  function toggleTeam(teamId: string) {
    setSelectedTeams(prev => {
      const isSelected = prev.includes(teamId);
      if (isSelected) {
        return prev.filter(id => id !== teamId);
      }

      setTeamDetails(current => ({
        ...current,
        [teamId]: current[teamId] || { jersey_number: '', position: '' },
      }));

      return [...prev, teamId];
    });
  }

  function updateTeamDetail(teamId: string, field: 'jersey_number' | 'position', value: string) {
    setTeamDetails(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || { jersey_number: '', position: '' }),
        [field]: value,
      },
    }));
  }

  useEffect(() => {
    if (filterTeamId === '') {
      setPlayers(allPlayers);
    } else {
      setPlayers(allPlayers.filter(player =>
        player.team_assignments?.some(assignment => assignment.team.id === filterTeamId)
      ));
    }
  }, [filterTeamId, allPlayers]);

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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Players Management</h2>
            <p className="text-gray-600 mt-1">Manage player roster</p>
          </div>
          {canEdit && (
            <button
              onClick={() => openModal()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterTeamId}
            onChange={(e) => setFilterTeamId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          {filterTeamId && (
            <span className="text-sm text-gray-600">
              {players.length} player{players.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Assignments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.map((player) => (
              <tr key={player.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {player.first_name} {player.last_name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {player.team_assignments.length > 0 ? (
                    <div className="space-y-1">
                      {player.team_assignments.map((assignment) => (
                        <div key={assignment.team.id} className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900">{assignment.team.name}</span>
                          <span className="ml-2 text-gray-500">
                            {assignment.jersey_number ? `#${assignment.jersey_number}` : 'No number'}
                          </span>
                          <span className="ml-2 text-gray-500 capitalize">
                            {assignment.position || 'No position'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No teams assigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${player.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {player.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                    <button onClick={() => openModal(player)} className="text-blue-600 hover:text-blue-900 mr-4" title="Edit player">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => deletePlayer(player.id)} className="text-red-600 hover:text-red-900" title="Delete player">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingPlayer ? 'Edit Player' : 'Add Player'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.photo_url}
                        onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                        placeholder="https://example.com/photo.jpg"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">or</span>
                      <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {formData.photo_url && (
                      <img src={formData.photo_url} alt="Preview" className="w-24 h-24 object-cover rounded" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teams</label>
                  <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                    {teams.length > 0 ? (
                      <div className="space-y-2">
                        {teams.map((team) => (
                          <label key={team.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedTeams.includes(team.id)}
                              onChange={() => toggleTeam(team.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{team.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No teams available</p>
                    )}
                  </div>
                  {selectedTeams.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTeams.map((teamId) => {
                        const team = teams.find(t => t.id === teamId);
                        return team ? (
                          <span key={teamId} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {team.name}
                            <button
                              type="button"
                              onClick={() => toggleTeam(teamId)}
                              className="ml-1 hover:text-blue-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {selectedTeams.length > 0 && (
                  <div className="space-y-4">
                    {selectedTeams.map((teamId) => {
                      const team = teams.find(t => t.id === teamId);
                      if (!team) return null;
                      const details = teamDetails[teamId] || { jersey_number: '', position: '' };

                      return (
                        <div key={teamId} className="border border-gray-200 rounded-md p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">{team.name}</h4>
                            <button
                              type="button"
                              onClick={() => toggleTeam(teamId)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Number</label>
                              <input
                                type="number"
                                value={details.jersey_number}
                                onChange={(e) => updateTeamDetail(teamId, 'jersey_number', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                              <select
                                value={details.position}
                                onChange={(e) => updateTeamDetail(teamId, 'position', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select position</option>
                                <option value="goalkeeper">Goalkeeper</option>
                                <option value="defender">Defender</option>
                                <option value="forward">Forward</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingPlayer(null); resetForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingPlayer ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
