import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { Guest } from '../../types';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

const ManageGuests: React.FC = () => {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchGuests();

        const channel = supabase
            .channel('guests-admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, () => {
                fetchGuests();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchGuests = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('guests')
                .select('*, host:profiles(id, name, email)')
                .order('visit_date', { ascending: false });

            if (error) throw error;
            setGuests(data || []);
        } catch (err: any) {
            console.error('Error fetching guests:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: Guest['status']) => {
        try {
            const { error } = await supabase
                .from('guests')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            if (status === 'arrived') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FDE910', '#11171D', '#FFFFFF']
                });
                toast.success('INVITADO REGISTRADO');
            } else {
                toast.success(`ESTADO: ${status.toUpperCase()}`);
            }
        } catch (err: any) {
            toast.error('ERROR EN LA OPERACIÓN');
        }
    };

    const filteredGuests = guests.filter(g =>
        g.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.host as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade pb-32 px-6 md:px-12">
            {/* SaaS Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-900 text-white shadow-lg flex items-center gap-2">
                            <span className="material-symbols-outlined !text-lg">security</span>
                            Invitados
                        </div>
                    </div>
                    
                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoy:</span>
                        <span className="text-sm font-bold text-slate-900">
                            {guests.filter(g => g.visit_date === new Date().toISOString().split('T')[0]).length}
                        </span>
                    </div>

                    <p className="text-sm text-slate-400 font-medium hidden md:block">
                        {filteredGuests.length} registros en bitácora
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={fetchGuests}
                        className={`size-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all ${loading ? 'animate-spin' : ''}`}
                    >
                        <span className="material-symbols-outlined !text-xl">refresh</span>
                    </button>
                </div>
            </div>

            {/* Search Section */}
            <div className="relative group mb-10">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors !text-xl">search</span>
                <input
                    type="text"
                    placeholder="BUSCAR POR NOMBRE O ANFITRIÓN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-16 pl-16 pr-6 bg-white border border-slate-100 rounded-2xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
                />
            </div>

            {loading ? (
                <div className="py-48 flex flex-col items-center justify-center gap-12">
                    <div className="relative size-32">
                        <div className="absolute inset-0 border-[1px] border-slate-100 rounded-full scale-150"></div>
                        <div className="absolute inset-0 border-t-2 border-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined !text-4xl text-slate-200 animate-pulse">security</span>
                        </div>
                    </div>
                    <div className="text-center space-y-4">
                        <p className="text-sm font-bold text-slate-400 animate-pulse">Sincronizando Bitácora de Acceso</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-slide">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-b border-slate-100">
                                    <th className="px-8 py-6">Visitante</th>
                                    <th className="px-8 py-6">Anfitrión</th>
                                    <th className="px-8 py-6">Programación</th>
                                    <th className="px-8 py-6">Estado</th>
                                    <th className="px-8 py-6 text-right">Protocolo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredGuests.length > 0 ? (
                                    filteredGuests.map((guest, index) => (
                                        <tr 
                                            key={guest.id} 
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                                                        <span className="material-symbols-outlined !text-xl">account_circle</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{guest.full_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium lowercase">{guest.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">{(guest.host as any)?.name || 'Anónimo'}</p>
                                                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest opacity-60">Socio Buró</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tighter">
                                                        {guest.visit_date === new Date().toISOString().split('T')[0] ? 'Hoy, ' : ''}
                                                        {new Date(guest.visit_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                                                        <span className="material-symbols-outlined !text-xs">schedule</span>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest">{guest.visit_time}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                                                    guest.status === 'arrived' 
                                                        ? 'bg-indigo-600 text-white' 
                                                        : guest.status === 'pending' 
                                                            ? 'bg-slate-100 text-slate-600' 
                                                            : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    <div className={`size-1.5 rounded-full ${
                                                        guest.status === 'arrived' ? 'bg-white animate-pulse' :
                                                        guest.status === 'pending' ? 'bg-indigo-600' : 'bg-rose-600'
                                                    }`}></div>
                                                    {guest.status === 'pending' ? 'Programado' :
                                                        guest.status === 'arrived' ? 'En el Cowork' :
                                                            guest.status === 'departed' ? 'Finalizado' : 'Cancelado'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {guest.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(guest.id, 'arrived')}
                                                            className="h-10 px-6 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined !text-base">verified</span>
                                                            Check-In
                                                        </button>
                                                    )}
                                                    {guest.status === 'arrived' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(guest.id, 'departed')}
                                                            className="h-10 px-6 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
                                                        >
                                                            Finalizar
                                                        </button>
                                                    )}
                                                    {guest.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(guest.id, 'cancelled')}
                                                            className="size-10 rounded-lg bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all flex items-center justify-center"
                                                        >
                                                            <span className="material-symbols-outlined !text-lg">close</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-20">
                                                <span className="material-symbols-outlined !text-6xl">person_search</span>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold uppercase tracking-widest">Sin registros</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">No hay invitados que coincidan</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageGuests;
