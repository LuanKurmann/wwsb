import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logCreate, logUpdate, logDelete } from '../../lib/activityLog';

interface BoardMember {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  category: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  display_order: number;
  is_active: boolean;
}

export default function BoardMembersManagement() {
  const { canEdit, isAdmin } = useAuth();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    position: '',
    category: 'Vorstand',
    email: '',
    phone: '',
    photo_url: '',
    display_order: 0,
    is_active: true,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      const { data, error } = await supabase
        .from('board_members')
        .select('*')
        .order('category')
        .order('display_order');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading board members:', error);
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
      const filePath = `board-members/${fileName}`;

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

    const memberData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      position: formData.position,
      category: formData.category,
      email: formData.email || null,
      phone: formData.phone || null,
      photo_url: formData.photo_url || null,
      display_order: formData.display_order,
      is_active: formData.is_active,
    };

    try {
      if (editingMember) {
        const { error } = await supabase
          .from('board_members')
          .update(memberData)
          .eq('id', editingMember.id);

        if (error) throw error;
        await logUpdate('board_member', editingMember.id, { name: `${memberData.first_name} ${memberData.last_name}`, position: memberData.position });
      } else {
        const { data, error } = await supabase.from('board_members').insert([memberData]).select().single();
        if (error) throw error;
        await logCreate('board_member', data.id, { name: `${memberData.first_name} ${memberData.last_name}`, position: memberData.position });
      }

      setShowModal(false);
      setEditingMember(null);
      resetForm();
      loadMembers();
    } catch (error) {
      console.error('Error saving board member:', error);
      alert('Failed to save board member');
    }
  }

  async function deleteMember(id: string) {
    if (!confirm('Are you sure you want to delete this board member?')) return;

    try {
      const memberToDelete = members.find(m => m.id === id);
      const { error } = await supabase.from('board_members').delete().eq('id', id);
      if (error) throw error;
      await logDelete('board_member', id, { name: `${memberToDelete?.first_name} ${memberToDelete?.last_name}`, position: memberToDelete?.position });
      loadMembers();
    } catch (error) {
      console.error('Error deleting board member:', error);
      alert('Failed to delete board member');
    }
  }

  function resetForm() {
    setFormData({
      first_name: '',
      last_name: '',
      position: '',
      category: 'Vorstand',
      email: '',
      phone: '',
      photo_url: '',
      display_order: 0,
      is_active: true,
    });
  }

  function openModal(member?: BoardMember) {
    if (member) {
      setEditingMember(member);
      setFormData({
        first_name: member.first_name,
        last_name: member.last_name,
        position: member.position,
        category: member.category,
        email: member.email || '',
        phone: member.phone || '',
        photo_url: member.photo_url || '',
        display_order: member.display_order,
        is_active: member.is_active,
      });
    } else {
      setEditingMember(null);
      resetForm();
    }
    setShowModal(true);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Funktionäre Verwaltung</h1>
        {canEdit && (
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Funktionär hinzufügen
          </button>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {member.first_name} {member.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.position}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                    <button onClick={() => openModal(member)} className="text-blue-600 hover:text-blue-900 mr-4" title="Edit board member">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => deleteMember(member.id)} className="text-red-600 hover:text-red-900" title="Delete board member">
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
                {editingMember ? 'Funktionär bearbeiten' : 'Neuer Funktionär'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vorname *</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nachname *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Vorstand">Vorstand</option>
                    <option value="Besitzer/Nebenämter">Besitzer/Nebenämter</option>
                    <option value="Grossfeld">Grossfeld</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anzeigereihenfolge</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Aktiv</label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingMember(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingMember ? 'Speichern' : 'Hinzufügen'}
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
