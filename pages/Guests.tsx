import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Guest } from '../types';
import { toast } from 'react-hot-toast';

const Guests: React.FC = () => {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        visit_date: '',
        visit_time: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchSessionAndGuests();
    }, []);

    const fetchSessionAndGuests = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data, error } = await supabase
                    .from('guests')
                    .select('*')
                    .eq('host_id', user.id)
                    .order('visit_date', { ascending: false });

                if (error) throw error;
                setGuests(data || []);
            }
        } catch (err: any) {
            console.error('Error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.from('guests').insert([{
                host_id: user.id,
                full_name: formData.full_name,
                email: formData.email,
                visit_date: formData.visit_date,
                visit_time: formData.visit_time,
                notes: formData.notes,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;

            toast.success('Invitado registrado exitosamente');
            setIsModalOpen(false);
            setFormData({ full_name: '', email: '', visit_date: '', visit_time: '', notes: '' });
            fetchSessionAndGuests();
        } catch (err: any) {
            toast.error('Error al registrar: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-12 animate-fade pb-20">
            {/* Minimalist Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-[var(--outline-variant)]/10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="size-14 bg-[#6b6d00] text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined !text-3xl">fingerprint</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">Accesos & Visitas</h1>
                    </div>
                    <p className="text-sm font-medium opacity-60 font-jakarta leading-relaxed max-w-2xl">
                        Protocolos de seguridad, registro de invitados y gestión de anfitriones en tiempo real.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-4 px-10 py-4 bg-[var(--on-primary-fixed)] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 font-jakarta shadow-2xl hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                    <span className="material-symbols-outlined !text-xl">add</span>
                    Programar
                </button>
            </header>

            <main className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-80 bg-[var(--surface-container-low)] rounded-3xl animate-pulse"></div>
                        ))
                    ) : guests.length > 0 ? (
                        guests.map(guest => (
                            <div key={guest.id} className="card-workspace group relative overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:-translate-y-2 transition-all duration-700">
                                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest transition-colors z-10 ${
                                    guest.status === 'arrived' ? 'bg-green-500 text-white' :
                                    guest.status === 'pending' ? 'bg-[var(--primary-container)] text-[var(--on-primary-fixed)]' :
                                    'bg-[var(--surface-container-highest)] text-stone-400'
                                }`}>
                                    {guest.status === 'pending' ? 'Pendiente' : guest.status === 'arrived' ? 'En Recepción' : guest.status === 'departed' ? 'Finalizada' : 'Cancelada'}
                                </div>

                                <div className="space-y-8">
                                    <div className="size-16 bg-[var(--surface-container-high)] rounded-2xl flex items-center justify-center text-[var(--on-primary-fixed)] group-hover:bg-[var(--primary-container)] transition-colors duration-500">
                                        <span className="material-symbols-outlined !text-3xl">{guest.status === 'arrived' ? 'how_to_reg' : 'person'}</span>
                                    </div>

                                    <div>
                                        <h4 className="headline-md text-2xl font-display uppercase tracking-tighter text-[var(--on-primary-fixed)] leading-none truncate">{guest.full_name}</h4>
                                        <p className="label-md text-[10px] opacity-40 mt-2 truncate lowercase tracking-wider">{guest.email}</p>
                                    </div>

                                    <div className="pt-8 border-t border-[var(--outline-variant)]/10 space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="opacity-30">FECHA</span>
                                            <span className="text-[var(--on-primary-fixed)]">{guest.visit_date}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="opacity-30">HORA ESTIMADA</span>
                                            <span className="text-[var(--on-primary-fixed)]">{guest.visit_time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 bg-[var(--surface-container-low)] rounded-3xl flex flex-col items-center justify-center gap-8 border-2 border-dashed border-[var(--outline-variant)]/20 px-6 text-center">
                            <span className="material-symbols-outlined !text-7xl opacity-10">fingerprint</span>
                            <div className="space-y-4">
                                <p className="label-md text-sm font-black text-[var(--on-primary-fixed)]">No se han registrado visitas</p>
                                <p className="text-xs opacity-40 max-w-xs mx-auto">Su historial de invitados aparecerá aquí una vez que comience a programar sus reuniones.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn-primary"
                            >
                                Iniciar Registro
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Editorial Architectural Workspace */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12 bg-[var(--on-primary-fixed)]/90 backdrop-blur-3xl animate-fade">
                    <div className="relative w-full max-w-2xl bg-[var(--surface)] rounded-3xl p-10 md:p-16 shadow-2xl overflow-hidden">
                        <header className="flex justify-between items-start mb-12 border-b border-[var(--outline-variant)]/20 pb-10">
                            <div>
                                <span className="label-md opacity-40 mb-2 block tracking-widest">REGISTRO DE ACTIVO</span>
                                <h3 className="display-lg text-3xl md:text-4xl uppercase font-display tracking-tighter text-[var(--on-primary-fixed)]">
                                    Programar Visita
                                </h3>
                            </div>
                            <button
                                disabled={submitting}
                                onClick={() => setIsModalOpen(false)}
                                className="size-14 rounded-xl bg-[var(--surface-container-low)] flex items-center justify-center text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all border border-[var(--outline-variant)]/20"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>

                        <form onSubmit={handleRegisterGuest} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="label-md text-[10px] opacity-40 px-1">Nombre Completo</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full h-16 px-6 bg-[var(--surface-container-low)] border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary-container)] font-bold text-sm text-[var(--on-primary-fixed)] outline-none transition-all"
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="label-md text-[10px] opacity-40 px-1">Correo Electrónico</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full h-16 px-6 bg-[var(--surface-container-low)] border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary-container)] font-bold text-sm text-[var(--on-primary-fixed)] outline-none transition-all"
                                        placeholder="juan@ejemplo.com"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="label-md text-[10px] opacity-40 px-1">Fecha de Visita</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.visit_date}
                                        onChange={e => setFormData({ ...formData, visit_date: e.target.value })}
                                        className="w-full h-16 px-6 bg-[var(--surface-container-low)] border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary-container)] font-bold text-sm text-[var(--on-primary-fixed)] outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="label-md text-[10px] opacity-40 px-1">Hora Estimada</label>
                                    <input
                                        required
                                        type="time"
                                        value={formData.visit_time}
                                        onChange={e => setFormData({ ...formData, visit_time: e.target.value })}
                                        className="w-full h-16 px-6 bg-[var(--surface-container-low)] border-none rounded-2xl focus:ring-2 focus:ring-[var(--primary-container)] font-bold text-sm text-[var(--on-primary-fixed)] outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <label className="label-md text-[10px] opacity-40 px-1">Notas Adicionales</label>
                                    <textarea
                                        rows={3}
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full p-6 bg-[var(--surface-container-low)] border-none rounded-xl focus:ring-2 focus:ring-[var(--primary-container)] font-bold text-sm text-[var(--on-primary-fixed)] outline-none resize-none transition-all"
                                        placeholder="Requerimientos específicos de la visita..."
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="btn-primary w-full h-20 text-sm tracking-[0.3em] shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4"
                                >
                                    {submitting ? (
                                        <div className="size-6 border-4 border-[var(--on-primary-fixed)] border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined !text-xl">verified_user</span>
                                            CONFIRMAR INVITACIÓN
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Guests;

