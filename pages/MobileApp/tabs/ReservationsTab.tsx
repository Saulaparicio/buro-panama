import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { format, addDays, isSameDay, parseISO, setHours, setMinutes, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export const ReservationsTab: React.FC<{ profile: any }> = ({ profile }) => {
  const [activeFilter, setActiveFilter] = useState('desk'); // desk, office, meeting, studio
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('08:00');
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  
  const [spaces, setSpaces] = useState<any[]>([]);
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const filters = [
    { id: 'desk', label: 'Hot Desks' },
    { id: 'office', label: 'Oficinas' },
    { id: 'meeting', label: 'Salas' },
    { id: 'studio', label: 'Studios' }
  ];

  // Generate next 7 days
  const dates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  useEffect(() => {
    loadSpaces();
  }, [activeFilter]);

  useEffect(() => {
    if (selectedSpace) {
      checkAvailability();
    } else {
      setOccupiedTimes([]);
    }
  }, [selectedSpace, selectedDate]);

  const loadSpaces = async () => {
    setLoading(true);
    setSelectedSpace(null);
    try {
      const { data } = await supabase
        .from('spaces')
        .select('*')
        .eq('type', activeFilter);
      setSpaces(data || []);
      if (data && data.length > 0) setSelectedSpace(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!selectedSpace) return;
    try {
      const startOfDayISO = startOfDay(selectedDate).toISOString();
      const endOfDayISO = startOfDay(addDays(selectedDate, 1)).toISOString();

      const { data } = await supabase
        .from('reservations')
        .select('start_time, end_time')
        .eq('space_id', selectedSpace.id)
        .in('status', ['pending', 'confirmed'])
        .gte('start_time', startOfDayISO)
        .lt('start_time', endOfDayISO);

      const occupied = new Set<string>();
      data?.forEach(res => {
        // Simple 1-hour blocks for MVP
        const timeStr = format(new Date(res.start_time), 'HH:00');
        occupied.add(timeStr);
      });
      setOccupiedTimes(Array.from(occupied));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReserve = async () => {
    if (!selectedSpace || !profile) return;
    
    setBooking(true);
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = setMinutes(setHours(selectedDate, hours), minutes);
      const endTime = setHours(startTime, hours + 1); // 1 hour duration

      const { error } = await supabase.from('reservations').insert({
        tenant_id: profile.tenant_id,
        space_id: selectedSpace.id,
        member_id: profile.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending',
        reference_code: `RES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      if (error) throw error;

      toast.success('Reserva confirmada');
      checkAvailability(); // refresh availability
    } catch (err) {
      console.error(err);
      toast.error('Error al reservar');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-fade pb-[120px]">
      <h2 className="text-2xl font-display font-medium tracking-tight text-[#111111]">Reservas</h2>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {filters.map(f => (
          <button 
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors border ${
              activeFilter === f.id ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date Carousel */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Selecciona Fecha</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {dates.map((d, idx) => {
            const isSelected = isSameDay(d, selectedDate);
            return (
              <button 
                key={idx}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center justify-center size-14 shrink-0 rounded-2xl transition-all border ${
                  isSelected ? 'bg-[#FDE910] border-transparent shadow-md' : 'bg-white border-gray-100 text-gray-400'
                }`}
              >
                <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-black' : ''}`}>
                  {idx === 0 ? 'HOY' : format(d, 'EEE', { locale: es }).substring(0, 3)}
                </span>
                <span className={`text-lg font-black ${isSelected ? 'text-black' : 'text-[#111111]'}`}>
                  {format(d, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floor Map / Spaces Simulator */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Selecciona un Espacio</p>
        <div className="bg-white border border-gray-100 rounded-[20px] p-4 shadow-sm min-h-[100px]">
          {loading ? (
            <p className="text-center text-xs text-gray-400 mt-6 animate-pulse">Cargando espacios...</p>
          ) : spaces.length === 0 ? (
            <p className="text-center text-xs text-gray-400 mt-6">No hay espacios de este tipo.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {spaces.map(space => (
                <button
                  key={space.id}
                  onClick={() => setSelectedSpace(space)}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all border-2 ${
                    selectedSpace?.id === space.id ? 'bg-[#FDE910] border-[#111111] text-black shadow-md scale-[1.02]' : 'bg-[#F9F9FB] border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <span className="text-xs font-black text-center leading-tight">{space.name}</span>
                  <span className="text-[9px] uppercase tracking-widest opacity-60 mt-1">${space.price}/hr</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hours Grid */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Horarios Disponibles</p>
        {!selectedSpace ? (
          <p className="text-xs text-gray-400">Selecciona un espacio primero.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {times.map((t) => {
              const isOccupied = occupiedTimes.includes(t);
              const isSelected = selectedTime === t;
              return (
                <button
                  key={t}
                  disabled={isOccupied}
                  onClick={() => setSelectedTime(t)}
                  className={`py-2.5 rounded-lg text-[10px] font-bold transition-all border ${
                    isOccupied ? 'bg-gray-100 text-gray-300 border-transparent cursor-not-allowed' :
                    isSelected ? 'bg-[#FDE910] text-black border-transparent shadow-sm scale-105' :
                    'bg-white text-[#111111] border-[#111111]/10 hover:border-[#111111]'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="bg-[#111111] text-white p-5 rounded-[20px] space-y-4 shadow-xl">
        <div className="flex justify-between items-end border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Créditos de Cortesía</p>
            <p className="text-sm font-black">{profile?.credits || 0} Créditos Disponibles</p>
          </div>
          <p className="text-2xl font-black text-[#FDE910]">
            {selectedSpace ? selectedSpace.price : 0}
            <span className="text-[10px] text-white/40 ml-1">CR</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleReserve}
            disabled={booking || !selectedSpace}
            className="flex-1 py-3.5 bg-[#FDE910] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {booking ? 'Reservando...' : 'Reservar con Créditos'}
          </button>
        </div>
      </div>
    </div>
  );
};
