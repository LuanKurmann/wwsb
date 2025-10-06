import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, X, Filter, Upload, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logCreate, logUpdate, logDelete } from '../../lib/activityLog';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  is_active: boolean;
  team_assignments: Array<{
    team: { id: string; name: string };
    jersey_number: number | null;
    position: 'goalkeeper' | 'defender' | 'forward' | null;
    photo_url: string | null;
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
  const [teamDetails, setTeamDetails] = useState<Record<string, { jersey_number: string; position: string; photo_url: string }>>({});
  const [filterTeamId, setFilterTeamId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'team'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage] = useState(20);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
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
            photo_url,
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
              photo_url: tp.photo_url,
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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, teamId: string) {
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

      updateTeamDetail(teamId, 'photo_url', publicUrl);
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
          
        // Log the update
        await logUpdate('player', playerId, {
          name: `${playerData.first_name} ${playerData.last_name}`,
          teams: selectedTeams.length
        });
      } else {
        const { data, error } = await supabase
          .from('players')
          .insert([playerData])
          .select()
          .single();

        if (error) throw error;
        playerId = data.id;
        
        // Log the creation
        await logCreate('player', playerId, {
          name: `${playerData.first_name} ${playerData.last_name}`,
          teams: selectedTeams.length
        });
      }

      if (selectedTeams.length > 0) {
        const teamPlayerData = selectedTeams.map(teamId => ({
          player_id: playerId,
          team_id: teamId,
          jersey_number: teamDetails[teamId]?.jersey_number
            ? parseInt(teamDetails[teamId].jersey_number)
            : null,
          position: teamDetails[teamId]?.position || null,
          photo_url: teamDetails[teamId]?.photo_url || null,
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
      const playerToDelete = allPlayers.find(p => p.id === id);
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) throw error;
      
      // Log the deletion
      await logDelete('player', id, {
        name: `${playerToDelete?.first_name} ${playerToDelete?.last_name}`
      });
      
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
        birth_date: player.birth_date || '',
        is_active: player.is_active,
      });
      const assignments = player.team_assignments || [];
      setSelectedTeams(assignments.map((assignment) => assignment.team.id));
      setTeamDetails(assignments.reduce((acc: Record<string, { jersey_number: string; position: string; photo_url: string }>, assignment) => {
        acc[assignment.team.id] = {
          jersey_number: assignment.jersey_number?.toString() || '',
          position: assignment.position || '',
          photo_url: assignment.photo_url || '',
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
        [teamId]: current[teamId] || { jersey_number: '', position: '', photo_url: '' },
      }));

      return [...prev, teamId];
    });
  }

  function updateTeamDetail(teamId: string, field: 'jersey_number' | 'position' | 'photo_url', value: string) {
    setTeamDetails(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || { jersey_number: '', position: '', photo_url: '' }),
        [field]: value,
      },
    }));
  }

  useEffect(() => {
    let filtered = allPlayers;
    
    // Filter nach Team
    if (filterTeamId !== '') {
      filtered = filtered.filter(player =>
        player.team_assignments?.some(assignment => assignment.team.id === filterTeamId)
      );
    }
    
    // Suche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(player => 
        player.first_name.toLowerCase().includes(query) ||
        player.last_name.toLowerCase().includes(query) ||
        `${player.first_name} ${player.last_name}`.toLowerCase().includes(query)
      );
    }
    
    // Sortierung
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
        const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else {
        // Sortiere nach Anzahl Teams
        const countA = a.team_assignments.length;
        const countB = b.team_assignments.length;
        return sortOrder === 'asc' ? countA - countB : countB - countA;
      }
    });
    
    setPlayers(filtered);
    setCurrentPage(1); // Reset zu Seite 1 bei Filteränderung
  }, [filterTeamId, searchQuery, sortBy, sortOrder, allPlayers]);
  
  // Pagination
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = players.slice(indexOfFirstPlayer, indexOfLastPlayer);
  const totalPages = Math.ceil(players.length / playersPerPage);
  
  function toggleSort(field: 'name' | 'team') {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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

        <div className="space-y-3">
          {/* Suchleiste */}
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Spieler suchen (Name)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600"
                title="Suche löschen"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Filter und Sortierung */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterTeamId}
                onChange={(e) => setFilterTeamId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Alle Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as ['name' | 'team', 'asc' | 'desc'];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="team-desc">Meiste Teams</option>
                <option value="team-asc">Wenigste Teams</option>
              </select>
            </div>
            
            <span className="text-sm text-gray-600">
              {players.length} Spieler{players.length !== 1 ? '' : ''} gefunden
            </span>
          </div>
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
            {currentPlayers.map((player) => (
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zurück
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Zeige <span className="font-medium">{indexOfFirstPlayer + 1}</span> bis{' '}
                  <span className="font-medium">{Math.min(indexOfLastPlayer, players.length)}</span> von{' '}
                  <span className="font-medium">{players.length}</span> Spielern
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
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

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Team-Zuweisungen *
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Wählen Sie Teams aus und setzen Sie für jedes Team die Trikotnummer, Position und Foto.
                  </p>
                  <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
                    {teams.length > 0 ? (
                      <div className="space-y-2">
                        {teams.map((team) => (
                          <label key={team.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition">
                            <input
                              type="checkbox"
                              checked={selectedTeams.includes(team.id)}
                              onChange={() => toggleTeam(team.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 font-medium">{team.name}</span>
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

                {selectedTeams.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
                    <p className="text-sm text-blue-800">
                      👆 Bitte wählen Sie mindestens ein Team aus, um Trikotnummer, Position und Foto zu setzen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-t border-gray-200 pt-2">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Team-spezifische Details</h4>
                    </div>
                    {selectedTeams.map((teamId) => {
                      const team = teams.find(t => t.id === teamId);
                      if (!team) return null;
                      const details = teamDetails[teamId] || { jersey_number: '', position: '', photo_url: '' };

                      return (
                        <div key={teamId} className="border border-blue-200 bg-blue-50 rounded-md p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">📋 {team.name}</h4>
                            <button
                              type="button"
                              onClick={() => toggleTeam(teamId)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="space-y-4 bg-white p-3 rounded">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Trikotnummer
                                </label>
                                <input
                                  type="number"
                                  value={details.jersey_number}
                                  onChange={(e) => updateTeamDetail(teamId, 'jersey_number', e.target.value)}
                                  placeholder="z.B. 10"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Position
                                </label>
                                <select
                                  value={details.position}
                                  onChange={(e) => updateTeamDetail(teamId, 'position', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Position wählen</option>
                                  <option value="goalkeeper">Goalkeeper</option>
                                  <option value="defender">Defender</option>
                                  <option value="forward">Forward</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Spielerfoto
                              </label>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="url"
                                    value={details.photo_url}
                                    onChange={(e) => updateTeamDetail(teamId, 'photo_url', e.target.value)}
                                    placeholder="https://example.com/photo.jpg"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">oder</span>
                                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                                    <Upload className="w-4 h-4" />
                                    <span className="text-sm">{uploadingPhoto ? 'Wird hochgeladen...' : 'Foto hochladen'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handlePhotoUpload(e, teamId)}
                                      disabled={uploadingPhoto}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                                {details.photo_url && (
                                  <div className="mt-2">
                                    <img src={details.photo_url} alt="Preview" className="w-24 h-24 object-cover rounded border-2 border-gray-200" />
                                  </div>
                                )}
                              </div>
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
