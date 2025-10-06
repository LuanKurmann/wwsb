import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, FileText, Folder, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logCreate, logUpdate, logDelete } from '../../lib/activityLog';

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category_id: string | null;
  display_order: number;
  download_count: number;
  is_active: boolean;
  category?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export default function DocumentsManagement() {
  const { canEdit, isAdmin } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [docFormData, setDocFormData] = useState({
    title: '',
    description: '',
    file_url: '',
    file_type: '',
    file_size: 0,
    category_id: '',
    display_order: 0,
    is_active: true,
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [catFormData, setCatFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [docsRes, catsRes] = await Promise.all([
        supabase
          .from('documents')
          .select('*, document_categories(name)')
          .order('display_order'),
        supabase
          .from('document_categories')
          .select('*')
          .order('display_order'),
      ]);

      if (docsRes.data) {
        setDocuments(docsRes.data.map(doc => ({
          ...doc,
          category: doc.document_categories ? { name: doc.document_categories.name } : undefined
        })));
      }
      if (catsRes.data) setCategories(catsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document, or image file');
      return;
    }

    if (file.size > 10485760) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setDocFormData({
        ...docFormData,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleDocSubmit(e: React.FormEvent) {
    e.preventDefault();

    const docData = {
      title: docFormData.title,
      description: docFormData.description || null,
      file_url: docFormData.file_url,
      file_type: docFormData.file_type || null,
      file_size: docFormData.file_size || null,
      category_id: docFormData.category_id || null,
      display_order: docFormData.display_order,
      is_active: docFormData.is_active,
    };

    try {
      if (editingDocument) {
        const { error } = await supabase
          .from('documents')
          .update(docData)
          .eq('id', editingDocument.id);

        if (error) throw error;
        await logUpdate('document', editingDocument.id, { title: docData.title });
      } else {
        const { data, error } = await supabase.from('documents').insert([docData]).select().single();
        if (error) throw error;
        await logCreate('document', data.id, { title: docData.title });
      }

      setShowDocModal(false);
      setEditingDocument(null);
      resetDocForm();
      loadData();
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document');
    }
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();

    const catData = {
      name: catFormData.name,
      slug: catFormData.slug,
      description: catFormData.description || null,
      is_active: catFormData.is_active,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('document_categories')
          .update(catData)
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('document_categories').insert([catData]);
        if (error) throw error;
      }

      setShowCatModal(false);
      setEditingCategory(null);
      resetCatForm();
      loadData();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const docToDelete = documents.find(d => d.id === id);
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      await logDelete('document', id, { title: docToDelete?.title });
      loadData();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category? Documents in this category will not be deleted.')) return;

    try {
      const catToDelete = categories.find(c => c.id === id);
      const { error } = await supabase.from('document_categories').delete().eq('id', id);
      if (error) throw error;
      await logDelete('document', id, { category: catToDelete?.name });
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  }

  function resetDocForm() {
    setDocFormData({
      title: '',
      description: '',
      file_url: '',
      file_type: '',
      file_size: 0,
      category_id: '',
      display_order: 0,
      is_active: true,
    });
  }

  function resetCatForm() {
    setCatFormData({
      name: '',
      slug: '',
      description: '',
      is_active: true,
    });
  }

  function openDocModal(document?: Document) {
    if (document) {
      setEditingDocument(document);
      setDocFormData({
        title: document.title,
        description: document.description || '',
        file_url: document.file_url,
        file_type: document.file_type || '',
        file_size: document.file_size || 0,
        category_id: document.category_id || '',
        display_order: document.display_order,
        is_active: document.is_active,
      });
    } else {
      setEditingDocument(null);
      resetDocForm();
    }
    setShowDocModal(true);
  }

  function openCatModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setCatFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      resetCatForm();
    }
    setShowCatModal(true);
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
          <h2 className="text-2xl font-bold text-gray-900">Documents Management</h2>
          <p className="text-gray-600 mt-1">Manage documents and categories</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => openCatModal()}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Folder className="w-4 h-4 mr-2" />
            Add Category
          </button>
          {canEdit && (
            <button
              onClick={() => openDocModal()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-700">{category.name}</span>
                  <div className="flex space-x-2">
                    <button onClick={() => openCatModal(category)} className="text-blue-600 hover:text-blue-900">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCategory(category.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downloads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                          {doc.description && (
                            <div className="text-xs text-gray-500">{doc.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                      {doc.file_type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.download_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {doc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canEdit && (
                        <button onClick={() => openDocModal(doc)} className="text-blue-600 hover:text-blue-900 mr-4" title="Edit document">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => deleteDocument(doc.id)} className="text-red-600 hover:text-red-900" title="Delete document">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingDocument ? 'Edit Document' : 'Add Document'}
              </h3>
              <form onSubmit={handleDocSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={docFormData.title}
                    onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={docFormData.description}
                    onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={docFormData.file_url}
                        onChange={(e) => setDocFormData({ ...docFormData, file_url: e.target.value })}
                        placeholder="https://example.com/document.pdf"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">or</span>
                      <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">{uploadingFile ? 'Uploading...' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {docFormData.file_url && (
                      <div className="text-sm text-gray-600">
                        <FileText className="w-4 h-4 inline mr-1" />
                        File selected: {docFormData.file_url.split('/').pop()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={docFormData.category_id}
                      onChange={(e) => setDocFormData({ ...docFormData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                    <input
                      type="text"
                      value={docFormData.file_type}
                      onChange={(e) => setDocFormData({ ...docFormData, file_type: e.target.value })}
                      placeholder="PDF, DOCX, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="doc_is_active"
                    checked={docFormData.is_active}
                    onChange={(e) => setDocFormData({ ...docFormData, is_active: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="doc_is_active" className="text-sm font-medium text-gray-700">Active</label>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => { setShowDocModal(false); setEditingDocument(null); resetDocForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingDocument ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <form onSubmit={handleCatSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={catFormData.name}
                    onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={catFormData.slug}
                    onChange={(e) => setCatFormData({ ...catFormData, slug: e.target.value })}
                    placeholder="category-slug"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={catFormData.description}
                    onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="cat_is_active"
                    checked={catFormData.is_active}
                    onChange={(e) => setCatFormData({ ...catFormData, is_active: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="cat_is_active" className="text-sm font-medium text-gray-700">Active</label>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => { setShowCatModal(false); setEditingCategory(null); resetCatForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingCategory ? 'Update' : 'Create'}
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
