import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvitationByToken, acceptInvitation } from '../../lib/playerInvitations';
import { UserCheck, Lock, Mail, Loader } from 'lucide-react';

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  async function loadInvitation() {
    setLoading(true);
    try {
      const { data, error: invError } = await getInvitationByToken(token!);
      if (invError || !data) {
        setError(invError?.message || 'Einladung nicht gefunden');
      } else {
        setInvitation(data);
      }
    } catch (err) {
      setError('Fehler beim Laden der Einladung');
    } finally {
      setLoading(false);
    }
  }

  function validatePassword() {
    if (password.length < 8) {
      setPasswordError('Passwort muss mindestens 8 Zeichen lang sein');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwörter stimmen nicht überein');
      return false;
    }
    setPasswordError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validatePassword()) return;

    setSubmitting(true);
    try {
      const { error: acceptError } = await acceptInvitation(token!, password);
      
      if (acceptError) {
        setError(acceptError.message);
      } else {
        // Redirect to player dashboard after successful registration
        navigate('/player/dashboard');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Fehler beim Erstellen des Accounts');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Einladung wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <Mail className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Ungültige Einladung</h2>
            <p className="mt-2 text-gray-600">
              {error || 'Diese Einladung ist nicht mehr gültig oder wurde bereits verwendet.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Zur Startseite
            </button>
          </div>
        </div>
      </div>
    );
  }

  const player = invitation.player;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <UserCheck className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Willkommen!</h2>
          <p className="mt-2 text-gray-600">
            Erstellen Sie Ihren Account für White Wings Unihockey
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Spieler:</strong> {player.first_name} {player.last_name}
          </p>
          <p className="text-sm text-blue-800 mt-1">
            <strong>E-Mail:</strong> {invitation.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Lock className="w-4 h-4 inline mr-1" />
              Passwort *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Lock className="w-4 h-4 inline mr-1" />
              Passwort bestätigen *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{passwordError}</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-xs text-gray-600">
              Mit der Registrierung erhalten Sie Zugriff auf:
            </p>
            <ul className="mt-2 text-xs text-gray-600 space-y-1">
              <li>✓ Ihr persönliches Profil</li>
              <li>✓ Team-Informationen</li>
              <li>✓ Trainings- und Spielpläne</li>
              <li>✓ Team-interne Dokumente</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting || !password || !confirmPassword}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Account wird erstellt...
              </>
            ) : (
              <>
                <UserCheck className="w-5 h-5" />
                Account erstellen
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
