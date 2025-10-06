import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Trash2, Eye, EyeOff, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logUpdate, logDelete } from '../../lib/activityLog';

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_read: boolean;
  submitted_at: string;
}

export default function MessagesManagement() {
  const { isAdmin } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleReadStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ is_read: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Log the action
      await logUpdate('message', id, {
        action: currentStatus ? 'marked_as_unread' : 'marked_as_read'
      });
      
      loadMessages();
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Fehler beim Aktualisieren der Nachricht');
    }
  }

  async function deleteMessage(id: string) {
    if (!isAdmin) {
      alert('Nur Admins können Nachrichten löschen');
      return;
    }
    
    if (!confirm('Möchten Sie diese Nachricht wirklich löschen?')) return;

    try {
      // Save message details for log before deleting
      const messageToDelete = messages.find(m => m.id === id);
      
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Log the deletion
      await logDelete('message', id, {
        name: messageToDelete?.name,
        email: messageToDelete?.email
      });
      
      loadMessages();
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Fehler beim Löschen der Nachricht');
    }
  }

  const filteredMessages = messages.filter(msg => {
    if (filter === 'read') return msg.is_read;
    if (filter === 'unread') return !msg.is_read;
    return true;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

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
            <h2 className="text-2xl font-bold text-gray-900">Kontakt-Nachrichten</h2>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} ungelesen
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ungelesen ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Gelesen ({messages.length - unreadCount})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Keine Nachrichten gefunden</p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (!msg.is_read) {
                    toggleReadStatus(msg.id, msg.is_read);
                  }
                }}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer transition hover:shadow-md ${
                  selectedMessage?.id === msg.id ? 'ring-2 ring-blue-500' : ''
                } ${!msg.is_read ? 'border-l-4 border-blue-600' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{msg.name}</h3>
                      {!msg.is_read && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Neu
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 gap-3">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {msg.email}
                      </span>
                      {msg.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {msg.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">{msg.message}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.submitted_at).toLocaleString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="sticky top-6">
          {selectedMessage ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedMessage.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedMessage.is_read ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Gelesen
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Ungelesen
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleReadStatus(selectedMessage.id, selectedMessage.is_read)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title={selectedMessage.is_read ? 'Als ungelesen markieren' : 'Als gelesen markieren'}
                  >
                    {selectedMessage.is_read ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Nachricht löschen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <Mail className="w-4 h-4" />
                    {selectedMessage.email}
                  </a>
                </div>

                {selectedMessage.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <a
                      href={`tel:${selectedMessage.phone}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <Phone className="w-4 h-4" />
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nachricht</label>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-900 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eingegangen am</label>
                  <p className="text-gray-600">
                    {new Date(selectedMessage.submitted_at).toLocaleString('de-CH', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Wählen Sie eine Nachricht aus, um Details anzuzeigen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
