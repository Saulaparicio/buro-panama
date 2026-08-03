import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { Member, Quote } from '../types';
import { useTranslation } from 'react-i18next';
import { useTenant } from '../contexts/TenantContext';
import { Icon } from '../components/ui/Icon';

const Home: React.FC = () => {
    const { t } = useTranslation();
    const { tenant } = useTenant();
    const [profile, setProfile] = useState<Member | null>(null);
    const [pendingQuotes, setPendingQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, [tenant]);

    const fetchProfile = async () => {
        if (!tenant) {
            setLoading(false);
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(profileData);

                if (profileData) {
                    const { data: quotesData } = await supabase
                        .from('quotes')
                        .select('*')
                        .eq('tenant_id', tenant.id)
                        .or(`client_name.ilike.%${profileData.name}%,client_email.eq.${user.email}`)
                        .eq('status', 'sent');
                    setPendingQuotes(quotesData || []);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6">
                <div className="size-12 border-4 border-stone-200 border-t-[var(--primary)] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto animate-fade">
            {/* Welcome Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Welcome Card (Main) */}
                <div className="lg:col-span-8 bg-white p-8 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden border border-slate-100">
                    <div className="z-10">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2 font-display">¡Bienvenido de vuelta, {profile?.name?.split(' ')[0] || 'Usuario'}!</h2>
                        <p className="text-sm text-slate-500 max-w-md">Tu espacio de trabajo está listo. Tienes {pendingQuotes.length} cotizaciones pendientes y varias reservas esta semana.</p>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-4 z-10">
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4 min-w-[200px]">
                            <div className="size-10 rounded-full bg-[var(--primary-fixed)] flex items-center justify-center text-[var(--on-primary-fixed)]">
                                <Icon name="verified" className="!text-xl" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Actual</p>
                                <p className="text-sm font-bold text-slate-800">{profile?.role === 'admin' ? 'Administrador' : 'Membresía Flexible'}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4 min-w-[200px]">
                            <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Icon name="account_balance_wallet" className="!text-xl" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Créditos</p>
                                <p className="text-sm font-bold text-slate-800">{profile?.credits || 0} Disponibles</p>
                            </div>
                        </div>
                    </div>
                    {/* Subtle Decorative Element */}
                    <div className="absolute -right-10 -bottom-10 size-48 bg-[var(--primary)]/5 rounded-full blur-3xl"></div>
                </div>
                
                {/* Digital Key Card */}
                <div className="lg:col-span-4 bg-white p-8 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">Llave de Acceso</p>
                    <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--on-primary-fixed)] p-4 rounded-2xl shadow-lg mb-6 hover:scale-105 transition-transform cursor-pointer group">
                        <div className="bg-white p-3 rounded-xl flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                            <Icon name="qr_code_2" className="!text-[80px] text-slate-800" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">Escanea para abrir</p>
                        <p className="text-[10px] text-slate-500 italic">Válido en tu sucursal principal</p>
                    </div>
                </div>
            </div>

            {/* Secondary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Time Remaining Card */}
                <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border-l-4 border-[var(--primary)] border-y border-r border-y-slate-100 border-r-slate-100">
                    <div className="flex justify-between items-start mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sesión Actual</p>
                        <span className="px-2 py-1 bg-[var(--primary-fixed)] text-[var(--on-primary-fixed)] text-[10px] font-bold rounded-md uppercase">En Curso</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-black text-[var(--primary)] font-display">04</span>
                        <span className="text-3xl font-black text-slate-300">:</span>
                        <span className="text-4xl font-black text-[var(--primary)] font-display">22</span>
                    </div>
                    <p className="text-sm text-slate-500">Hasta que termine tu reserva</p>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                        <Link to="/reservations" className="text-[var(--primary)] text-xs font-bold hover:underline">Extender Sesión</Link>
                        <span className="text-slate-600 text-xs font-bold">Sala Juntos B</span>
                    </div>
                </div>

                {/* Usage Stats */}
                <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">Actividad del Mes</p>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">Horas Utilizadas</span>
                                <span className="text-xs font-bold text-[var(--primary)]">128h / 160h</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-[var(--primary)] h-full rounded-full" style={{ width: '80%' }}></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                                <p className="text-2xl font-black text-slate-800">12</p>
                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Reservas</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                                <p className="text-2xl font-black text-slate-800">8</p>
                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Pases</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Community Feed Hybrid */}
                <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comunidad</p>
                            <Link to="/community" className="text-[var(--primary)] material-symbols-outlined !text-lg hover:bg-[var(--primary-container)] rounded-full p-1 transition-colors">arrow_forward</Link>
                        </div>
                        <div className="space-y-4">
                            {/* Post 1 */}
                            <div className="flex gap-4">
                                <div className="size-10 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=Sarah+J&background=random')" }}></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Sarah J. <span className="font-normal text-slate-500 ml-1 text-xs">en #Design</span></p>
                                    <p className="text-xs text-slate-500 line-clamp-1 italic mt-0.5">"¿Alguien para un workshop a la hora del almuerzo?"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event */}
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mt-4">
                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Próximo Evento</p>
                        <p className="text-sm font-bold text-slate-800">Founder's Friday Mixer</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 mb-3">
                            <Icon name="schedule" className="!text-sm" />
                            <span>Mañana, 5:00 PM</span>
                        </div>
                        <Link to="/events" className="w-full py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors block text-center">RSVP Ahora</Link>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Calendar/Resource View */}
            <div className="bg-white p-8 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 font-display">Tu Calendario de Espacios</h3>
                        <p className="text-sm text-slate-500 mt-1">Administra tus próximas reservas y espacios de trabajo</p>
                    </div>
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <button className="px-4 py-2 bg-white rounded-md shadow-sm text-xs font-bold text-[var(--primary)]">Lista</button>
                        <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">Calendario</button>
                    </div>
                </div>
                
                <div className="space-y-3">
                    {/* Booking Row 1 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-6">
                            <div className="size-14 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-200 shadow-sm shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OCT</span>
                                <span className="text-xl font-black text-slate-800">24</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 mb-1">Boardroom A - Creative Session</p>
                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                    <Icon name="schedule" className="!text-sm" /> 02:00 PM - 04:00 PM
                                    <span className="text-slate-300">•</span>
                                    <Icon name="groups" className="!text-sm" /> 6 Invitados
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 sm:mt-0 justify-end">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Confirmado</span>
                            <button className="size-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-400 group-hover:text-[var(--primary)] group-hover:border-[var(--primary-container)] transition-colors">
                                <Icon name="chevron_right" className="!text-lg" />
                            </button>
                        </div>
                    </div>

                    {/* Booking Row 2 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-6 opacity-60">
                            <div className="size-14 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-200 shadow-sm shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OCT</span>
                                <span className="text-xl font-black text-slate-800">25</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 mb-1">Hot Desk #104</p>
                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                    <Icon name="schedule" className="!text-sm" /> 09:00 AM - 06:00 PM
                                    <span className="text-slate-300">•</span>
                                    <Icon name="repeat" className="!text-sm" /> Pase Diario
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 sm:mt-0 justify-end">
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Recurrente</span>
                            <button className="size-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-400 group-hover:text-[var(--primary)] group-hover:border-[var(--primary-container)] transition-colors">
                                <Icon name="chevron_right" className="!text-lg" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <Link to="/reservations" className="flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:text-indigo-800 transition-colors bg-[var(--primary-container)] px-6 py-2 rounded-full">
                        Ver Agenda Completa
                        <Icon name="arrow_forward" className="!text-lg" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
