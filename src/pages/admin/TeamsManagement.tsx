import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logCreate, logUpdate, logDelete } from '../../lib/activityLog';

interface Team {
  id: string;
  name: string;
  display_name: string | null;
  slug: string;
  category: string;
  description: string | null;
  team_photo_url: string | null;
  contact_email: string | null;
  display_order: number;
  is_active: boolean;
  swiss_id: number | null;
}

export default function TeamsManagement() {
  const { canEdit, isAdmin } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    slug: '',
    category: '',
    description: '',
    team_photo_url: '',
    contact_email: '',
    api_id: '',
    display_order: 0,
    is_active: true,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
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
      const filePath = `teams/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, team_photo_url: publicUrl });
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingTeam) {
        // If team has swiss_id, only allow updating display_name
        const updateData = editingTeam.swiss_id 
          ? { display_name: formData.display_name }
          : formData;
        
        const { error } = await supabase
          .from('teams')
          .update(updateData)
          .eq('id', editingTeam.id);

        if (error) throw error;
        
        // Log the update
        await logUpdate('team', editingTeam.id, {
          name: formData.name,
          changes: Object.keys(updateData).filter(key => 
            (updateData as any)[key] !== (editingTeam as any)[key]
          )
        });
      } else {
        const { data, error } = await supabase.from('teams').insert([formData]).select().single();
        if (error) throw error;
        
        // Log the creation
        await logCreate('team', data.id, { name: formData.name });
      }

      setShowModal(false);
      setEditingTeam(null);
      resetForm();
      loadTeams();
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Failed to save team');
    }
  }

  async function deleteTeam(id: string) {
    const teamToDelete = teams.find(t => t.id === id);
    
    if (teamToDelete?.swiss_id) {
      alert('Teams von Swiss Unihockey API können nicht gelöscht werden.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
      
      // Log the deletion
      await logDelete('team', id, { name: teamToDelete?.name });
      
      loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    }
  }

  async function moveOrder(team: Team, direction: 'up' | 'down') {
    const currentIndex = teams.findIndex(t => t.id === team.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= teams.length) return;

    const targetTeam = teams[targetIndex];

    try {
      const updates = [
        supabase
          .from('teams')
          .update({ display_order: targetTeam.display_order })
          .eq('id', team.id),
        supabase
          .from('teams')
          .update({ display_order: team.display_order })
          .eq('id', targetTeam.id)
      ];

      await Promise.all(updates);
      loadTeams();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      display_name: '',
      slug: '',
      category: '',
      description: '',
      team_photo_url: '',
      contact_email: '',
      api_id: '',
      display_order: 0,
      is_active: true,
    });
  }

  function openModal(team?: Team) {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        display_name: team.display_name || '',
        slug: team.slug,
        category: team.category,
        description: team.description || '',
        team_photo_url: team.team_photo_url || '',
        contact_email: team.contact_email || '',
        api_id: (team as any).api_id || '',
        display_order: team.display_order,
        is_active: team.is_active,
      });
    } else {
      setEditingTeam(null);
      resetForm();
    }
    setShowModal(true);
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teams Management</h2>
          <p className="text-gray-600 mt-1">Manage hockey teams</p>
        </div>
        {canEdit && (
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.map((team) => (
              <tr key={team.id} className={team.swiss_id ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">
                      {team.display_name || team.name}
                    </div>
                    {team.swiss_id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title="Von Swiss Unihockey API synchronisiert">
                        🇨🇭 API
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.slug}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {canEdit && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveOrder(team, 'up')}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        disabled={teams.indexOf(team) === 0}
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <span>{team.display_order}</span>
                      <button
                        onClick={() => moveOrder(team, 'down')}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        disabled={teams.indexOf(team) === teams.length - 1}
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${team.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {team.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                    <button 
                      onClick={() => openModal(team)} 
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title={team.swiss_id ? 'Anzeigename bearbeiten' : 'Edit team'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => deleteTeam(team.id)} 
                      className={team.swiss_id ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}
                      title={team.swiss_id ? 'Team von Swiss Unihockey API - kann nicht gelöscht werden' : 'Delete team'}
                      disabled={!!team.swiss_id}
                    >
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
                {editingTeam ? (editingTeam.swiss_id ? 'Anzeigename bearbeiten' : 'Edit Team') : 'Add Team'}
              </h3>
              {editingTeam?.swiss_id && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">ℹ️ Swiss Unihockey Team:</span> Dieses Team wird von der API synchronisiert. 
                    Sie können nur den Anzeigenamen bearbeiten.
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {editingTeam?.swiss_id ? (
                  // Only show display_name for API teams
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anzeigename (optional)
                      <span className="text-xs text-gray-500 ml-2">Wird anstelle von "{editingTeam.name}" angezeigt</span>
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="Leer lassen für Standard-Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name (von API)</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Anzeigename (optional)
                        <span className="text-xs text-gray-500 ml-2">Wird anstelle vom Name angezeigt</span>
                      </label>
                      <input
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="Leer lassen für Standard-Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
                {!editingTeam?.swiss_id && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                        <input
                          type="text"
                          required
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Team Photo</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={formData.team_photo_url}
                            onChange={(e) => setFormData({ ...formData, team_photo_url: e.target.value })}
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
                        {formData.team_photo_url && (
                          <img src={formData.team_photo_url} alt="Preview" className="w-24 h-24 object-cover rounded" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Swissunihockey API Team ID</label>
                      <input
                        type="text"
                        value={formData.api_id}
                        onChange={(e) => setFormData({ ...formData, api_id: e.target.value })}
                        placeholder="430656"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <p className="text-xs text-gray-500 mt-1">Team ID von Swissunihockey für Spielanzeige</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Active</label>
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingTeam(null); resetForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingTeam ? 'Update' : 'Create'}
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
