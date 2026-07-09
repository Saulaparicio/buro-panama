import React, { useEffect, useState } from 'react';
import { TabValue } from '../components/BottomNav';
import { supabase } from '../../../supabase';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

export const DashboardTab: React.FC<{ profile: any; onNavigate: (tab: TabValue) => void }> = ({ profile, onNavigate }) => {
  const firstName = profile?.name?.split(' ')[0] || 'Miembro';
  const [membershipName, setMembershipName] = useState('Plan Básico');
  const [membershipStatus, setMembershipStatus] = useState('Inactivo');
  const [nextReservation, setNextReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadDashboardData();
    }
  }, [profile]);

  const loadDashboardData = async () => {
    try {
      // Fetch Active Membership
      const { data: membership } = await supabase
        .from('memberships')
        .select(`
          status,
          tier:membership_tiers(name)
        `)
        .eq('profile_id', profile.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership) {
        const tierName = Array.isArray(membership.tier) ? membership.tier[0]?.name : (membership.tier as any)?.name;
        setMembershipName(tierName || 'Plan Activo');
        setMembershipStatus('Activo');
      }

      // Fetch Next Reservation
      const { data: reservation } = await supabase
        .from('reservations')
        .select(`
          start_time,
          end_time,
          space:spaces(name, type)
        `)
        .eq('member_id', profile.id)
        .in('status', ['pending', 'confirmed'])
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (reservation) {
        setNextReservation(reservation);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatReservationTime = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let dayStr = '';
    
    if (isToday(startDate)) dayStr = 'Hoy';
    else if (isTomorrow(startDate)) dayStr = 'Mañana';
    else dayStr = format(startDate, 'dd MMM', { locale: es });

    const timeStart = format(startDate, 'h:mm a');
    const timeEnd = format(endDate, 'h:mm a');
    
    return `${dayStr}, ${timeStart} - ${timeEnd}`;
  };

  return (
    <div className="p-6 space-y-6 animate-fade">
      {/* Greeting */}
      <div className="mt-4">
        <h1 className="text-3xl font-display font-medium tracking-tight text-[#111111]">
          Hola, {firstName} 👋
        </h1>
      </div>

      {/* Membership Card */}
      <div className="bg-[#F9F9FB] border border-gray-100 p-5 rounded-[20px] shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Plan Actual</p>
          <p className="text-sm font-black uppercase tracking-tight text-[#111111]">
            {loading ? 'Cargando...' : membershipName}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
          <span className={`size-2 rounded-full ${membershipStatus === 'Activo' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
          <span className={`text-[9px] font-bold uppercase tracking-widest ${membershipStatus === 'Activo' ? 'text-green-700' : 'text-gray-500'}`}>
            {membershipStatus}
          </span>
        </div>
      </div>

      {/* Quick QR Access */}
      <button 
        onClick={() => onNavigate('access')}
        className="w-full bg-[#FDE910] text-black font-semibold text-sm rounded-xl py-4 shadow-sm flex items-center justify-center gap-3 transition-all active:scale-95 border-none"
      >
        <span className="material-symbols-outlined !text-xl">qr_code_scanner</span>
        ABRIR PUERTA CON QR
      </button>

      {/* Next Reservation */}
      <div className="pt-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Tu Próxima Reserva</h2>
        
        {loading ? (
          <div className="bg-white border border-gray-100 p-5 rounded-[20px] shadow-sm flex items-center justify-center min-h-[120px]">
            <span className="text-sm text-gray-400 font-bold uppercase tracking-widest animate-pulse">Cargando...</span>
          </div>
        ) : nextReservation ? (
          <div className="bg-white border border-gray-100 p-5 rounded-[20px] shadow-sm space-y-4">
            <div className="flex gap-4">
              <div className="size-12 bg-[#F9F9FB] rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                <span className="material-symbols-outlined text-[#111111] !text-2xl">
                  {nextReservation.space?.type === 'office' ? 'door_front' : nextReservation.space?.type === 'meeting' ? 'meeting_room' : 'desk'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-[#111111]">
                  {nextReservation.space?.name || 'Espacio'} 
                  <span className="text-gray-400 font-medium normal-case ml-1">(Piso 2)</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  {formatReservationTime(nextReservation.start_time, nextReservation.end_time)}
                </p>
              </div>
            </div>
            <button className="w-full py-3 bg-[#F9F9FB] hover:bg-gray-100 text-[#111111] rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-gray-100">
              VER DETALLES
            </button>
          </div>
        ) : (
          <div className="bg-[#F9F9FB] border border-gray-100 border-dashed p-6 rounded-[20px] text-center">
            <span className="material-symbols-outlined text-gray-300 !text-4xl mb-2">event_busy</span>
            <p className="text-sm font-bold text-gray-500">No tienes reservas próximas</p>
            <button 
              onClick={() => onNavigate('reservations')}
              className="mt-4 px-4 py-2 bg-white text-[#111111] border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm"
            >
              Hacer una reserva
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
