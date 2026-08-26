import React, { useState, useEffect } from 'react';
import { CommunityEvent } from '../types';
import { useTenant } from '../contexts/TenantContext';
import { toast } from 'react-hot-toast';
import { supabase, sendRsvpEmail } from '../supabase';
import { Icon } from '../components/ui/Icon';
import { LabeledProgressIndicator } from '../components/ui/LabeledProgressIndicator';

const Events: React.FC = () => {
    const { tenant } = useTenant();
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRsvps, setUserRsvps] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        fetchEvents();
        fetchUserRsvps();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*, rsvps_count:event_rsvps(count)')
                .eq('tenant_id', tenant?.id)
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRsvps = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('event_rsvps')
                .select('event_id')
                .eq('profile_id', user.id);

            if (error) throw error;
            setUserRsvps(data?.map(d => d.event_id) || []);
        } catch (err) {
            console.error('Error fetching RSVPs:', err);
        }
    };

    const handleRsvp = async (eventId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Debes iniciar sesión para confirmar tu asistencia');
                return;
            }

            const isRsvpd = userRsvps.includes(eventId);

            if (isRsvpd) {
                const { error } = await supabase
                    .from('event_rsvps')
                    .delete()
                    .eq('event_id', eventId)
                    .eq('profile_id', user.id);
                if (error) throw error;
                setUserRsvps(prev => prev.filter(id => id !== eventId));
                toast.success('Asistencia cancelada');
            } else {
                const { error } = await supabase
                    .from('event_rsvps')
                    .insert([{ event_id: eventId, profile_id: user.id }]);
                if (error) throw error;
                
                setUserRsvps(prev => [...prev, eventId]);
                toast.success('¡Te esperamos!');

                const event = events.find(e => e.id === eventId);
                const { data: profile } = await supabase.from('profiles').select('name, email').eq('id', user.id).single();

                if (event && profile) {
                    sendRsvpEmail({
                        to: profile.email || user.email,
                        memberName: profile.name || user.email,
                        eventName: event.title,
                        eventDate: `${new Date(event.event_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las ${new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                        eventLocation: event.location,
                        tenantId: ''
                    }).catch(err => console.error('Error sending RSVP email:', err));
                }
            }
            fetchEvents();
        } catch (err) {
            toast.error('Error al gestionar tu asistencia');
        }
    };

    const filteredEvents = events.filter(e => {
        const isPast = new Date(e.event_date) < new Date();
        return activeTab === 'upcoming' ? !isPast : isPast;
    });

    return (
        <div className="space-y-12 animate-fade pb-20">
            {/* Minimalist Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-[var(--outline-variant)]/10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="size-14 bg-[#6b6d00] text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Icon name="event" className="!text-3xl" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">Eventos & Agenda</h1>
                    </div>
                    <p className="text-sm font-medium opacity-60 font-jakarta leading-relaxed max-w-2xl">
                        Curaduría de experiencias de alto valor, eventos exclusivos y networking ejecutivo de primer nivel.
                    </p>
                </div>

                <nav className="flex bg-[var(--surface-container-low)] p-1.5 rounded-xl items-center border border-[var(--outline-variant)]/10 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 md:flex-none px-10 py-3.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 font-jakarta whitespace-nowrap ${activeTab === 'upcoming' ? 'bg-[var(--on-primary-fixed)] text-white shadow-xl' : 'text-[var(--on-surface)]/30 hover:text-[var(--on-surface)]'}`}
                    >
                        Próximos
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`flex-1 md:flex-none px-10 py-3.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 font-jakarta whitespace-nowrap ${activeTab === 'past' ? 'bg-[var(--on-primary-fixed)] text-white shadow-xl' : 'text-[var(--on-surface)]/30 hover:text-[var(--on-surface)]'}`}
                    >
                        Pasados
                    </button>
                </nav>
            </header>

            <main className="mt-8">
                <div className="max-w-[1400px] mx-auto">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center">
                            <LabeledProgressIndicator labels={['Sincronizando eventos...']} intervalMs={1500} />
                        </div>
                    ) : filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
                            {filteredEvents.map((event, i) => (
                                <article 
                                    key={event.id}
                                    className="group flex flex-col gap-8 animate-slide"
                                    style={{ animationDelay: `${i * 150}ms` }}
                                >
                                    <div className="relative aspect-[4/5] md:aspect-square overflow-hidden bg-[var(--surface-container)] rounded-3xl shadow-sm">
                                        <img
                                            src={event.image_url || `https://images.unsplash.com/photo-1540317580324-e51045a4263f?auto=format&fit=crop&q=80&w=800`}
                                            alt={event.title}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                        />
                                        
                                        {/* Date Tag */}
                                        <div className="absolute top-0 right-0 bg-[var(--primary-container)] text-[var(--on-primary-fixed)] p-6 flex flex-col items-center">
                                            <span className="text-4xl font-manrope font-extrabold leading-none">
                                                {new Date(event.event_date).getDate()}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest mt-1">
                                                {new Date(event.event_date).toLocaleDateString('es-ES', { month: 'short' })}
                                            </span>
                                        </div>

                                        {userRsvps.includes(event.id) && (
                                            <div className="absolute bottom-6 left-6 bg-[var(--on-primary-fixed)] text-white px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] shadow-lg">
                                                Confirmado
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6 flex-1 flex flex-col">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] font-jakarta">
                                                    {new Date(event.event_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} • {event.location}
                                                </span>
                                            </div>
                                            <h3 className="headline-md tracking-tight uppercase leading-tight group-hover:text-[var(--primary-container)] transition-colors duration-500">
                                                {event.title}
                                            </h3>
                                        </div>

                                        <p className="opacity-60 font-medium leading-[1.6] flex-1 font-jakarta">
                                            {event.description}
                                        </p>

                                        <div className="pt-8 flex items-center justify-between gap-6 border-t border-[var(--outline-variant)]/10">
                                            <div className="flex -space-x-3">
                                                {[1, 2, 3].map(id => (
                                                    <div key={id} className="w-10 h-10 rounded-full border-2 border-[var(--surface)] overflow-hidden bg-[var(--surface-container)]">
                                                        <img src={`https://ui-avatars.com/api/?name=U+${id}&background=eeeee9&color=11171D`} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                {event.rsvps_count > 3 && (
                                                    <div className="w-10 h-10 rounded-full border-2 border-[var(--surface)] bg-[var(--on-primary-fixed)] flex items-center justify-center text-[10px] font-bold text-white">
                                                        +{event.rsvps_count - 3}
                                                    </div>
                                                )}
                                                {event.rsvps_count <= 3 && event.rsvps_count > 0 && (
                                                    <div className="w-10 h-10 rounded-full border-2 border-[var(--surface)] bg-[var(--surface-container)] flex items-center justify-center text-[10px] font-bold text-[var(--on-surface)]">
                                                        {event.rsvps_count}
                                                    </div>
                                                )}
                                            </div>

                                            {activeTab === 'upcoming' && (
                                                <button
                                                    onClick={() => handleRsvp(event.id)}
                                                    className={`btn-primary ${userRsvps.includes(event.id) ? 'bg-[var(--surface-container)] opacity-40 hover:opacity-100 hover:bg-[var(--on-primary-fixed)] hover:text-white' : ''}`}
                                                >
                                                    {userRsvps.includes(event.id) ? 'Cancelar' : 'Confirmar Asistencia'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="py-40 flex flex-col items-center justify-center text-center space-y-8 animate-fade">
                            <div className="w-32 h-px bg-[var(--outline-variant)]/30"></div>
                            <div className="space-y-4">
                                <h2 className="display-lg opacity-10 uppercase">Silencio Operativo</h2>
                                <p className="label-md opacity-20">No se han detectado eventos programados en este cluster.</p>
                            </div>
                            <div className="w-32 h-px bg-[var(--outline-variant)]/30"></div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Events;


