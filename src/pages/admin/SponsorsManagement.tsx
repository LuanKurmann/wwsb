import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
  display_order: number;
  is_active: boolean;
}

export default function SponsorsManagement() {
  const { canEdit, isAdmin } = useAuth();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    tier: 'standard',
    display_order: 0,
    is_active: true,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setSponsors(data || []);
    } catch (error) {
      console.error('Error loading sponsors:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 2097152) {
      alert('File size must be less than 2MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `sponsors/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, logo_url: publicUrl });
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const sponsorData = {
      name: formData.name,
      logo_url: formData.logo_url || null,
      website_url: formData.website_url || null,
      tier: formData.tier,
      display_order: formData.display_order,
      is_active: formData.is_active,
    };

    try {
      if (editingSponsor) {
        const { error } = await supabase
          .from('sponsors')
          .update(sponsorData)
          .eq('id', editingSponsor.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('sponsors').insert([sponsorData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingSponsor(null);
      resetForm();
      loadSponsors();
    } catch (error) {
      console.error('Error saving sponsor:', error);
      alert('Failed to save sponsor');
    }
  }

  async function deleteSponsor(id: string) {
    if (!confirm('Are you sure you want to delete this sponsor?')) return;

    try {
      const { error } = await supabase.from('sponsors').delete().eq('id', id);
      if (error) throw error;
      loadSponsors();
    } catch (error) {
      console.error('Error deleting sponsor:', error);
      alert('Failed to delete sponsor');
    }
  }

  async function moveOrder(sponsor: Sponsor, direction: 'up' | 'down') {
    const currentIndex = sponsors.findIndex(s => s.id === sponsor.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sponsors.length) return;

    const targetSponsor = sponsors[targetIndex];

    try {
      const updates = [
        supabase
          .from('sponsors')
          .update({ display_order: targetSponsor.display_order })
          .eq('id', sponsor.id),
        supabase
          .from('sponsors')
          .update({ display_order: sponsor.display_order })
          .eq('id', targetSponsor.id)
      ];

      await Promise.all(updates);
      loadSponsors();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      logo_url: '',
      website_url: '',
      tier: 'standard',
      display_order: 0,
      is_active: true,
    });
  }

  function openModal(sponsor?: Sponsor) {
    if (sponsor) {
      setEditingSponsor(sponsor);
      setFormData({
        name: sponsor.name,
        logo_url: sponsor.logo_url || '',
        website_url: sponsor.website_url || '',
        tier: sponsor.tier,
        display_order: sponsor.display_order,
        is_active: sponsor.is_active,
      });
    } else {
      setEditingSponsor(null);
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
          <h2 className="text-2xl font-bold text-gray-900">Sponsors Management</h2>
          <p className="text-gray-600 mt-1">Manage club sponsors</p>
        </div>
        {canEdit && (
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sponsor
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Website</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sponsors.map((sponsor) => (
              <tr key={sponsor.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{sponsor.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {sponsor.logo_url ? (
                    <img src={sponsor.logo_url} alt={sponsor.name} className="h-8 w-auto object-contain" />
                  ) : (
                    <span className="text-sm text-gray-400">No logo</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sponsor.website_url ? (
                    <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      Visit
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {sponsor.tier}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {canEdit && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveOrder(sponsor, 'up')}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        disabled={sponsors.indexOf(sponsor) === 0}
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <span>{sponsor.display_order}</span>
                      <button
                        onClick={() => moveOrder(sponsor, 'down')}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        disabled={sponsors.indexOf(sponsor) === sponsors.length - 1}
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sponsor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {sponsor.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                    <button onClick={() => openModal(sponsor)} className="text-blue-600 hover:text-blue-900 mr-4" title="Edit sponsor">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => deleteSponsor(sponsor.id)} className="text-red-600 hover:text-red-900" title="Delete sponsor">
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
                {editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">or</span>
                      <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {formData.logo_url && (
                      <img src={formData.logo_url} alt="Preview" className="w-24 h-24 object-cover rounded" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="premium">Premium</option>
                      <option value="standard">Standard</option>
                      <option value="basic">Basic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
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
                    onClick={() => { setShowModal(false); setEditingSponsor(null); resetForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingSponsor ? 'Update' : 'Create'}
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
