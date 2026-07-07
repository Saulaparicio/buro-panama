import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const CommunityTab: React.FC<{ profile: any }> = ({ profile }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from('community_events')
        .select('*')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3);

      if (eventsData) setEvents(eventsData);

      // Fetch active members (excluding self optionally, but keeping for directory)
      const { data: membersData } = await supabase
        .from('profiles')
        .select('id, name, company, avatar_url, role')
        .eq('status', 'active')
        .limit(20);

      if (membersData) setMembers(membersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) || 
    m.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 animate-fade pb-[120px]">
      <h2 className="text-2xl font-display font-medium tracking-tight text-[#111111]">Comunidad</h2>

      {/* Announcements */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Anuncios y Eventos</h3>
          {events.length > 1 && (
            <button className="text-[9px] font-bold uppercase tracking-widest text-[#111111]">Ver Todos</button>
          )}
        </div>
        
        {loading ? (
          <div className="bg-gray-100 rounded-[24px] p-6 h-[200px] animate-pulse"></div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-[24px] p-6 text-center shadow-sm">
            <span className="material-symbols-outlined text-gray-300 !text-4xl mb-2">event_busy</span>
            <p className="text-sm font-bold text-gray-500">No hay eventos próximos</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
            {events.map((event, idx) => (
              <div 
                key={event.id} 
                className={`w-full min-w-[280px] shrink-0 snap-center rounded-[24px] p-6 relative overflow-hidden shadow-sm ${idx % 2 === 0 ? 'bg-[#FDE910] text-[#111111]' : 'bg-[#111111] text-white'}`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="material-symbols-outlined !text-6xl">campaign</span>
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${idx % 2 === 0 ? 'text-[#111111]/50' : 'text-white/50'}`}>
                  {format(parseISO(event.event_date), "EEEE d 'de' MMMM, h:mm a", { locale: es })}
                </p>
                <h4 className="text-lg font-black uppercase tracking-tight leading-tight mb-2 pr-8">{event.title}</h4>
                <p className={`text-sm font-medium mb-6 line-clamp-2 ${idx % 2 === 0 ? 'text-[#111111]/80' : 'text-white/80'}`}>
                  {event.description}
                </p>
                <button className={`px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm ${idx % 2 === 0 ? 'bg-[#111111] text-white' : 'bg-[#FDE910] text-[#111111]'}`}>
                  {idx % 2 === 0 ? 'Confirmar Asistencia' : 'Me Interesa'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Directory Preview */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Directorio de Miembros</h3>
        </div>
        <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-4 space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o empresa..."
              className="w-full bg-[#F9F9FB] border-none rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#111111]/10 transition-all placeholder:text-gray-400"
            />
          </div>
          
          {loading ? (
             <div className="flex gap-3 overflow-x-hidden">
               {[1,2,3,4].map(i => <div key={i} className="size-16 rounded-full bg-gray-100 shrink-0 animate-pulse"></div>)}
             </div>
          ) : filteredMembers.length === 0 ? (
             <p className="text-center text-xs text-gray-400 py-4">No se encontraron miembros.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {filteredMembers.map(member => (
                <div key={member.id} className="shrink-0 text-center w-[76px]">
                  <div className="size-16 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden mb-2 mx-auto">
                    <img 
                      src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=FDE910&color=111111`} 
                      alt={member.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-xs font-bold text-[#111111] truncate px-1">{member.name?.split(' ')[0]}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest truncate px-1">{member.company || 'Miembro'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
