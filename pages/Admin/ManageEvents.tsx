import React, { useState, useEffect } from 'react';
import { CommunityEvent } from '../../types';
import { useTenant } from '../../contexts/TenantContext';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { supabase, sendRsvpEmail } from '../../supabase';
import { Icon } from '../../components/ui/Icon';
import { LabeledProgressIndicator } from '../../components/ui/LabeledProgressIndicator';

const ManageEvents: React.FC = () => {
    const { tenant } = useTenant();
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
    
    // Attendee states
    const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<CommunityEvent | null>(null);
    const [attendees, setAttendees] = useState<any[]>([]);
    const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
    const [loadingAttendees, setLoadingAttendees] = useState(false);
    const [eventImage, setEventImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const getNanoBananaAvatar = (index: string | number) => {
        return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${index}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    };

    useEffect(() => {
        if (tenant?.id) {
            fetchEvents();
        }
    }, [tenant?.id]);

    const fetchEvents = async () => {
        if (!tenant?.id) return;
        
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*, rsvps_count:event_rsvps(count)')
                .eq('tenant_id', tenant.id)
                .order('event_date', { ascending: false });

            if (error) throw error;

            const formattedEvents = (data || []).map(event => ({
                ...event,
                rsvps_count: Array.isArray(event.rsvps_count)
                    ? (event.rsvps_count[0]?.count || 0)
                    : (event.rsvps_count?.count || 0)
            }));

            setEvents(formattedEvents);
        } catch (err) {
            console.error('Error fetching events:', err);
            toast.error('Error al cargar agenda del tenant');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setEventImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setUploading(true);
            let imageUrl = editingEvent?.image_url || '';

            if (eventImage) {
                const fileExt = eventImage.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `event-${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('events')
                    .upload(filePath, eventImage);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('events').getPublicUrl(filePath);
                imageUrl = data.publicUrl;
            }

            const eventData = {
                title: editingEvent?.title,
                description: editingEvent?.description,
                event_date: editingEvent?.event_date,
                location: editingEvent?.location,
                capacity: editingEvent?.capacity || null,
                image_url: imageUrl,
                is_active: editingEvent?.is_active ?? true
            };

            if (editingEvent?.id) {
                const { error } = await supabase
                    .from('events')
                    .update(eventData)
                    .eq('id', editingEvent.id);
                if (error) throw error;
                toast.success('EVENTO ACTUALIZADO');
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                const { error } = await supabase
                    .from('events')
                    .insert([{
                        ...eventData,
                        created_by: user?.id,
                        tenant_id: tenant?.id
                    }]);
                if (error) throw error;
                toast.success('EVENTO REGISTRADO');
            }

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#686000', '#FDE910', '#11171D']
            });

            setIsModalOpen(false);
            setEventImage(null);
            setImagePreview(null);
            fetchEvents();
        } catch (err: any) {
            console.error('Error saving event:', err);
            toast.error(err.message || 'ERROR EN EL REGISTRO');
        } finally {
            setUploading(false);
        }
    };

    const fetchAttendees = async (event: CommunityEvent) => {
        try {
            setLoadingAttendees(true);
            setSelectedEventForAttendees(event);
            setIsAttendeesModalOpen(true);

            const { data, error } = await supabase
                .from('event_rsvps')
                .select(`
                    id,
                    profile_id,
                    profiles (
                        id,
                        name,
                        email
                    )
                `)
                .eq('event_id', event.id);

            if (error) throw error;
            setAttendees(data || []);
        } catch (err) {
            console.error('Error fetching attendees:', err);
            toast.error('Error al cargar la lista de asistentes');
        } finally {
            setLoadingAttendees(false);
        }
    };

    const handleResendRsvpEmail = async (attendee: any) => {
        if (!selectedEventForAttendees) return;
        
        try {
            const profile = attendee.profiles;
            const email = profile.email;
            
            if (!email) {
                toast.error('El asistente no tiene correo electrónico');
                return;
            }

            const promise = sendRsvpEmail({
                to: email,
                memberName: profile.name || email,
                eventName: selectedEventForAttendees.title,
                eventDate: `${new Date(selectedEventForAttendees.event_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las ${new Date(selectedEventForAttendees.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                eventLocation: selectedEventForAttendees.location,
                tenantId: ''
            });

            toast.promise(promise, {
                loading: 'Reenviando confirmación...',
                success: 'Confirmación reenviada con éxito',
                error: 'Error al reenviar la confirmación'
            });
        } catch (err) {
            console.error('Error resending email:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿CONFIRMA LA ELIMINACIÓN PERMANENTE DE ESTE EVENTO?')) return;
        try {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
            toast.success('EVENTO ELIMINADO');
            fetchEvents();
        } catch (err) {
            toast.error('ERROR EN LA OPERACIÓN');
        }
    };

    return (
        <div className="space-y-12 animate-fade pb-32 max-w-[1600px] mx-auto px-6 md:px-12">
            {/* SaaS Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-900 text-white shadow-lg flex items-center gap-2">
                            <Icon name="event_available" className="!text-lg" />
                            Eventos
                        </div>
                    </div>
                    
                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
                    
                    <p className="text-sm text-slate-400 font-medium hidden md:block">
                        {events.length} experiencias programadas
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { setEditingEvent({ title: '', description: '', event_date: '', location: '', is_active: true } as CommunityEvent); setIsModalOpen(true); }}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-slate-200 border-none cursor-pointer"
                    >
                        <Icon name="add" className="!text-lg" />
                        Nuevo Evento
                    </button>
                </div>
            </div>

            {loading ? (
        <div className="py-48 flex flex-col items-center justify-center gap-12">
            <LabeledProgressIndicator labels={['Sincronizando Agenda Cultural...', 'Consultando eventos...', 'Preparando calendario...']} intervalMs={1200} />
        </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event, index) => (
                        <div 
                            key={event.id} 
                            onClick={() => { setEditingEvent(event); setIsModalOpen(true); }}
                            className="group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden cursor-pointer"
                        >
                            {/* Asset Container */}
                            <div className="aspect-[4/5] overflow-hidden bg-slate-50 relative">
                                <img 
                                    src={event.image_url || `https://picsum.photos/seed/${event.id}/800/1000`} 
                                    alt="" 
                                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                
                                {/* Status Chip */}
                                <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
                                    <div className={`size-2 rounded-full ${event.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                                        {event.is_active ? 'Publicado' : 'Borrador'}
                                    </span>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="p-8 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">
                                            {event.event_date ? new Date(event.event_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }).toUpperCase() : 'PENDIENTE'}
                                        </p>
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg">
                                            <span className="text-[10px] font-bold text-slate-900">
                                                {event.rsvps_count || 0} / {event.capacity || '∞'}
                                            </span>
                                            <Icon name="group" className="!text-sm text-indigo-600" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                                        {event.title}
                                    </h3>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <Icon name="location_on" className="!text-lg text-indigo-500" />
                                        {event.location}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); fetchAttendees(event); }}
                                            className="size-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                            title="Ver asistentes"
                                        >
                                            <Icon name="group" className="!text-xl" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                                            className="size-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                            title="Eliminar evento"
                                        >
                                            <Icon name="delete" className="!text-xl" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add Placeholder */}
                    <button
                        onClick={() => { setEditingEvent({ title: '', description: '', event_date: '', location: '', is_active: true } as CommunityEvent); setIsModalOpen(true); }}
                        className="bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] hover:border-indigo-500/50 hover:bg-indigo-50/10 transition-all flex flex-col items-center justify-center gap-6 group min-h-[500px]"
                    >
                        <div className="size-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all">
                            <Icon name="add" className="!text-3xl" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">Nuevo Evento</p>
                            <p className="text-xs text-slate-400">Expandir agenda cultural</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Editorial Modal Overhaul */}
            {isModalOpen && (
                <div className="modal-backdrop bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 fixed inset-0" role="dialog" aria-modal="true">
                    <div className="modal-container w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col md:flex-row bg-white border border-[var(--outline-variant)] shadow-2xl animate-fade">
                        
                        {/* Left Pane - Image & Description */}
                        <div className="w-full md:w-[60%] p-6 md:p-8 space-y-6 flex flex-col overflow-y-auto max-h-[85vh] custom-scrollbar">
                            {/* Image Upload Area */}
                            <div className="relative group/img h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-100 shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer">
                                {(imagePreview || editingEvent?.image_url) ? (
                                    <>
                                        <img
                                            src={imagePreview || editingEvent?.image_url}
                                            alt="Preview"
                                            className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover/img:grayscale-0 group-hover/img:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <span className="px-6 py-2.5 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-full shadow-xl">Cambiar Imagen</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center space-y-4 opacity-40 group-hover/img:opacity-100 transition-all text-slate-500">
                                        <Icon name="add_a_photo" className="!text-5xl" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Subir Imagen del Evento</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>

                            {/* Narrativa / Descripción */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Narrativa / Descripción</label>
                                <textarea
                                    className="w-full h-32 border border-slate-200 rounded-xl p-4 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                                    placeholder="Describe la esencia de la experiencia..."
                                    value={editingEvent?.description || ''}
                                    onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Right Pane - Form & Actions */}
                        <div className="w-full md:w-[40%] bg-slate-50 p-6 md:p-8 flex flex-col border-l border-slate-200 overflow-y-auto max-h-[85vh] custom-scrollbar">
                            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                                
                                {/* Header */}
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Asset Architecture</p>
                                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                                            {editingEvent?.id ? 'Redefinir' : 'Configurar'} Evento
                                        </h2>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)} 
                                        className="size-8 bg-slate-200/60 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors text-slate-600 border-none cursor-pointer"
                                    >
                                        <Icon name="close" className="!text-lg" />
                                    </button>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-5 flex-1">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Título de la Narrativa</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="EJ. NETWORKING VERTICAL..."
                                            className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all uppercase"
                                            value={editingEvent?.title || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cronología</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white font-bold focus:border-indigo-500 outline-none transition-all"
                                                value={editingEvent?.event_date ? new Date(editingEvent.event_date).toISOString().slice(0, 16) : ''}
                                                onChange={e => setEditingEvent({ ...editingEvent, event_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aforo / Cupos</label>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="ILIMITADO"
                                                className={`w-full border ${editingEvent?.capacity !== null && editingEvent?.capacity <= 0 ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white'} rounded-xl p-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all`}
                                                value={editingEvent?.capacity ?? ''}
                                                onChange={e => setEditingEvent({ ...editingEvent, capacity: e.target.value ? parseInt(e.target.value) : null })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ubicación Estratégica</label>
                                        <input
                                            type="text"
                                            placeholder="SEDE PANAMÁ / SALA DE JUNTAS..."
                                            className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white font-bold focus:border-indigo-500 outline-none transition-all uppercase"
                                            value={editingEvent?.location || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                                        />
                                    </div>
                                    
                                    {/* Estado Switch */}
                                    <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Estado de Exposición</p>
                                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Visible en la app móvil</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={editingEvent?.is_active ?? true}
                                                onChange={e => setEditingEvent({ ...editingEvent, is_active: e.target.checked })}
                                            />
                                            <div className="w-12 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-8 mt-auto">
                                    <button
                                        type="submit"
                                        disabled={uploading || !editingEvent?.title || !editingEvent?.event_date}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-colors border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? (
                                            <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                {editingEvent?.id ? 'Actualizar Evento' : 'Publicar Experiencia'}
                                                <Icon name="send" className="!text-base" />
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full py-4 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
                                    >
                                        Descartar
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            )}

            {/* Attendees Modal Overhaul */}
            {isAttendeesModalOpen && selectedEventForAttendees && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="modal-container max-w-2xl !rounded-[3rem] shadow-2xl">
                        <header className="modal-header !p-12 !pb-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--primary)] opacity-60">Lista de Asistentes</p>
                                <h3 className="text-4xl tracking-tighter uppercase font-black text-[var(--on-surface)] leading-none line-clamp-1">
                                    {selectedEventForAttendees.title}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-subtle)] opacity-40">
                                    {attendees.length} IDENTIDADES CONFIRMADAS
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsAttendeesModalOpen(false)}
                                className="size-14 rounded-2xl bg-[var(--surface)] shadow-[var(--neu-flat-sm)] text-[var(--on-surface)] hover:shadow-[var(--neu-pressed-sm)] transition-all flex items-center justify-center group"
                            >
                                <Icon name="close" className="!text-2xl font-light group-hover:rotate-90 transition-transform" />
                            </button>
                        </header>

                        <div className="modal-body !p-12 !pt-4">
                            {loadingAttendees ? (
                                <div className="py-24 flex flex-col items-center justify-center gap-8">
                                    <LabeledProgressIndicator labels={['Sincronizando Archivo...']} intervalMs={1500} />
                                </div>
                            ) : attendees.length > 0 ? (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
                                    {attendees.map((attendee, index) => (
                                        <div 
                                            key={attendee.id}
                                            style={{ animationDelay: `${index * 30}ms` }}
                                            className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:shadow-xl hover:-translate-y-1 transition-all group animate-fade"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="size-12 rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm">
                                                    <img 
                                                        src={getNanoBananaAvatar(attendee.profiles?.id || attendee.id)} 
                                                        className="w-full h-full object-cover" 
                                                        alt="" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-black uppercase tracking-tighter text-slate-900 group-hover:text-[var(--primary)] transition-colors">
                                                        {attendee.profiles?.full_name || attendee.profiles?.name || 'Usuario sin nombre'}
                                                    </h4>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                                                        {attendee.profiles?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleResendRsvpEmail(attendee)}
                                                className="size-12 rounded-xl bg-white border border-slate-100 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all flex items-center justify-center group/btn shadow-sm"
                                                title="Reenviar Confirmación"
                                            >
                                                <Icon name="mail" className="!text-xl group-hover/btn:rotate-12 transition-transform" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-32 text-center rounded-[3rem] border-2 border-dashed border-slate-100 space-y-6">
                                    <Icon name="group_off" className="!text-6xl text-slate-200" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cero Asistentes Registrados</p>
                                </div>
                            )}
                        </div>

                        <footer className="modal-footer !p-12 !pt-4 !bg-transparent">
                            <button
                                onClick={() => setIsAttendeesModalOpen(false)}
                                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-black transition-all shadow-xl"
                            >
                                CERRAR ARCHIVO
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageEvents;
