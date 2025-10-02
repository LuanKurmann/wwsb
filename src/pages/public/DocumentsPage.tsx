import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DocumentCategory {
  id: string;
  name: string;
  slug: string;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  category_id: string | null;
}

export default function DocumentsPage() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [categoriesRes, documentsRes] = await Promise.all([
      supabase.from('document_categories').select('*').eq('is_active', true),
      supabase.from('documents').select('*').eq('is_active', true),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (documentsRes.data) setDocuments(documentsRes.data);
  }

  function getDocumentsByCategory(categoryId: string) {
    return documents.filter((doc) => doc.category_id === categoryId);
  }

  return (
    <div>
      <section
        className="relative h-64 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/262524/pexels-photo-262524.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-600/70"></div>
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
            <h1 className="text-5xl font-bold">Informationen und Dokumente</h1>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.length > 0 ? (
            categories.map((category) => {
              const categoryDocs = getDocumentsByCategory(category.id);
              if (categoryDocs.length === 0) return null;

              return (
                <div key={category.id} className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryDocs.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                      >
                        <div className="flex items-center flex-1">
                          <div className="bg-blue-100 p-3 rounded-lg mr-4">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                            {doc.description && (
                              <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                            )}
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 ml-4" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Keine Dokumente verfügbar</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
