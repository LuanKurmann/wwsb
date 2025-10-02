import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Phone, User } from 'lucide-react';

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
}

export default function FunktionaerePage() {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoardMembers();
  }, []);

  async function loadBoardMembers() {
    try {
      const { data, error } = await supabase
        .from('board_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setBoardMembers(data || []);
    } catch (error) {
      console.error('Error loading board members:', error);
    } finally {
      setLoading(false);
    }
  }

  const vorstand = boardMembers.filter(m => m.category === 'Vorstand');
  const besitzer = boardMembers.filter(m => m.category === 'Besitzer/Nebenämter');
  const grossfeld = boardMembers.filter(m => m.category === 'Grossfeld');

  const renderMemberCard = (member: BoardMember) => (
    <div key={member.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
      <div className="bg-gray-200 h-48 flex items-center justify-center">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={`${member.first_name} ${member.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-24 h-24 text-gray-400" />
        )}
      </div>
      <div className="p-4 bg-blue-600 text-white">
        <h3 className="font-bold text-lg mb-1">
          {member.first_name} {member.last_name}
        </h3>
        <p className="text-sm text-blue-100">{member.position}</p>
      </div>
      <div className="p-4 space-y-2">
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="flex items-center text-sm text-gray-600 hover:text-blue-600"
          >
            <Mail className="w-4 h-4 mr-2" />
            {member.email}
          </a>
        )}
        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="flex items-center text-sm text-gray-600 hover:text-blue-600"
          >
            <Phone className="w-4 h-4 mr-2" />
            {member.phone}
          </a>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Funktionäre</h1>
          <p className="text-xl text-blue-100">Die Menschen hinter unserem Verein</p>
        </div>
      </section>

      {vorstand.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Vorstand</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vorstand.map(renderMemberCard)}
            </div>
          </div>
        </section>
      )}

      {besitzer.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Besitzer / Nebenämter</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {besitzer.map(renderMemberCard)}
            </div>
          </div>
        </section>
      )}

      {grossfeld.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Grossfeld</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grossfeld.map(renderMemberCard)}
            </div>
          </div>
        </section>
      )}

      {boardMembers.length === 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-500">Keine Funktionäre verfügbar</p>
          </div>
        </section>
      )}
    </div>
  );
}
