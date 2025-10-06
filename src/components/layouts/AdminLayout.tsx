import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Shield,
  UserCog,
  Award,
  FileText,
  LogOut,
  Menu,
  X,
  Calendar,
  Mail,
  Activity
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { path: '/admin/teams', label: 'Teams', icon: Shield },
  { path: '/admin/players', label: 'Players', icon: UserCog },
  { path: '/admin/trainers', label: 'Trainers', icon: UserCog },
  { path: '/admin/training-schedules', label: 'Training Schedules', icon: Calendar },
  { path: '/admin/board-members', label: 'Funktionäre', icon: Users },
  { path: '/admin/sponsors', label: 'Sponsors', icon: Award },
  { path: '/admin/documents', label: 'Documents', icon: FileText },
  { path: '/admin/messages', label: 'Nachrichten', icon: Mail, showBadge: true },
  { path: '/admin/activity-logs', label: 'Activity Logs', icon: Activity, superAdminOnly: true },
];

export default function AdminLayout() {
  const { signOut, profile, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    loadUnreadMessagesCount();
    
    // Set up real-time subscription for message updates
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_submissions'
        },
        () => {
          loadUnreadMessagesCount();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  async function loadUnreadMessagesCount() {
    try {
      const { count, error } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      
      if (error) throw error;
      setUnreadMessagesCount(count || 0);
    } catch (error) {
      console.error('Error loading unread messages count:', error);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen overflow-hidden">
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-6 border-b">
              <Link to="/" className="text-xl font-bold text-blue-600">WHITE WINGS</Link>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              {menuItems.map((item) => {
                if (item.adminOnly && !isAdmin) return null;
                if (item.superAdminOnly && !isSuperAdmin) return null;

                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path) && item.path !== '/admin';

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-6 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </div>
                    {item.showBadge && unreadMessagesCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t p-4">
              <div className="flex items-center mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name || profile?.email}</p>
                  <p className="text-xs text-gray-500">{profile?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm h-16 flex items-center px-4 md:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden mr-4 text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
