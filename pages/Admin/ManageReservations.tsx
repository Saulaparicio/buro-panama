import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { Space, Member, Reservation } from '../../types';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { sendReservationEmail } from '../../supabase';
import PremiumSelect from '../../components/ui/PremiumSelect';
import { useTenant } from '../../contexts/TenantContext';
import { Icon } from '../../components/ui/Icon';

const ManageReservations: React.FC = () => {
    const { tenant } = useTenant();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
    const calendarRef = useRef<FullCalendar>(null);

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    // Modals
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

    const [newReservation, setNewReservation] = useState({
        memberId: '',
        spaceId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        status: 'confirmed'
    });
    const [submitLoading, setSubmitLoading] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        confirmed: 0,
        pending: 0,
        uniqueSpaces: 0
    });

    const fetchData = async () => {
        if (!tenant?.id) return;

        try {
            setLoading(true);
            const [resData, spacesData, membersData] = await Promise.all([
                supabase.from('reservations')
                    .select('*')
                    .eq('tenant_id', tenant.id)
                    .order('start_time', { ascending: false }),
                supabase.from('spaces')
                    .select('*')
                    .eq('tenant_id', tenant.id),
                supabase.from('profiles')
                    .select('*')
                    .eq('tenant_id', tenant.id)
            ]);

            if (resData.error) throw resData.error;
            if (spacesData.error) throw spacesData.error;
            if (membersData.error) throw membersData.error;

            setReservations(resData.data || []);
            setSpaces(spacesData.data || []);
            setMembers(membersData.data || []);

            const res = resData.data || [];
            setStats({
                total: res.length,
                confirmed: res.filter(r => r.status === 'confirmed').length,
                pending: res.filter(r => r.status === 'pending').length,
                uniqueSpaces: new Set(res.map(r => r.space_id)).size
            });
        } catch (err) {
            console.error('Error fetching data:', err);
            toast.error('Error al sincronizar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenant?.id) {
            fetchData();
        }
    }, [tenant?.id]);

    const handleCreateReservation = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const startDateTime = new Date(`${newReservation.date}T${newReservation.startTime}`);
            const endDateTime = new Date(`${newReservation.date}T${newReservation.endTime}`);

            if (startDateTime >= endDateTime) {
                toast.error('La hora de fin debe ser posterior a la de inicio.');
                setSubmitLoading(false);
                return;
            }

            const { data: isAvailable, error: checkError } = await supabase.rpc('check_space_availability', {
                p_space_id: newReservation.spaceId,
                p_start_time: startDateTime.toISOString(),
                p_end_time: endDateTime.toISOString()
            });

            if (checkError) throw checkError;
            if (!isAvailable) {
                toast.error('El espacio no está disponible.');
                setSubmitLoading(false);
                return;
            }

            const { data: newResData, error } = await supabase.from('reservations').insert([{
                tenant_id: tenant?.id,
                member_id: newReservation.memberId,
                space_id: newReservation.spaceId,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                status: newReservation.status,
                reference_code: `RES-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
            }]).select();

            if (error) throw error;
            
            if (newReservation.status === 'confirmed' && newResData && newResData.length > 0) {
                const insertedRes = newResData[0];
                const member = members.find(m => m.id === insertedRes.member_id);
                const space = spaces.find(s => s.id === insertedRes.space_id);
                if (member && space) {
                    await sendReservationEmail({
                        to: member.email,
                        memberName: member.name || 'Cliente',
                        spaceName: space.name,
                        reservationDate: `${new Date(insertedRes.start_time).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las ${new Date(insertedRes.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                        tenantId: tenant?.id || ''
                    }).catch(err => console.error("Email error:", err));
                }
            }

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#D4AF37', '#000000', '#FFFFFF']
            });

            await fetchData();
            setIsBookingModalOpen(false);
            toast.success('Reserva creada exitosamente.');

        } catch (err: any) {
            console.error('Error creating reservation:', err);
            toast.error('Error: ' + (err.message || 'Intente nuevamente.'));
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEventChange = async (changeInfo: any) => {
        const { event } = changeInfo;
        const id = event.id;
        const start = event.start.toISOString();
        const end = event.end ? event.end.toISOString() : start;

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
            toast.success('MOVIMIENTO SINCRONIZADO');
        } catch (err) {
            toast.error('ERROR DE SINCRONIZACIÓN');
            fetchData();
        }
    };

    const handleCancelReservation = async (id: string) => {
        if (!window.confirm('¿Desea anular esta reserva?')) return;
        setSubmitLoading(true);
        try {
            const { error } = await supabase
                .from('reservations')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) throw error;
            toast.success('RESERVA ANULADA');
            await fetchData();
            setIsDetailModalOpen(false);
        } catch (err: any) {
            toast.error('Error al anular: ' + err.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleUpdateSpace = async (spaceId: string) => {
        if (!selectedReservation) return;
        try {
            const { error } = await supabase
                .from('reservations')
                .update({ space_id: spaceId })
                .eq('id', selectedReservation.id);

            if (error) throw error;
            setSelectedReservation({ ...selectedReservation, space_id: spaceId });
            toast.success('ACTIVO ACTUALIZADO');
            fetchData();
        } catch (err: any) {
            toast.error('Error al actualizar espacio');
        }
    };

    const getNanoBananaAvatar = (index: number) => {
        return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${index}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    };

    const filteredReservations = reservations.filter(res => {
        return filterStatus === 'all' || res.status === filterStatus;
    });

    const events = filteredReservations.map(res => {
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

    return (
        <div className="space-y-12 pb-32 max-w-[1600px] mx-auto px-6 md:px-12">
            {/* SaaS Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-900 text-white shadow-lg flex items-center gap-2">
                            <Icon name="calendar_month" className="!text-lg" />
                            Reservas
                        </div>
                    </div>
                    
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Icon name="calendar_today" className="!text-sm" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Icon name="list_alt" className="!text-sm" />
                        </button>
                    </div>

                    <p className="text-sm text-slate-400 font-medium hidden md:block">
                        {filteredReservations.length} registros activos
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsBookingModalOpen(true)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-slate-200 border-none cursor-pointer"
                    >
                        <Icon name="add" className="!text-lg" />
                        Nueva Reserva
                    </button>
                </div>
            </div>

            {/* KPI Analytics Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Volumen Total', value: stats.total, icon: 'receipt_long', badge: '+12%', badgeColor: 'bg-green-100 text-green-700' },
                    { label: 'Reservas Confirmadas', value: stats.confirmed, icon: 'verified', badge: '+5%', badgeColor: 'bg-green-100 text-green-700' },
                    { label: 'Reservas Pendientes', value: stats.pending, icon: 'pending', badge: '+8%', badgeColor: 'bg-green-100 text-green-700' },
                    { label: 'Areas en uso', value: stats.uniqueSpaces, icon: 'architecture', badge: '-0.5%', badgeColor: 'bg-red-100 text-red-700' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-10">
                            <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                                <Icon name={stat.icon} className="!text-[20px] font-light" />
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-1 rounded-md ${stat.badgeColor}`}>
                                {stat.badge}
                            </span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">{stat.label}</p>
                            <p className="text-4xl font-black tracking-tighter text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="py-48 flex flex-col items-center justify-center gap-12">
                    <div className="relative size-32">
                        <div className="absolute inset-0 border-t-2 border-[var(--primary)] rounded-full animate-spin-slow"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icon name="hourglass_empty" className="!text-4xl text-[var(--on-surface)]/10 animate-pulse" />
                        </div>
                    </div>
                    <p className="label-md animate-pulse">Sincronizando Disponibilidad...</p>
                </div>
            ) : viewMode === 'calendar' ? (
                <div className="card-workspace group/calendar fc-theme-custom min-h-[900px] overflow-visible">
                    <div className="p-6 lg:p-10">
                        <div className="absolute inset-0 bg-[radial-gradient(var(--on-surface)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none rounded-[2rem]"></div>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            initialView="timeGridWeek"
                            events={events}
                            editable={true}
                            selectable={false}
                            selectMirror={true}
                            dayMaxEvents={true}
                            navLinks={true}
                            navLinkDayClick={(date) => {
                                const dateStr = date.toISOString().split('T')[0];
                                setNewReservation({
                                    ...newReservation,
                                    date: dateStr,
                                    startTime: '09:00',
                                    endTime: '10:00'
                                });
                                setIsBookingModalOpen(true);
                            }}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                            }}
                            eventClick={(info) => {
                                setSelectedReservation(info.event.extendedProps as Reservation);
                                setIsDetailModalOpen(true);
                            }}
                            eventDrop={handleEventChange}
                            eventResize={handleEventChange}
                            dragRevertDuration={0}
                            eventDragMinDistance={5}
                            height="auto"
                            slotMinTime="07:00:00"
                            slotMaxTime="22:00:00"
                            allDaySlot={false}
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                meridiem: false,
                                hour12: false
                            }}
                            eventContent={(eventInfo) => (
                                <div className="p-1 h-full w-full overflow-hidden flex flex-col justify-center">
                                    <div className="text-[9px] font-black uppercase tracking-tighter truncate leading-none mb-0.5">
                                        {eventInfo.event.title}
                                    </div>
                                    <div className="text-[7px] opacity-60 font-bold uppercase tracking-widest leading-none">
                                        {eventInfo.timeText}
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>
            ) : (
                <div className="card-workspace p-0 overflow-hidden animate-slide">
                    <div className="px-12 py-12 border-b border-[var(--outline-variant)]/10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                            <div className="size-20 rounded-2xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] shadow-xl transform hover:rotate-6 transition-transform">
                                <Icon name="inventory_2" className="!text-4xl font-light" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-[var(--on-surface)] tracking-tighter uppercase leading-none">Bitácora de <br/><span className="font-light opacity-40">Operaciones</span></h2>
                                <p className="text-[9px] font-black text-[var(--on-surface-subtle)] uppercase tracking-[0.4em]">{filteredReservations.length} Registros Activos</p>
                            </div>
                        </div>
                        <div className="flex p-1.5 bg-[var(--surface)] rounded-2xl shadow-[var(--neu-pressed-sm)]">
                            {['all', 'confirmed', 'pending', 'cancelled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-8 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${filterStatus === status ? 'btn-brand-yellow !shadow-sm' : 'text-[var(--on-surface-subtle)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]'}`}
                                >
                                    {status === 'all' ? 'Universal' : status === 'confirmed' ? 'Confirmadas' : status === 'pending' ? 'Espera' : 'Bajas'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--surface)] text-[10px] uppercase font-black tracking-[0.3em] text-[var(--on-surface-subtle)] border-b border-[var(--outline-variant)]/10">
                                    <th className="px-12 py-8">Cliente / Identidad</th>
                                    <th className="px-12 py-8">Activo / Espacio</th>
                                    <th className="px-12 py-8">Cronograma</th>
                                    <th className="px-12 py-8 text-right">Estado Actual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--outline-variant)]/5">
                                {filteredReservations.map((res, i) => {
                                    const space = spaces.find(s => s.id === res.space_id);
                                    const member = members.find(m => m.id === res.member_id);
                                    const startTime = new Date(res.start_time);
                                    const endTime = new Date(res.end_time);

                                    return (
                                        <tr
                                            key={res.id}
                                            className="hover:bg-[var(--surface-container-low)] transition-all duration-500 group cursor-pointer animate-fade"
                                            onClick={() => {
                                                setSelectedReservation(res);
                                                setIsDetailModalOpen(true);
                                            }}
                                        >
                                            <td className="px-12 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="size-14 rounded-xl shadow-[var(--neu-flat-sm)] overflow-hidden bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-white/10">
                                                        <img src={getNanoBananaAvatar(i)} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-extrabold text-sm text-[var(--on-surface)] tracking-tight uppercase group-hover:text-[var(--primary)] transition-colors">{member?.name || 'Cliente Anónimo'}</p>
                                                        <p className="text-[9px] font-black text-[var(--on-surface-subtle)] uppercase tracking-[0.2em]">#REF: {res.reference_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8">
                                                <span className="text-sm font-bold text-[var(--on-surface)] tracking-tight uppercase">{space?.name || 'Espacio no Definido'}</span>
                                            </td>
                                            <td className="px-12 py-8">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-[var(--on-surface)] tracking-tighter uppercase">
                                                        {startTime.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                                                    </p>
                                                    <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-2">
                                                        <Icon name="schedule" className="!text-xs font-light" />
                                                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8 text-right">
                                                <span className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${res.status === 'confirmed' ? 'bg-[var(--secondary)] text-white' : res.status === 'pending' ? 'bg-[var(--surface)] text-[var(--tertiary)] shadow-[var(--neu-pressed-sm)]' : 'bg-red-500 text-white'}`}>
                                                    {res.status === 'confirmed' ? 'Validada' : res.status === 'pending' ? 'Pendiente' : res.status === 'completed' ? 'Completada' : 'Anulada'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Manual Booking Modal */}
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
                                                    <option key={m.id} value={m.id}>{(m.name || m.email).toUpperCase()}</option>
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
                                                    <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
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
                                                className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-colors border-none cursor-pointer flex items-center justify-center"
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

            {/* Detail Modal - Variante Minimalista */}
            {isDetailModalOpen && selectedReservation && (() => {
                const space = spaces.find(s => s.id === selectedReservation.space_id);
                const member = members.find(m => m.id === selectedReservation.member_id);
                const isCancelled = selectedReservation.status === 'cancelled';
                
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md" role="dialog" aria-modal="true">
                        <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-fade">
                            
                            {/* Left/Top: Space Image */}
                            <div className="p-6 pb-0">
                                <div className="w-full h-48 rounded-xl overflow-hidden relative bg-slate-900">
                                    <img 
                                        src={space?.images?.[0] || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"} 
                                        className="w-full h-full object-cover opacity-90"
                                        alt={space?.name}
                                    />
                                    <div className="absolute top-3 left-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-md ${selectedReservation.status === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'}`}>
                                            <Icon name={selectedReservation.status === 'confirmed' ? 'verified' : 'cancel'} className="text-[14px]" />
                                            {selectedReservation.status === 'confirmed' ? 'Validado' : 'Anulado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right/Bottom: Details Content */}
                            <div className="p-6 flex flex-col gap-6">
                                
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{space?.name || 'Espacio'}</h2>
                                        <p className="text-[12px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mt-1">
                                            <Icon name="qr_code" className="text-[16px]" />
                                            REF: {selectedReservation.reference_code}
                                        </p>
                                    </div>
                                    <button onClick={() => setIsDetailModalOpen(false)} className="size-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors border-none cursor-pointer text-slate-600">
                                        <Icon name="close" className="!text-lg" />
                                    </button>
                                </div>
                                
                                {/* Primary Details Box */}
                                <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black mb-1">Fecha de Sesión</p>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                            {new Date(selectedReservation.start_time).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">
                                            {new Date(selectedReservation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(selectedReservation.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black mb-1">Costo Estimado</p>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">${space?.price || 45}.00 / hr</p>
                                        <p className="text-[11px] text-emerald-600 font-black uppercase tracking-wider mt-1">Sincronizado</p>
                                    </div>
                                </div>
                                
                                {/* Host / Member Info */}
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-slate-200 overflow-hidden shadow-sm flex items-center justify-center">
                                            <img className="w-full h-full object-cover" src={getNanoBananaAvatar(0)} alt="Avatar" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Titular</p>
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{member?.name || 'Cliente'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Espacio / Select */}
                                <div>
                                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black mb-2">Modificar Espacio Asignado</p>
                                    <PremiumSelect 
                                        value={selectedReservation.space_id}
                                        options={spaces.map(s => ({ value: s.id, label: s.name.toUpperCase() }))}
                                        onChange={(val) => handleUpdateSpace(val)}
                                        placeholder="SELECCIONAR..."
                                        className="!mb-0 shadow-sm"
                                    />
                                </div>
                                
                                {/* Actions */}
                                <div className="flex gap-3 pt-6 border-t border-slate-100">
                                    <button 
                                        onClick={() => setIsDetailModalOpen(false)} 
                                        className="flex-[2] bg-slate-900 text-white py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                                    >
                                        Cerrar Dossier
                                    </button>
                                    {!isCancelled && (
                                        <button 
                                            onClick={() => handleCancelReservation(selectedReservation.id)} 
                                            className="flex-1 bg-red-50 text-red-600 py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                                        >
                                            Anular
                                        </button>
                                    )}
                                </div>
                                
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style>{`
                .fc { font-family: 'Cairo', sans-serif; --fc-border-color: rgba(0,0,0,0.05); }
                .fc .fc-toolbar-title { font-size: 1.2rem; font-weight: 900; text-transform: uppercase; color: var(--secondary); }
                .fc .fc-button { background: var(--surface) !important; border: 1px solid var(--outline-variant) !important; color: var(--on-surface) !important; font-size: 9px !important; font-weight: 900 !important; border-radius: 8px !important; }
                .fc .fc-button-active { background: var(--secondary) !important; color: white !important; }
                
                /* FIX PARA DRAG & DROP OFFSET: Eliminar transiciones durante el arrastre */
                .fc-event { 
                    border: none !important; 
                    border-radius: 12px !important; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; 
                    cursor: move !important;
                    transition: none !important; /* Deshabilitado para evitar desfase del puntero */
                }
                .fc-event:hover { transform: scale(1.02); z-index: 50 !important; transition: transform 0.2s ease !important; }
                .fc-event-dragging { transform: none !important; opacity: 0.8 !important; }

                .fc-timegrid-slot { height: 50px !important; border-bottom: 1px solid rgba(0,0,0,0.02) !important; }
                .fc-theme-custom .fc-scrollgrid { border-radius: 24px !important; overflow: hidden !important; border: 1px solid var(--outline-variant) !important; }

                /* FIX DEFINITIVO PARA DESFASE FANTASMA (OFFSET FIX) */
                .fc-event-mirror {
                    position: fixed !important;
                    z-index: 999999 !important;
                    pointer-events: none !important;
                    opacity: 0.8 !important;
                    margin: 0 !important;
                    transition: none !important;
                    will-change: top, left;
                }
                
                /* Neutralizar CUALQUIER contenedor que cree un nuevo contexto de coordenadas */
                body.fc-unselectable .card-workspace,
                body.fc-unselectable .space-y-12,
                body.fc-unselectable main,
                body.fc-unselectable .relative,
                body.fc-unselectable [class*="Transition"] > div {
                    transform: none !important;
                    perspective: none !important;
                    transition: none !important;
                    position: static !important; /* IMPORTANTE: Rompe el contexto relative */
                }

                /* Asegurar que el calendario mismo mantenga su estructura pero no atrape el mirror */
                .fc-view-harness {
                    position: static !important;
                }

                .fc-event-dragging {
                    opacity: 0.3 !important;
                }
            `}</style>
        </div>
    );
};

export default ManageReservations;
