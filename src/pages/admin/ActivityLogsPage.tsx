import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, Filter, User, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getActionLabel, getEntityTypeLabel } from '../../lib/activityLog';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export default function ActivityLogsPage() {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(50);

  useEffect(() => {
    if (isSuperAdmin) {
      loadLogs();
    }
  }, [isSuperAdmin]);

  async function loadLogs() {
    try {
      setLoading(true);
      
      // Get logs
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (logsError) throw logsError;

      // Get unique user IDs
      const userIds = Array.from(new Set(logsData?.map(log => log.user_id) || []));
      
      // Get user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map for quick lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Map the data to include user info
      const logsWithUserInfo = (logsData || []).map((log: any) => {
        const profile = profilesMap.get(log.user_id);
        return {
          ...log,
          user_email: profile?.email,
          user_name: profile?.full_name,
        };
      });

      setLogs(logsWithUserInfo);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h2>
          <p className="text-gray-600">Nur Super-Admins können Activity Logs einsehen.</p>
        </div>
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

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filterAction && log.action !== filterAction) return false;
    if (filterEntityType && log.entity_type !== filterEntityType) return false;
    return true;
  });

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Get unique actions and entity types for filters
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));
  const uniqueEntityTypes = Array.from(new Set(logs.map(l => l.entity_type)));

  // Get action color
  function getActionColor(action: string): string {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
            <p className="text-gray-600 mt-1">Vollständiges Protokoll aller Admin-Aktionen</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-lg shadow">
          <Filter className="w-5 h-5 text-gray-500" />
          
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle Aktionen</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>
                {getActionLabel(action)}
              </option>
            ))}
          </select>

          <select
            value={filterEntityType}
            onChange={(e) => {
              setFilterEntityType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle Entitäten</option>
            {uniqueEntityTypes.map(type => (
              <option key={type} value={type}>
                {getEntityTypeLabel(type)}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-600">
            {filteredLogs.length} Einträge
          </span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zeitstempel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Benutzer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entität</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Keine Logs gefunden
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(log.created_at).toLocaleString('de-CH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.user_name || 'Unbekannt'}
                          </div>
                          <div className="text-xs text-gray-500">{log.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getEntityTypeLabel(log.entity_type)}
                      </div>
                      {log.entity_id && (
                        <div className="text-xs text-gray-500 font-mono">
                          ID: {log.entity_id.substring(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.details ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-800">
                            Details anzeigen
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded max-w-md overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                  Zeige <span className="font-medium">{indexOfFirstLog + 1}</span> bis{' '}
                  <span className="font-medium">{Math.min(indexOfLastLog, filteredLogs.length)}</span> von{' '}
                  <span className="font-medium">{filteredLogs.length}</span> Logs
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Show max 5 page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
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
                    );
                  })}
                  
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
    </div>
  );
}
