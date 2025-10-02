import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, X, Filter, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  teams?: Array<{ id: string; name: string; }>;
}

interface Team {
  id: string;
  name: string;
  slug: string;
}

export default function TrainersManagement() {
  const { canEdit, isAdmin } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [filterTeamId, setFilterTeamId] = useState<string>('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: '',
    photo_url: '',
    email: '',
    phone: '',
    is_active: true,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadTrainers();
    loadTeams();
  }, []);

  async function loadTrainers() {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          team_trainers!inner(
            team_id,
            teams(id, name)
          )
        `)
        .order('last_name');

      if (error) throw error;

      const trainersWithTeams = (data || []).map((trainer: any) => ({
        ...trainer,
        teams: trainer.team_trainers?.map((tt: any) => tt.teams).filter(Boolean) || []
      }));

      setAllTrainers(trainersWithTeams);
      setTrainers(trainersWithTeams);
    } catch (error) {
      console.error('Error loading trainers:', error);
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
      const filePath = `trainers/${fileName}`;

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

    const trainerData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
      photo_url: formData.photo_url || null,
      email: formData.email || null,
      phone: formData.phone || null,
      is_active: formData.is_active,
    };

    try {
      let trainerId: string;

      if (editingTrainer) {
        const { error } = await supabase
          .from('trainers')
          .update(trainerData)
          .eq('id', editingTrainer.id);

        if (error) throw error;
        trainerId = editingTrainer.id;

        await supabase
          .from('team_trainers')
          .delete()
          .eq('trainer_id', trainerId);
      } else {
        const { data, error } = await supabase
          .from('trainers')
          .insert([trainerData])
          .select()
          .single();

        if (error) throw error;
        trainerId = data.id;
      }

      if (selectedTeams.length > 0) {
        const teamTrainerData = selectedTeams.map(teamId => ({
          trainer_id: trainerId,
          team_id: teamId,
          season: '2024/2025',
          is_head_coach: false
        }));

        const { error: teamError } = await supabase
          .from('team_trainers')
          .insert(teamTrainerData);

        if (teamError) throw teamError;
      }

      setShowModal(false);
      setEditingTrainer(null);
      resetForm();
      loadTrainers();
    } catch (error) {
      console.error('Error saving trainer:', error);
      alert('Failed to save trainer');
    }
  }

  async function deleteTrainer(id: string) {
    if (!confirm('Are you sure you want to delete this trainer?')) return;

    try {
      const { error } = await supabase.from('trainers').delete().eq('id', id);
      if (error) throw error;
      loadTrainers();
    } catch (error) {
      console.error('Error deleting trainer:', error);
      alert('Failed to delete trainer');
    }
  }

  function resetForm() {
    setFormData({
      first_name: '',
      last_name: '',
      role: '',
      photo_url: '',
      email: '',
      phone: '',
      is_active: true,
    });
    setSelectedTeams([]);
  }

  function openModal(trainer?: Trainer) {
    if (trainer) {
      setEditingTrainer(trainer);
      setFormData({
        first_name: trainer.first_name,
        last_name: trainer.last_name,
        role: trainer.role,
        photo_url: trainer.photo_url || '',
        email: trainer.email || '',
        phone: trainer.phone || '',
        is_active: trainer.is_active,
      });
      setSelectedTeams(trainer.teams?.map(t => t.id) || []);
    } else {
      setEditingTrainer(null);
      resetForm();
    }
    setShowModal(true);
  }

  function toggleTeam(teamId: string) {
    setSelectedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  }

  useEffect(() => {
    if (filterTeamId === '') {
      setTrainers(allTrainers);
    } else {
      setTrainers(allTrainers.filter(trainer =>
        trainer.teams?.some(team => team.id === filterTeamId)
      ));
    }
  }, [filterTeamId, allTrainers]);

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
            <h2 className="text-2xl font-bold text-gray-900">Trainers Management</h2>
            <p className="text-gray-600 mt-1">Manage coaches and trainers</p>
          </div>
          {canEdit && (
            <button
              onClick={() => openModal()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Trainer
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
              {trainers.length} trainer{trainers.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teams</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trainers.map((trainer) => (
              <tr key={trainer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {trainer.first_name} {trainer.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trainer.role}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {trainer.teams && trainer.teams.length > 0 ? (
                      trainer.teams.map(team => (
                        <span key={team.id} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {team.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No teams</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trainer.email || trainer.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trainer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {trainer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                    <button onClick={() => openModal(trainer)} className="text-blue-600 hover:text-blue-900 mr-4" title="Edit trainer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => deleteTrainer(trainer.id)} className="text-red-600 hover:text-red-900" title="Delete trainer">
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
                {editingTrainer ? 'Edit Trainer' : 'Add Trainer'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Headcoach, Assistent, Coach"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="trainer@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+41 79 123 45 67"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
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
                          <span key={teamId} className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            {team.name}
                            <button
                              type="button"
                              onClick={() => toggleTeam(teamId)}
                              className="ml-1 hover:text-green-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

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
                    onClick={() => { setShowModal(false); setEditingTrainer(null); resetForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingTrainer ? 'Update' : 'Create'}
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
