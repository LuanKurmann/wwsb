import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PublicLayout from './components/layouts/PublicLayout';
import AdminLayout from './components/layouts/AdminLayout';
import HomePage from './pages/public/HomePage';
import GeschichtePage from './pages/public/GeschichtePage';
import FunktionaerePage from './pages/public/FunktionaerePage';
import TeamPage from './pages/public/TeamPage';
import ContactPage from './pages/public/ContactPage';
import DocumentsPage from './pages/public/DocumentsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import TeamsManagement from './pages/admin/TeamsManagement';
import PlayersManagement from './pages/admin/PlayersManagement';
import TrainersManagement from './pages/admin/TrainersManagement';
import SponsorsManagement from './pages/admin/SponsorsManagement';
import DocumentsManagement from './pages/admin/DocumentsManagement';
import TrainingSchedulesManagement from './pages/admin/TrainingSchedulesManagement';
import BoardMembersManagement from './pages/admin/BoardMembersManagement';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AllTeamsPage from './pages/public/AllTeamsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/geschichte" element={<GeschichtePage />} />
            <Route path="/funktionaere" element={<FunktionaerePage />} />
            <Route path="/teams" element={<AllTeamsPage />} /> 
            <Route path="/teams/:slug" element={<TeamPage />} />
            <Route path="/kontakt" element={<ContactPage />} />
            <Route path="/dokumente" element={<DocumentsPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="teams" element={<TeamsManagement />} />
            <Route path="players" element={<PlayersManagement />} />
            <Route path="trainers" element={<TrainersManagement />} />
            <Route path="training-schedules" element={<TrainingSchedulesManagement />} />
            <Route path="board-members" element={<BoardMembersManagement />} />
            <Route path="sponsors" element={<SponsorsManagement />} />
            <Route path="documents" element={<DocumentsManagement />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
