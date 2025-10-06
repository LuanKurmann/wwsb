import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Clock, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logCreate, logUpdate, logDelete } from '../../lib/activityLog';

interface TrainingSchedule {
  id: string;
  team_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
  notes: string | null;
  is_active: boolean;
  teams?: { name: string };
}

interface Team {
  id: string;
  name: string;
}

const DAYS_OF_WEEK = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag'
];

export default function TrainingSchedulesManagement() {
  const { canEdit, isAdmin } = useAuth();
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [allSchedules, setAllSchedules] = useState<TrainingSchedule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TrainingSchedule | null>(null);
  const [filterTeamId, setFilterTeamId] = useState<string>('');
  const [formData, setFormData] = useState({
    team_id: '',
    day_of_week: 1,
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    loadSchedules();
    loadTeams();
  }, []);

  async function loadSchedules() {
    try {
      const { data, error } = await supabase
        .from('training_schedules')
        .select('*, teams(name)')
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setAllSchedules(data || []);
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const scheduleData = {
      team_id: formData.team_id,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location,
      notes: formData.notes || null,
      is_active: formData.is_active,
    };

    try {
      const team = teams.find(t => t.id === formData.team_id);
      
      if (editingSchedule) {
        const { error } = await supabase
          .from('training_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;
        await logUpdate('training_schedule', editingSchedule.id, { team: team?.name, day: DAYS_OF_WEEK[formData.day_of_week] });
      } else {
        const { data, error } = await supabase.from('training_schedules').insert([scheduleData]).select().single();
        if (error) throw error;
        await logCreate('training_schedule', data.id, { team: team?.name, day: DAYS_OF_WEEK[formData.day_of_week] });
      }

      setShowModal(false);
      setEditingSchedule(null);
      resetForm();
      loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm('Are you sure you want to delete this training schedule?')) return;

    try {
      const scheduleToDelete = allSchedules.find(s => s.id === id);
      const { error } = await supabase.from('training_schedules').delete().eq('id', id);
      if (error) throw error;
      await logDelete('training_schedule', id, { team: scheduleToDelete?.teams?.name, day: DAYS_OF_WEEK[scheduleToDelete?.day_of_week || 0] });
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  }

  function resetForm() {
    setFormData({
      team_id: '',
      day_of_week: 1,
      start_time: '',
      end_time: '',
      location: '',
      notes: '',
      is_active: true,
    });
  }

  function openModal(schedule?: TrainingSchedule) {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        team_id: schedule.team_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        location: schedule.location,
        notes: schedule.notes || '',
        is_active: schedule.is_active,
      });
    } else {
      setEditingSchedule(null);
      resetForm();
    }
    setShowModal(true);
  }

  useEffect(() => {
    if (filterTeamId === '') {
      setSchedules(allSchedules);
    } else {
      setSchedules(allSchedules.filter(schedule => schedule.team_id === filterTeamId));
    }
  }, [filterTeamId, allSchedules]);

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
            <h2 className="text-2xl font-bold text-gray-900">Training Schedules</h2>
            <p className="text-gray-600 mt-1">Manage training times for teams</p>
          </div>
          {canEdit && (
            <button
              onClick={() => openModal()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterTeamId}
            onChange={(e) => setFilterTeamId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          {filterTeamId && (
            <span className="text-sm text-gray-600">
              {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {schedule.teams?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {DAYS_OF_WEEK[schedule.day_of_week]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    {schedule.start_time} - {schedule.end_time}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {schedule.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {schedule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                    <button onClick={() => openModal(schedule)} className="text-blue-600 hover:text-blue-900 mr-4" title="Edit schedule">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => deleteSchedule(schedule.id)} className="text-red-600 hover:text-red-900" title="Delete schedule">
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
                {editingSchedule ? 'Edit Training Schedule' : 'Add Training Schedule'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team *</label>
                  <select
                    required
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week *</label>
                    <select
                      required
                      value={formData.day_of_week}
                      onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {DAYS_OF_WEEK.map((day, index) => (
                        <option key={index} value={index}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Sporthalle Schüpfen"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional information about the training..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                    onClick={() => { setShowModal(false); setEditingSchedule(null); resetForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingSchedule ? 'Update' : 'Create'}
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
