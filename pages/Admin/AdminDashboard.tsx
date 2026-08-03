import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../supabase';
import { Member, Space, Reservation } from '../../types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import PremiumSelect from '../../components/ui/PremiumSelect';
import { useTenant } from '../../contexts/TenantContext';
import { Icon } from '../../components/ui/Icon';



interface TableStatus {
  name: string;
  count: number;
  status: 'online' | 'offline' | 'checking';
  icon: string;
  color: string;
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [adminName, setAdminName] = useState<string>('Admin');

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('name').eq('id', user.id).single();
          if (data?.name) {
            setAdminName(data.name);
          }
        }
      } catch (err) {
        console.error("Error fetching admin profile:", err);
      }
    };
    fetchAdminProfile();
  }, []);

  const isCheckingRef = useRef(false);
  const [tables, setTables] = useState<TableStatus[]>([
    { name: 'CLIENTES', count: 0, status: 'checking', icon: 'groups', color: 'bg-indigo-50 text-indigo-600' },
    { name: 'ESPACIOS', count: 0, status: 'checking', icon: 'architecture', color: 'bg-emerald-50 text-emerald-600' },
    { name: 'RESERVAS', count: 0, status: 'checking', icon: 'event_available', color: 'bg-rose-50 text-rose-600' },
    { name: 'MEMBRESÍAS', count: 0, status: 'checking', icon: 'badge', color: 'bg-amber-50 text-amber-600' },
  ]);

  const [members, setMembers] = useState<Member[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [realChartData, setRealChartData] = useState<any[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  const [filterDate, setFilterDate] = useState('');
  const [timeTick, setTimeTick] = useState(Date.now());
  useEffect(() => {
    const ticker = setInterval(() => {
      setTimeTick(Date.now());
    }, 15000);
    return () => clearInterval(ticker);
  }, []);
  const [filterMember, setFilterMember] = useState('');
  const [filterSpace, setFilterSpace] = useState('');
  
  // New Reservation State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [newReservation, setNewReservation] = useState({
      memberId: '',
      spaceId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00'
  });

  const todayReservations = useMemo(() => {
    const todayStr = moment().format('YYYY-MM-DD');
    return reservations
      .filter(r => moment(r.start_time).format('YYYY-MM-DD') === todayStr)
      .map(r => {
        const space = spaces.find(s => s.id === r.space_id);
        const member = members.find(m => m.id === r.member_id);
        return {
          id: r.id,
          timeRange: `${moment(r.start_time).format('HH:mm')} - ${moment(r.end_time).format('HH:mm')}`,
          spaceName: space ? space.name : 'Unknown Space',
          memberName: member ? member.name : 'Unknown Member',
        };
      })
      .slice(0, 5);
  }, [reservations, spaces, members]);

  const upcomingReservations = useMemo(() => {
    const now = moment();
    return reservations
      .filter(r => moment(r.start_time).isAfter(now))
      .map(r => {
        const space = spaces.find(s => s.id === r.space_id);
        const member = members.find(m => m.id === r.member_id);
        return {
          id: r.id,
          timeLabel: moment(r.start_time).format('MMM D, hh:mm A'),
          spaceName: space ? space.name : 'Unknown Space',
          description: member ? `By: ${member.name}` : 'Reserved',
        };
      })
      .slice(0, 5);
  }, [reservations, spaces, members]);

  const occupiedSpaces = useMemo(() => {
    const now = moment();
    return reservations
      .filter(r => moment(r.start_time).isBefore(now) && moment(r.end_time).isAfter(now))
      .map(r => {
        const space = spaces.find(s => s.id === r.space_id);
        const diffMinutes = moment(r.end_time).diff(now, 'minutes');
        let countdownLabel = '';
        if (diffMinutes < 60) {
          countdownLabel = `(${diffMinutes}m restantes)`;
        } else {
          const hours = Math.floor(diffMinutes / 60);
          const mins = diffMinutes % 60;
          countdownLabel = `(${hours}h ${mins}m restantes)`;
        }
        return {
          id: r.id,
          spaceName: space ? space.name : 'Unknown Space',
          untilLabel: `HASTA ${moment(r.end_time).format('HH:mm')} ${countdownLabel}`
        };
      })
      .slice(0, 4);
  }, [reservations, spaces, timeTick]);

  useEffect(() => {
    if (!tenant?.id) return;

    checkFullDatabase();
    fetchReservationsData();
    fetchChartData();

    // Reducir la frecuencia de chequeo automático para evitar bucles de red
    const interval = setInterval(() => {
      checkFullDatabase();
    }, 60000); // Cada 1 minuto

    // Suscripción Realtime para reservas
    const resChannel = supabase
      .channel(`admin-res-changes-${tenant.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'reservations',
          filter: `tenant_id=eq.${tenant.id}` 
        },
        (payload) => {
          setReservations(prev => [payload.new as Reservation, ...prev]);
          toast('🔔 NUEVA RESERVA DETECTADA', { icon: '📅' });
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(resChannel);
    };
  }, [tenant?.id]);

  const fetchChartData = async () => {
    if (!tenant?.id) return;
    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: true });

      if (payments) {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString('es-ES', { weekday: 'short' });
          const dateStr = d.toISOString().slice(0, 10);

          const dailyTotal = payments
              .filter(p => p.created_at.includes(dateStr))
              .reduce((sum, p) => sum + p.amount, 0);

          last7Days.push({ name: label.toUpperCase(), val: dailyTotal });
        }
        setRealChartData(last7Days);
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  };

  const fetchReservationsData = async () => {
    if (!tenant?.id) return;
    setResLoading(true);
    try {
      const [resRes, memRes, spaRes] = await Promise.all([
        supabase.from('reservations').select('*').eq('tenant_id', tenant.id).order('start_time', { ascending: false }),
        supabase.from('profiles').select('*').eq('tenant_id', tenant.id),
        supabase.from('spaces').select('*').eq('tenant_id', tenant.id)
      ]);

      if (resRes.data && resRes.data.length > 0) {
        setReservations(resRes.data as Reservation[]);
      } else {
        setReservations([]);
      }
      if (memRes.data) setMembers(memRes.data as Member[]);
      if (spaRes.data) setSpaces(spaRes.data as Space[]);
    } catch (err) {
      console.error("Error fetching reservation management data:", err);
    } finally {
      setResLoading(false);
    }
  };

  const checkFullDatabase = async () => {
    if (!tenant?.id || isCheckingRef.current) return;
    
    isCheckingRef.current = true;
    setDbStatus('checking');
    
    try {
      const updatedTables = [...tables];
      let allOnline = true;

      // Definir el mapeo de nombres de interfaz a nombres de tabla real
      const tableMap: Record<string, string> = {
        'CLIENTES': 'profiles',
        'ESPACIOS': 'spaces',
        'RESERVAS': 'reservations',
        'MEMBRESÍAS': 'membership_tiers'
      };

      for (let i = 0; i < updatedTables.length; i++) {
        const table = updatedTables[i];
        const dbTableName = tableMap[table.name] || table.name.toLowerCase();
        
        try {
          const { count, error } = await supabase
            .from(dbTableName)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);

          if (error) {
            console.warn(`⚠️ Error en tabla ${dbTableName}:`, error.message);
            table.status = 'offline';
            allOnline = false;
          } else {
            table.count = count || 0;
            table.status = 'online';
          }
        } catch (err) {
          table.status = 'offline';
          allOnline = false;
        }
      }

      setTables(updatedTables);
      setDbStatus(allOnline ? 'connected' : 'error');
    } catch (err) {
      console.error('❌ Error crítico en verificación:', err);
      setDbStatus('error');
    } finally {
      isCheckingRef.current = false;
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm('¿CONFIRMA LA ANULACIÓN DE ESTE EXPEDIENTE?')) return;
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
      if (selectedRes?.id === id) setSelectedRes(prev => prev ? { ...prev, status: 'cancelled' } : null);
      toast.success('RESERVA CANCELADA');
    } catch (err) {
      toast.error('ERROR EN LA OPERACIÓN');
    }
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const matchDate = filterDate ? res.start_time.includes(filterDate) : true;
      const matchMember = filterMember ? res.member_id === filterMember : true;
      const matchSpace = filterSpace ? res.space_id === filterSpace : true;
      return matchDate && matchMember && matchSpace;
    });
  }, [reservations, filterDate, filterMember, filterSpace]);

  // FullCalendar Events Mapping
  const events = useMemo(() => {
    return filteredReservations.map(res => {
      const space = spaces.find(s => s.id === res.space_id);
      const member = members.find(m => m.id === res.member_id);
      
      let color = 'var(--secondary)';
      if (res.status === 'confirmed') color = 'var(--primary)';
      else if (res.status === 'pending') color = 'var(--on-surface-subtle)';
      else if (res.status === 'cancelled') color = '#ef4444';

      return {
          id: res.id,
          title: `${space?.name || 'Espacio'} - ${member?.name || 'Cliente'}`,
          start: res.start_time,
          end: res.end_time,
          backgroundColor: color,
          borderColor: color,
          extendedProps: { ...res }
      };
    });
  }, [filteredReservations, spaces, members]);

  const handleEventChange = async (changeInfo: any) => {
    const { event } = changeInfo;
    const id = event.id;
    const start = event.start.toISOString();
    const end = event.end.toISOString();

    // Optimistic update
    setReservations(prev => prev.map(res => 
        res.id === id ? { ...res, start_time: start, end_time: end } : res
    ));

    try {
        const { error } = await supabase
            .from('reservations')
            .update({ 
                start_time: start, 
                end_time: end 
            })
            .eq('id', id);

        if (error) throw error;
        toast.success('Sincronizado');
    } catch (err) {
        toast.error('Error de red');
        fetchReservationsData();
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
        const start_time = `${newReservation.date}T${newReservation.startTime}:00`;
        const end_time = `${newReservation.date}T${newReservation.endTime}:00`;

        const { error } = await supabase
            .from('reservations')
            .insert([{
                tenant_id: tenant?.id,
                member_id: newReservation.memberId,
                space_id: newReservation.spaceId,
                start_time,
                end_time,
                status: 'pending'
            }]);

        if (error) throw error;

        toast.success('REGISTRO INCORPORADO');
        setIsBookingModalOpen(false);
        fetchReservationsData();
    } catch (err: any) {
        toast.error('Error: ' + err.message);
    } finally {
        setSubmitLoading(false);
    }
  };

  const openQuickBook = (spaceName: string) => {
    const space = spaces.find(s => s.name.toLowerCase().includes(spaceName.toLowerCase()));
    setNewReservation(prev => ({
      ...prev,
      spaceId: space ? space.id : '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00'
    }));
    setIsBookingModalOpen(true);
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 animate-fade pb-32 px-4 md:px-8">
      {/* 1. Header Area matching the image */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
          {t('dashboard_title', { name: adminName.split(' ')[0] })}
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} — se espera pico de actividad a las 2:00 pm.
        </p>
      </div>
 
      {/* 2. Bento Grid of KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Members Onsite */}
        <div className="card-workspace group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Icon name="groups" className="!text-[120px]" />
          </div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="size-14 bg-[var(--surface)] shadow-[var(--neu-flat-sm)] rounded-2xl flex items-center justify-center text-[var(--on-surface-subtle)] group-hover:shadow-[var(--neu-pressed-sm)] group-hover:text-[var(--primary)] transition-all">
              <Icon name="groups" className="!text-2xl" />
            </div>
            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl shadow-sm bg-green-500/10 text-green-500">
              +12%
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--on-surface-subtle)] relative z-10">{t('members_onsite', "Members onsite")}</p>
          <p className="text-3xl font-black tracking-tighter text-[var(--on-surface)] mt-2 relative z-10">{tables[0].count > 0 ? `${tables[0].count}/88` : '26/88'}</p>
        </div>
 
        {/* Unpaid Invoices */}
        <div className="card-workspace group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Icon name="receipt_long" className="!text-[120px]" />
          </div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="size-14 bg-[var(--surface)] shadow-[var(--neu-flat-sm)] rounded-2xl flex items-center justify-center text-[var(--on-surface-subtle)] group-hover:shadow-[var(--neu-pressed-sm)] group-hover:text-[var(--primary)] transition-all">
              <Icon name="receipt_long" className="!text-2xl" />
            </div>
            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl shadow-sm bg-red-500/10 text-red-500">
              Urgent
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--on-surface-subtle)] relative z-10">{t('unpaid_invoices', "Unpaid Invoices")}</p>
          <p className="text-3xl font-black tracking-tighter text-[var(--on-surface)] mt-2 relative z-10">4</p>
        </div>
 
        {/* Unread Messages */}
        <div className="card-workspace group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Icon name="mail" className="!text-[120px]" />
          </div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="size-14 bg-[var(--surface)] shadow-[var(--neu-flat-sm)] rounded-2xl flex items-center justify-center text-[var(--on-surface-subtle)] group-hover:shadow-[var(--neu-pressed-sm)] group-hover:text-[var(--primary)] transition-all">
              <Icon name="mail" className="!text-2xl" />
            </div>
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse mt-2"></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--on-surface-subtle)] relative z-10">{t('unread_messages', "Unread Messages")}</p>
          <p className="text-3xl font-black tracking-tighter text-[var(--on-surface)] mt-2 relative z-10">2</p>
        </div>
 
        {/* Active Bookings */}
        <div className="card-workspace group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Icon name="calendar_today" className="!text-[120px]" />
          </div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="size-14 bg-[var(--surface)] shadow-[var(--neu-flat-sm)] rounded-2xl flex items-center justify-center text-[var(--on-surface-subtle)] group-hover:shadow-[var(--neu-pressed-sm)] group-hover:text-[var(--primary)] transition-all">
              <Icon name="calendar_today" className="!text-2xl" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--on-surface-subtle)] relative z-10">{t('active_bookings', "Active Bookings")}</p>
          <p className="text-3xl font-black tracking-tighter text-[var(--on-surface)] mt-2 relative z-10">{tables[2].count > 0 ? tables[2].count : '14'}</p>
        </div>
      </div>
 
      {/* 3. Three Columns Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Today's Reservations */}
        <div className="card-workspace space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="label-md text-[var(--primary)] uppercase tracking-[0.2em]">{t('agenda', "Agenda")}</h3>
              <h2 className="text-lg font-black uppercase tracking-tight text-[var(--on-surface)]">{t('todays_reservations', "Today's Reservations")}</h2>
            </div>
            <Icon name="calendar_today" className="text-[var(--primary)]" />
          </div>
          <div className="space-y-4">
            {todayReservations.length > 0 ? (
              todayReservations.map(r => (
                <div key={r.id} className="p-4 rounded-xl bg-[var(--surface)] shadow-[var(--neu-flat-sm)] hover:shadow-[var(--neu-pressed-sm)] border-l-4 border-[var(--primary)] transition-all space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--primary)]">{r.timeRange}</span>
                  <h4 className="text-xs font-black uppercase tracking-tight text-[var(--on-surface)]">{r.spaceName}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-subtle)]">By: {r.memberName}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-medium">{t('no_reservations_today', "No reservations today")}</p>
            )}
          </div>
        </div>
 
        {/* Column 2: Upcoming */}
        <div className="card-workspace space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="label-md text-[var(--primary)] uppercase tracking-[0.2em]">{t('scheduled', "Scheduled")}</h3>
              <h2 className="text-lg font-black uppercase tracking-tight text-[var(--on-surface)]">{t('upcoming', "Upcoming")}</h2>
            </div>
            <Icon name="schedule" className="text-slate-400" />
          </div>
          <div className="space-y-4">
            {upcomingReservations.length > 0 ? (
              upcomingReservations.map(r => (
                <div key={r.id} className="p-4 rounded-xl bg-[var(--surface)] shadow-[var(--neu-flat-sm)] hover:shadow-[var(--neu-pressed-sm)] border-l-4 border-[var(--on-surface-subtle)] transition-all space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{r.timeLabel}</span>
                  <h4 className="text-xs font-black uppercase tracking-tight text-[var(--on-surface)]">{r.spaceName}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-subtle)]">{r.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-medium">{t('no_upcoming_reservations', "No upcoming reservations")}</p>
            )}
          </div>
        </div>
 
        {/* Column 3: Stacked widgets */}
        <div className="space-y-6">
          {/* Occupied Spaces */}
          <div className="card-workspace space-y-4">
            <div className="space-y-1">
              <h3 className="label-md text-[var(--primary)] uppercase tracking-[0.2em]">{t('capacity', "Capacity")}</h3>
              <h2 className="text-base font-black uppercase tracking-tight text-[var(--on-surface)]">{t('occupied_spaces', "Occupied Spaces")}</h2>
            </div>
            <div className="space-y-3">
              {occupiedSpaces.length > 0 ? (
                occupiedSpaces.map(r => (
                  <div key={r.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="font-bold uppercase tracking-wider text-[var(--on-surface)] text-[10px]">{r.spaceName}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-subtle)]">{r.untilLabel}</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t('all_spaces_vacant', "All spaces vacant")}</p>
              )}
            </div>
          </div>
 
          {/* Next Events */}
          <div className="card-workspace space-y-4">
            <div className="space-y-1">
              <h3 className="label-md text-[var(--primary)] uppercase tracking-[0.2em]">{t('calendar', "Calendar")}</h3>
              <h2 className="text-base font-black uppercase tracking-tight text-[var(--on-surface)]">{t('next_events', "Next Events")}</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-[var(--surface)] shadow-[var(--neu-flat-sm)] text-[var(--secondary)] rounded-xl flex items-center justify-center">
                  <Icon name="restaurant" className="!text-xl" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[var(--on-surface)]">Member Lunch</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-subtle)]">Today, 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 bg-[var(--surface)] shadow-[var(--neu-flat-sm)] text-[var(--primary)] rounded-xl flex items-center justify-center">
                  <Icon name="campaign" className="!text-xl" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[var(--on-surface)]">VC Pitch Day</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-subtle)]">Tomorrow, 10:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Available Resources Section */}
      <section className="space-y-6 pt-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase">{t('available_resources', "Available Resources")}</h2>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">{t('manage_book_rooms', "Manage and book meeting rooms or equipment.")}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 border border-[var(--outline-variant)]/60 rounded-lg hover:bg-slate-50 transition-colors">
              <Icon name="filter_list" className="text-slate-400 !text-xl" />
            </button>
            <button className="p-2 border border-[var(--outline-variant)]/60 rounded-lg hover:bg-slate-50 transition-colors">
              <Icon name="grid_view" className="text-slate-400 !text-xl" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* HDMI Room */}
          <div className="card-workspace p-0 overflow-hidden group">
            <div className="h-40 bg-[var(--surface)] overflow-hidden relative">
              <img alt="HDMI Room" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800" />
              <span className="absolute top-4 left-4 font-label-md text-[10px] bg-emerald-100 text-[var(--tertiary)] px-3 py-1 rounded-full flex items-center gap-1 shadow-sm font-bold">
                <span className="w-2 h-2 bg-[var(--tertiary)] rounded-full"></span> {t('available', "Available")}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-base font-bold text-[var(--on-surface)] mb-1">HDMI Room</h4>
                <div className="flex gap-3 text-[var(--on-surface-subtle)] text-xs">
                  <div className="flex items-center gap-1">
                    <Icon name="groups" className="text-[16px]" /> 6 {t('seats', "Seats")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="tv" className="text-[16px]" /> {t('display_4k', "4K Display")}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openQuickBook('HDMI')} className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider block transition-colors">{t('quick_book', "Quick Book")}</button>
                <button className="p-2 border border-[var(--outline-variant)]/60 rounded-lg hover:bg-slate-50 transition-colors text-slate-400">
                  <Icon name="more_horiz" />
                </button>
              </div>
            </div>
          </div>
 
          {/* RJ-45 Room */}
          <div className="card-workspace p-0 overflow-hidden group">
            <div className="h-40 bg-[var(--surface)] overflow-hidden relative">
              <img alt="RJ-45 Room" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800" />
              <span className="absolute top-4 left-4 font-label-md text-[10px] bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm font-bold">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> {t('occupied', "Occupied")}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-base font-bold text-[var(--on-surface)] mb-1">RJ-45 Room</h4>
                <div className="flex gap-3 text-[var(--on-surface-subtle)] text-xs">
                  <div className="flex items-center gap-1">
                    <Icon name="groups" className="text-[16px]" /> 2 {t('seats', "Seats")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="bolt" className="text-[16px]" /> {t('fiber_1gbps', "Fiber 1Gbps")}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-not-allowed">{t('unavailable', "Unavailable")}</button>
                <button className="p-2 border border-[var(--outline-variant)]/60 rounded-lg hover:bg-slate-50 transition-colors text-slate-400">
                  <Icon name="more_horiz" />
                </button>
              </div>
            </div>
          </div>
 
          {/* Private Pod 04 */}
          <div className="card-workspace p-0 overflow-hidden group">
            <div className="h-40 bg-[var(--surface)] overflow-hidden relative">
              <img alt="Private Pod" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800" />
              <span className="absolute top-4 left-4 font-label-md text-[10px] bg-emerald-100 text-[var(--tertiary)] px-3 py-1 rounded-full flex items-center gap-1 shadow-sm font-bold">
                <span className="w-2 h-2 bg-[var(--tertiary)] rounded-full"></span> {t('available', "Available")}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-base font-bold text-[var(--on-surface)] mb-1">Private Pod 04</h4>
                <div className="flex gap-3 text-[var(--on-surface-subtle)] text-xs">
                  <div className="flex items-center gap-1">
                    <Icon name="person" className="text-[16px]" /> 1 {t('seat', "Seat")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="noise_control_on" className="text-[16px]" /> {t('soundproof', "Soundproof")}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openQuickBook('Pod 04')} className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider block transition-colors">{t('quick_book', "Quick Book")}</button>
                <button className="p-2 border border-[var(--outline-variant)]/60 rounded-lg hover:bg-slate-50 transition-colors text-slate-400">
                  <Icon name="more_horiz" />
                </button>
              </div>
            </div>
          </div>
 
          {/* Green Creative */}
          <div className="card-workspace p-0 overflow-hidden group">
            <div className="h-40 bg-[var(--surface)] overflow-hidden relative">
              <img alt="Green Creative" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800" />
              <span className="absolute top-4 left-4 font-label-md text-[10px] bg-emerald-100 text-[var(--tertiary)] px-3 py-1 rounded-full flex items-center gap-1 shadow-sm font-bold">
                <span className="w-2 h-2 bg-[var(--tertiary)] rounded-full"></span> {t('available', "Available")}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-base font-bold text-[var(--on-surface)] mb-1">Green Creative</h4>
                <div className="flex gap-3 text-[var(--on-surface-subtle)] text-xs">
                  <div className="flex items-center gap-1">
                    <Icon name="groups" className="text-[16px]" /> 12 {t('seats', "Seats")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="draw" className="text-[16px]" /> {t('whiteboard', "Whiteboard")}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openQuickBook('Green Creative')} className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider block transition-colors">{t('quick_book', "Quick Book")}</button>
                <button className="p-2 border border-[var(--outline-variant)]/60 rounded-lg hover:bg-slate-50 transition-colors text-slate-400">
                  <Icon name="more_horiz" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Dialog Modal */}
      {isBookingModalOpen && (() => {
        const selectedSpace = spaces.find(s => s.id === newReservation.spaceId) || spaces[0];
        const hourlyRate = selectedSpace ? selectedSpace.price : 45;
        
        // Calculate duration and prices
        const [startH, startM] = newReservation.startTime.split(':').map(Number);
        const [endH, endM] = newReservation.endTime.split(':').map(Number);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        const durationHours = durationMinutes > 0 ? durationMinutes / 60 : 1;
        
        const subtotal = hourlyRate * durationHours;
        const tax = subtotal * 0.16;
        const total = subtotal + tax;

        const handleTimePillClick = (time: string) => {
          setNewReservation(prev => {
            const [h, m] = time.split(':').map(Number);
            const endH = (h + durationHours) % 24;
            const endHStr = String(Math.floor(endH)).padStart(2, '0');
            const endMStr = String(m).padStart(2, '0');
            return {
              ...prev,
              startTime: time,
              endTime: `${endHStr}:${endMStr}`
            };
          });
        };

        const handleDurationChange = (hrs: number) => {
          setNewReservation(prev => {
            const [h, m] = prev.startTime.split(':').map(Number);
            const endH = (h + hrs) % 24;
            const endHStr = String(Math.floor(endH)).padStart(2, '0');
            const endMStr = String(m).padStart(2, '0');
            return {
              ...prev,
              endTime: `${endHStr}:${endMStr}`
            };
          });
        };

        return (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-container max-w-5xl rounded-3xl overflow-hidden flex flex-col md:flex-row bg-white border border-[var(--outline-variant)] shadow-2xl">
              
              {/* Left Pane - Space Details */}
              <div className="w-full md:w-[60%] p-6 md:p-8 space-y-6 flex flex-col justify-between">
                {/* Image Header with Badge & Title Overlay */}
                <div className="relative rounded-2xl overflow-hidden h-64 shadow-md bg-slate-900">
                  <img 
                    alt={selectedSpace?.name || "Space Preview"} 
                    className="w-full h-full object-cover opacity-90"
                    src={selectedSpace?.images?.[0] || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6">
                    <span className="bg-blue-600 text-[10px] font-black uppercase text-white px-3 py-1 rounded-full w-fit mb-2 shadow-md tracking-widest">
                      Espacio Premium
                    </span>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                      {selectedSpace?.name || "Sala de Juntas"}
                    </h2>
                  </div>
                </div>

                {/* Key Info Row */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Capacidad */}
                  <div className="bg-[var(--surface)] border border-[var(--outline-variant)]/30 p-4 rounded-xl flex items-center gap-3">
                    <Icon name="groups" className="text-[var(--primary)]" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Capacidad</p>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{selectedSpace?.capacity || 12} Personas</p>
                    </div>
                  </div>
                  {/* Precio */}
                  <div className="bg-[var(--surface)] border border-[var(--outline-variant)]/30 p-4 rounded-xl flex items-center gap-3">
                    <Icon name="payments" className="text-[var(--secondary)]" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Precio</p>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">${hourlyRate}/hr</p>
                    </div>
                  </div>
                  {/* Ubicación */}
                  <div className="bg-[var(--surface)] border border-[var(--outline-variant)]/30 p-4 rounded-xl flex items-center gap-3">
                    <Icon name="location_on" className="text-emerald-600" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Ubicación</p>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Piso 4, Ala Norte</p>
                    </div>
                  </div>
                </div>

                {/* Features & Amenities */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="verified" className="text-[var(--primary)] !text-lg" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Características & Amenidades</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'High-speed Wi-Fi', icon: 'wifi' },
                      { name: 'Projector & Screen', icon: 'co_present' },
                      { name: 'Air Conditioning', icon: 'ac_unit' },
                      { name: 'Coffee Service', icon: 'local_cafe' },
                      { name: 'Whiteboard', icon: 'draw' },
                      { name: 'Audio System', icon: 'volume_up' }
                    ].map((amenity, i) => (
                      <div key={i} className="bg-[var(--surface)]/40 border border-[var(--outline-variant)]/10 p-3 rounded-xl flex flex-col gap-1 items-start text-left">
                        <Icon name={amenity.icon} className="text-[var(--primary)] !text-base" />
                        <span className="text-[9px] font-bold text-slate-700 tracking-tight">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Pane - Form & Actions */}
              <div className="w-full md:w-[40%] bg-[var(--surface)] border-l border-[var(--outline-variant)]/40 p-6 md:p-8 flex flex-col justify-between">
                
                {/* Form Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Reservar Espacio</h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Selecciona la fecha y hora para tu sesión.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsBookingModalOpen(false)} 
                    className="size-8 bg-slate-200/60 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors border-none cursor-pointer text-slate-600"
                  >
                    <Icon name="close" className="!text-lg" />
                  </button>
                </div>

                <form onSubmit={handleCreateReservation} className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Member Select */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cliente / Miembro</label>
                      <select 
                        value={newReservation.memberId} 
                        onChange={(e) => setNewReservation({ ...newReservation, memberId: e.target.value })} 
                        required 
                        className="w-full border border-[var(--outline-variant)] rounded-xl p-3 text-xs bg-white font-bold"
                      >
                        <option value="">Selecciona Miembro</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.name || m.email}</option>
                        ))}
                      </select>
                    </div>

                    {/* Space Selector */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Espacio / Recurso</label>
                      <select 
                        value={newReservation.spaceId} 
                        onChange={(e) => setNewReservation({ ...newReservation, spaceId: e.target.value })} 
                        required 
                        className="w-full border border-[var(--outline-variant)] rounded-xl p-3 text-xs bg-white font-bold"
                      >
                        <option value="">Selecciona Recurso</option>
                        {spaces.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Picker */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={newReservation.date} 
                          onChange={(e) => setNewReservation({ ...newReservation, date: e.target.value })} 
                          required 
                          className="w-full border border-[var(--outline-variant)] rounded-xl p-3 text-xs bg-white font-bold uppercase tracking-wider" 
                        />
                        <Icon name="calendar_today" className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Start Time Select (Time Pills) */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Hora de Inicio</label>
                      <div className="flex gap-2">
                        {['09:00', '10:00', '11:00'].map((time) => {
                          const isSelected = newReservation.startTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => handleTimePillClick(time)}
                              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                isSelected 
                                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {time} AM
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Duration Select */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Duración</label>
                      <select 
                        value={durationHours} 
                        onChange={(e) => handleDurationChange(Number(e.target.value))} 
                        className="w-full border border-[var(--outline-variant)] rounded-xl p-3 text-xs bg-white font-bold"
                      >
                        <option value={1}>1 Hora</option>
                        <option value={2}>2 Horas</option>
                        <option value={3}>3 Horas</option>
                        <option value={4}>4 Horas</option>
                        <option value={8}>8 Horas</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing Breakdown & Action Buttons */}
                  <div className="space-y-4 pt-4 border-t border-[var(--outline-variant)]/40 mt-6">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400 font-bold uppercase tracking-wider">
                        <span>Subtotal ({durationHours} hrs)</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-bold uppercase tracking-wider">
                        <span>Impuestos (16%)</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2">
                        <span className="text-sm font-black text-slate-900 uppercase">Total</span>
                        <span className="text-xl font-black text-[var(--primary)]">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <button 
                        type="submit" 
                        disabled={submitLoading} 
                        className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-colors border-none cursor-pointer"
                      >
                        {submitLoading ? 'Procesando...' : 'Confirmar Reserva'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsBookingModalOpen(false)}
                        className="w-full py-3.5 bg-slate-200/50 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-none cursor-pointer"
                      >
                        <Icon name="shopping_cart" className="!text-base" />
                        Añadir al Carrito
                      </button>
                    </div>
                  </div>
                </form>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminDashboard;
