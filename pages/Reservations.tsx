import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
// Types are inferred from Supabase joins (reservation + room + profile)
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addDays, subDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';

type UserRole = 'admin' | 'member' | 'staff';

interface Room {
  id: string;
  name: string;
  type?: string;
  capacity?: number;
  price?: number;
}

interface ReservationsProps {
  role: UserRole;
}

const Reservations: React.FC<ReservationsProps> = ({ role }) => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (tenant) {
        fetchData();
    }
  }, [currentMonth, tenant]);

  const fetchData = async () => {
    if (!tenant) return;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);

      const [roomsRes, reservationsRes] = await Promise.all([
        supabase.from('spaces').select('*').eq('tenant_id', tenant.id).order('name'),
        role === 'admin' 
          ? supabase.from('reservations').select('*, space:spaces(*), profile:profiles(*)').eq('tenant_id', tenant.id).order('start_time', { ascending: false })
          : supabase.from('reservations').select('*, space:spaces(*)').eq('member_id', user.id).eq('tenant_id', tenant.id).order('start_time', { ascending: false })
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (reservationsRes.error) throw reservationsRes.error;

      setRooms(roomsRes.data || []);
      setReservations(reservationsRes.data || []);
    } catch (err: any) {
      toast.error('Error al cargar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveReservation = async (id: string, newDate: Date) => {
    try {
      const dateStr = format(newDate, 'yyyy-MM-dd');
      
      // Update local state for immediate feedback
      setReservations(prev => prev.map(res => 
        res.id === id ? { ...res, date: dateStr } : res
      ));

      const { error } = await supabase
        .from('reservations')
        .update({ date: dateStr })
        .eq('id', id)
        .eq('tenant_id', tenant?.id);

      if (error) throw error;
      toast.success('Reserva movida al ' + format(newDate, 'dd/MM'));
      fetchData();
    } catch (err: any) {
      toast.error('Error al mover reserva: ' + err.message);
      fetchData();
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!window.confirm('¿Confirmas la anulación de este espacio reservado?')) return;
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('tenant_id', tenant?.id);

      if (error) throw error;
      toast.success('Reserva anulada con éxito');
      fetchData();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (statusFilter === 'all') return true;
    return res.status === statusFilter;
  });

  const getDayReservations = (date: Date) => {
    return filteredReservations.filter(res => isSameDay(parseISO(res.date), date));
  };

  const renderCalendar = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-7 gap-px bg-[var(--outline-variant)]/20 rounded-xl overflow-hidden border border-[var(--outline-variant)]/20 animate-fade shadow-2xl">
        {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(d => (
          <div key={d} className="bg-[var(--surface-container-low)] p-6 text-center label-md text-[10px] opacity-40 font-black tracking-[0.2em]">{d}</div>
        ))}
        {days.map((day, idx) => {
          const dayRes = getDayReservations(day);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

          return (
            <div 
              key={idx}
              onClick={() => setSelectedDate(day)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const resId = e.dataTransfer.getData('resId');
                if (resId) handleMoveReservation(resId, day);
              }}
              className={`min-h-[160px] p-6 transition-all duration-700 cursor-pointer group hover:z-10 relative ${
                isSelected ? 'bg-[var(--primary)]' : isCurrentMonth ? 'bg-[var(--surface)] hover:bg-[var(--on-primary-fixed)]' : 'bg-[var(--surface-container-low)] opacity-30 grayscale'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`label-md text-xs font-black tracking-widest transition-colors duration-700 ${
                  isSelected ? 'text-[var(--on-primary-fixed)]' : isTodayDay ? 'text-[var(--primary)]' : 'text-[var(--on-primary-fixed)] group-hover:text-white'
                }`}>{format(day, 'd')}</span>
                  <div className="size-2 rounded-lg bg-[var(--primary)] group-hover:bg-white animate-pulse"></div>
              </div>
              
              <div className="space-y-2">
                {dayRes.slice(0, 2).map(res => (
                  <div 
                    key={res.id} 
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('resId', res.id)}
                    className={`text-[9px] p-2 rounded-lg truncate font-bold uppercase tracking-widest cursor-move active:opacity-50 ${
                      isSelected ? 'bg-[var(--on-primary-fixed)]/10 text-[var(--on-primary-fixed)]' : 'bg-[var(--on-primary-fixed)]/5 text-[var(--on-primary-fixed)] group-hover:bg-white/10 group-hover:text-white'
                    }`}
                  >
                    {res.space?.name || 'ESPACIO'}
                  </div>
                ))}
                {dayRes.length > 2 && (
                  <p className={`text-[8px] font-black uppercase text-center mt-2 ${isSelected ? 'text-[var(--on-primary-fixed)]/40' : 'text-[var(--on-primary-fixed)]/30 group-hover:text-white/30'}`}>
                    +{dayRes.length - 2} ADICIONALES
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-500 bg-green-500/5';
      case 'pending': return 'text-[var(--primary)] bg-[var(--primary)]/5';
      case 'cancelled': return 'text-red-500 bg-red-500/5';
      default: return 'text-stone-400 bg-stone-400/5';
    }
  };

  return (
    <div className="space-y-12 animate-fade pb-20">
      {/* Minimalist Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-[var(--outline-variant)]/10">
        <div className="flex flex-col">
            <div className="flex items-center gap-5 mb-4">
                <div className="size-12 bg-[#6b6d00] text-white rounded-xl flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined !text-2xl">calendar_month</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase leading-none">Reservas & Agenda</h1>
            </div>
            <p className="text-sm font-medium opacity-60 font-jakarta leading-relaxed max-w-2xl">
                Gestión logística de espacios, salas de juntas y bureau management en tiempo real.
            </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <button 
                onClick={() => navigate('/home')}
                className="w-full md:w-auto px-8 py-3.5 bg-[var(--on-primary-fixed)] text-[var(--primary)] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all duration-500 flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined !text-sm">add</span>
                Nueva Reserva
            </button>
            
            <div className="flex bg-[var(--surface-container-low)] p-1.5 rounded-xl border border-[var(--outline-variant)]/10 shadow-sm">
                <button 
                    onClick={() => setView('calendar')}
                    className={`px-6 py-2 rounded-lg transition-all duration-500 flex items-center justify-center ${view === 'calendar' ? 'bg-white text-[var(--on-primary-fixed)] shadow-md' : 'text-[var(--on-primary-fixed)]/30 hover:text-[var(--on-primary-fixed)]'}`}
                >
                    <span className="material-symbols-outlined !text-xl">calendar_view_month</span>
                </button>
                <button 
                    onClick={() => setView('list')}
                    className={`px-6 py-2 rounded-lg transition-all duration-500 flex items-center justify-center ${view === 'list' ? 'bg-white text-[var(--on-primary-fixed)] shadow-md' : 'text-[var(--on-primary-fixed)]/30 hover:text-[var(--on-primary-fixed)]'}`}
                >
                    <span className="material-symbols-outlined !text-xl">view_list</span>
                </button>
            </div>
        </div>
      </header>

      <div className="space-y-12">
        {/* Controls - Date Switcher & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-10">
             <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="size-12 rounded-xl border border-[var(--outline-variant)]/30 flex items-center justify-center hover:bg-[var(--on-primary-fixed)] hover:text-white transition-all duration-500"
              >
                <span className="material-symbols-outlined !text-xl">chevron_left</span>
              </button>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-[var(--on-primary-fixed)] min-w-[180px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="size-12 rounded-xl border border-[var(--outline-variant)]/30 flex items-center justify-center hover:bg-[var(--on-primary-fixed)] hover:text-white transition-all duration-500"
              >
                <span className="material-symbols-outlined !text-xl">chevron_right</span>
              </button>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 md:pb-0 w-full md:w-auto">
            {['all', 'confirmed', 'pending', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-8 py-3 rounded-xl label-md font-black uppercase text-[10px] tracking-widest transition-all duration-500 border whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-[var(--on-primary-fixed)] text-white border-black' 
                    : 'bg-white text-[var(--on-primary-fixed)]/40 border-[var(--outline-variant)]/20 hover:border-[var(--on-primary-fixed)]'
                }`}
              >
                {status === 'all' ? 'Ver Todo' : status === 'confirmed' ? 'Confirmadas' : status === 'pending' ? 'Pendientes' : 'Canceladas'}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main View Column */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="h-[600px] flex items-center justify-center card-workspace">
                <div className="size-16 border-2 border-[var(--outline-variant)] border-t-[var(--on-primary-fixed)] rounded-full animate-spin"></div>
              </div>
            ) : view === 'calendar' ? (
              renderCalendar()
            ) : (
              <div className="space-y-6">
                {filteredReservations.length === 0 ? (
                  <div className="py-40 text-center space-y-6 opacity-20 card-workspace">
                    <span className="material-symbols-outlined !text-7xl">event_busy</span>
                    <p className="label-md tracking-[0.5em] uppercase font-black">Sin registros en este periodo</p>
                  </div>
                ) : (
                  filteredReservations.map(res => (
                    <div 
                      key={res.id} 
                      draggable={res.status !== 'cancelled'}
                      onDragStart={(e) => e.dataTransfer.setData('resId', res.id)}
                      className={`card-workspace p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-700 ${res.status !== 'cancelled' ? 'cursor-move' : 'opacity-60'}`}
                    >
                      <div className="flex items-center gap-8">
                        <div className="size-16 rounded-xl bg-[var(--surface-container-low)] flex flex-col items-center justify-center border border-[var(--outline-variant)]/10 text-[var(--on-primary-fixed)] group-hover:bg-[var(--on-primary-fixed)] group-hover:text-white transition-all duration-700">
                          <span className="label-md text-[9px] font-black uppercase tracking-widest">{format(parseISO(res.date), 'MMM', { locale: es })}</span>
                          <span className="text-2xl font-bold tracking-tighter leading-none">{format(parseISO(res.date), 'dd')}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="title-md font-display uppercase tracking-tighter text-[var(--on-primary-fixed)]">{res.space?.name || 'Estación de Trabajo'}</h3>
                            <span className={`px-4 py-1 rounded-lg label-md text-[8px] font-black uppercase tracking-[0.2em] ${getStatusColor(res.status)}`}>
                              {res.status}
                            </span>
                          </div>
                          <p className="label-md text-[10px] opacity-40 uppercase tracking-widest flex items-center gap-2">
                             <span className="material-symbols-outlined !text-base">schedule</span>
                             {res.start_time} — {res.end_time}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {role === 'admin' && (
                           <div className="text-right hidden sm:block mr-4">
                              <p className="label-md text-[9px] opacity-30 uppercase tracking-widest font-black">Reservado por</p>
                              <p className="label-md text-[11px] font-bold text-[var(--on-primary-fixed)] uppercase">{res.profile?.name || 'Miembro'}</p>
                           </div>
                        )}
                        {res.status !== 'cancelled' && (
                          <button 
                            onClick={() => handleCancelReservation(res.id)}
                            className="size-14 rounded-xl border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-500"
                            title="Anular Reserva"
                          >
                            <span className="material-symbols-outlined !text-xl">close</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar Area - Daily Focus */}
          <div className="lg:col-span-4 space-y-12">
            <div className="card-workspace p-10 space-y-10">
              <div className="flex items-center gap-4">
                <span className="label-md opacity-30 text-[9px] uppercase tracking-widest">Enfoque Diario</span>
                <div className="h-px flex-1 bg-[var(--on-primary-fixed)]/10"></div>
              </div>
              
              <div className="space-y-4">
                <p className="label-md text-[10px] opacity-40 uppercase tracking-widest font-black">Cronograma para</p>
                <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--on-primary-fixed)]">
                  {format(selectedDate, "eeee dd 'de' MMMM", { locale: es })}
                </h3>
              </div>

              <div className="space-y-6 pt-10 border-t border-[var(--outline-variant)]/10">
                {getDayReservations(selectedDate).length === 0 ? (
                  <div className="py-12 text-center opacity-30 label-md text-[10px] lowercase tracking-widest">
                    no hay eventos programados para esta fecha
                  </div>
                ) : (
                  getDayReservations(selectedDate).map(res => (
                    <div 
                      key={res.id} 
                      draggable={res.status !== 'cancelled'}
                      onDragStart={(e) => e.dataTransfer.setData('resId', res.id)}
                      className={`relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[var(--primary)] before:rounded-lg ${res.status !== 'cancelled' ? 'cursor-move' : 'opacity-50'}`}
                    >
                       <p className="label-md text-[11px] font-black uppercase text-[var(--on-primary-fixed)]">{res.start_time} — {res.end_time}</p>
                       <p className="label-md text-[10px] opacity-40 uppercase mt-1 tracking-widest">{res.space?.name || 'Area Común'}</p>
                    </div>
                  ))
                )}
              </div>

              <button 
                onClick={() => navigate('/home')}
                className="w-full py-4 bg-[var(--on-primary-fixed)] text-[var(--primary)] rounded-xl label-md font-black uppercase tracking-[0.2em] transition-all duration-700 hover:scale-[1.02] shadow-lg"
              >
                Gestionar Bloque
              </button>
            </div>

            {/* Room Availability Legend */}
            <div className="p-8 bg-[var(--surface-container-low)] rounded-xl border border-[var(--outline-variant)]/20 space-y-6">
              <p className="label-md text-[10px] opacity-40 uppercase tracking-widest font-black">Protocolos de Espacio</p>
              <div className="space-y-6">
                {[
                  { label: 'Confirmed', desc: 'Acceso validado y garantizado', color: 'bg-green-500' },
                  { label: 'Pending', desc: 'En cola de sincronización', color: 'bg-[var(--primary)]' },
                  { label: 'Cancelled', desc: 'Espacio liberado para re-uso', color: 'bg-red-500' }
                ].map(item => (
                  <div key={item.label} className="flex gap-4">
                    <div className={`size-3 rounded-lg mt-1.5 shrink-0 ${item.color}`}></div>
                    <div>
                      <p className="label-md text-[11px] font-black uppercase text-[var(--on-primary-fixed)]">{item.label}</p>
                      <p className="label-md text-[9px] opacity-40 lowercase mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reservations;
