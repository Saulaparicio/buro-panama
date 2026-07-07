import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { MembershipTier } from '../../types';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import PremiumSelect from '../../components/ui/PremiumSelect';
import { useTenant } from '../../contexts/TenantContext';

const ManagePlans: React.FC = () => {
    const { t } = useTranslation();
    const { tenant } = useTenant();
    const [tiers, setTiers] = useState<MembershipTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTier, setEditingTier] = useState<Partial<MembershipTier> | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [newFeature, setNewFeature] = useState('');

    useEffect(() => {
        if (tenant?.id) {
            fetchTiers();
        }
    }, [tenant?.id]);

    const fetchTiers = async () => {
        if (!tenant?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('membership_tiers')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('price', { ascending: true });

            if (error) throw error;
            setTiers(data || []);
        } catch (err: any) {
            console.error('Error fetching tiers:', err);
            toast.error('Error al cargar estructuras de membresía del tenant.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (tier?: MembershipTier) => {
        setEditingTier(tier || {
            name: '',
            description: '',
            price: 0,
            billing_cycle: 'monthly',
            features: [],
            is_active: true,
            monthly_credits: 0,
            hot_desk_days: 0,
            private_desk_days: 0,
            parking_days: 0,
            meeting_room_hours: 0,
            is_popular: false,
            highlighted: false
        });
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingTier(null);
        setNewFeature('');
    };

    const handleAddFeature = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFeature.trim() || !editingTier) return;
        const currentFeatures = editingTier.features || [];
        setEditingTier({ ...editingTier, features: [...currentFeatures, newFeature.trim()] });
        setNewFeature('');
    };

    const removeFeature = (index: number) => {
        if (!editingTier) return;
        const currentFeatures = editingTier.features || [];
        setEditingTier({ ...editingTier, features: currentFeatures.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTier) return;
        setFormLoading(true);
        try {
            if (editingTier.id) {
                const { error } = await supabase.from('membership_tiers').update(editingTier).eq('id', editingTier.id);
                if (error) throw error;
                toast.success('ESTRUCTURA ACTUALIZADA');
            } else {
                const { error } = await supabase.from('membership_tiers').insert([{ ...editingTier, tenant_id: tenant?.id }]);
                if (error) throw error;
                toast.success('NUEVA COMPOSICIÓN REGISTRADA');
            }

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FDE910', '#11171D', '#FFFFFF']
            });

            await fetchTiers();
            handleCloseForm();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿CONFIRMA LA ELIMINACIÓN DE ESTA ESTRUCTURA?')) return;
        try {
            const { error } = await supabase.from('membership_tiers').delete().eq('id', id);
            if (error) throw error;
            setTiers(prev => prev.filter(t => t.id !== id));
            toast.success('ESTRUCTURA ELIMINADA');
        } catch (err: any) {
            toast.error('Error al eliminar recurso analógico.');
        }
    };

    const getCycleLabel = (cycle: string) => {
        switch (cycle) {
            case 'monthly': return 'MENSUAL';
            case 'annual': return 'ANUAL';
            case 'daily': return 'DIARIO';
            default: return cycle.toUpperCase();
        }
    };
    const getPlanColor = (name: string = '') => {
        const n = name.toLowerCase();
        if (n.includes('premium')) return { bg: 'bg-[#11171D]', text: 'text-white', accent: 'text-[#FDE910]', border: 'border-white/10' };
        if (n.includes('plus')) return { bg: 'bg-[#A855F7]', text: 'text-white', accent: 'text-white/80', border: 'border-white/20' };
        if (n.includes('básico') || n.includes('basic')) return { bg: 'bg-[#4ADE80]', text: 'text-white', accent: 'text-white/80', border: 'border-white/20' };
        if (n.includes('flex')) return { bg: 'bg-[#2563EB]', text: 'text-white', accent: 'text-white/80', border: 'border-white/20' };
        return { bg: 'bg-[#FB923C]', text: 'text-white', accent: 'text-white/80', border: 'border-white/20' }; // Default Orange
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade pb-32 px-6 md:px-12">
            {/* SaaS Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-900 text-white shadow-lg flex items-center gap-2">
                            <span className="material-symbols-outlined !text-lg">card_membership</span>
                            Planes
                        </div>
                    </div>
                    
                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
                    
                    <p className="text-sm text-slate-400 font-medium hidden md:block">
                        {tiers.length} estructuras registradas
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleOpenForm()}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-slate-200 border-none cursor-pointer"
                    >
                        <span className="material-symbols-outlined !text-lg">architecture</span>
                        Nuevo Plan
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-48 flex flex-col items-center justify-center gap-12">
                    <div className="relative size-32">
                        <div className="absolute inset-0 border-[1px] border-slate-100 rounded-full scale-150"></div>
                        <div className="absolute inset-0 border-t-2 border-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined !text-4xl text-slate-200 animate-pulse">workspace_premium</span>
                        </div>
                    </div>
                    <div className="text-center space-y-4">
                        <p className="text-sm font-bold text-slate-400 animate-pulse">Sincronizando Estructuras de Membresía</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tiers.map((tier, idx) => {
                        const isPremium = tier.name.toLowerCase().includes('premium');
                        
                        // Map styles based on name or index if needed, but follow the user's specific request for Premium
                        let cardStyle = {
                            bg: 'bg-white',
                            text: 'text-slate-900',
                            accent: 'text-indigo-600',
                            badge: 'bg-slate-100 text-slate-600',
                            pattern: 'opacity-10',
                            border: 'border-slate-100'
                        };

                        if (isPremium) {
                            cardStyle = {
                                bg: 'bg-[#11171D]', // Deep Charcoal/Black
                                text: 'text-white', // Silver-like on black
                                accent: 'text-slate-300',
                                badge: 'bg-white/10 text-slate-300',
                                pattern: 'opacity-20',
                                border: 'border-white/10'
                            };
                        } else {
                            // Cycle through colors from the image: Green, Orange, Blue, Purple
                            const colors = [
                                { bg: 'bg-[#4ADE80]', text: 'text-white', accent: 'text-white/80', badge: 'bg-white/20 text-white', pattern: 'opacity-30', border: 'border-white/20' }, // Green
                                { bg: 'bg-[#FB923C]', text: 'text-white', accent: 'text-white/80', badge: 'bg-white/20 text-white', pattern: 'opacity-30', border: 'border-white/20' }, // Orange
                                { bg: 'bg-[#2563EB]', text: 'text-white', accent: 'text-white/80', badge: 'bg-white/20 text-white', pattern: 'opacity-30', border: 'border-white/20' }, // Blue
                                { bg: 'bg-[#A855F7]', text: 'text-white', accent: 'text-white/80', badge: 'bg-white/20 text-white', pattern: 'opacity-30', border: 'border-white/20' }  // Purple
                            ];
                            cardStyle = colors[idx % colors.length];
                        }

                        return (
                            <div 
                                key={tier.id} 
                                className={`group relative ${cardStyle.bg} p-6 rounded-[3rem] border ${cardStyle.border} shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 overflow-hidden flex flex-col min-h-[550px]`}
                            >
                                {/* Architectural Wave Pattern Background */}
                                <div className={`absolute inset-0 pointer-events-none ${cardStyle.pattern} transition-transform duration-[2000ms] group-hover:scale-110`}>
                                    <svg width="100%" height="100%" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
                                        <g fill="none" stroke="currentColor" strokeWidth="0.5">
                                            <path d="M-50 100 Q100 50 200 150 T450 100" />
                                            <path d="M-50 150 Q100 100 200 200 T450 150" />
                                            <path d="M-50 200 Q100 150 200 250 T450 200" />
                                            <path d="M-50 250 Q100 200 200 300 T450 250" />
                                            <path d="M-50 300 Q100 250 200 350 T450 300" />
                                            <path d="M-50 350 Q100 300 200 400 T450 350" />
                                            <path d="M-50 400 Q100 350 200 450 T450 400" />
                                        </g>
                                    </svg>
                                </div>

                                {/* Plan Identifier Badge */}
                                {tier.is_popular && (
                                    <div className="absolute top-6 right-6 px-4 py-1.5 bg-black/30 backdrop-blur-md text-white rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg z-20 border border-white/10">
                                        RECOMENDADO
                                    </div>
                                )}

                                <div className="relative z-10 flex-1 flex flex-col">
                                    <header className="flex justify-between items-start mb-8">
                                        <div className="space-y-1">
                                            <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${cardStyle.accent} opacity-60`}>Membership Tier</p>
                                            <h3 className={`text-2xl font-black ${cardStyle.text} tracking-tighter leading-tight`}>{tier.name}</h3>
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest mt-2 ${cardStyle.badge}`}>
                                                <span className={`size-1.5 rounded-full ${tier.is_active ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`}></span>
                                                {tier.is_active ? 'Operativo' : 'Pausado'}
                                            </div>
                                        </div>
                                        <div className="size-12 bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/10 text-white shadow-inner">
                                            <span className="material-symbols-outlined !text-2xl">workspace_premium</span>
                                        </div>
                                    </header>

                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-0.5">
                                            <span className={`text-base font-bold ${cardStyle.accent}`}>$</span>
                                            <span className={`text-5xl font-black ${cardStyle.text} tracking-tighter`}>{tier.price}</span>
                                            <span className={`text-[10px] font-bold ${cardStyle.accent} uppercase tracking-widest ml-1.5`}>/ {getCycleLabel(tier.billing_cycle)}</span>
                                        </div>
                                    </div>

                                    <p className={`text-sm ${cardStyle.text} font-medium leading-relaxed opacity-70 mb-8`}>
                                        "{tier.description}"
                                    </p>

                                    <div className="space-y-4 flex-1">
                                        <p className={`text-[9px] font-black ${cardStyle.text} uppercase tracking-[0.3em] opacity-40`}>Included Perks</p>
                                        <div className="h-px bg-current opacity-10 mb-4"></div>
                                        <ul className="space-y-3">
                                            {tier.features?.slice(0, 4).map((feat, i) => (
                                                <li key={i} className={`flex items-center gap-3 text-[11px] font-bold ${cardStyle.text} opacity-80`}>
                                                    <span className="material-symbols-outlined !text-base opacity-60">verified</span>
                                                    <span className="line-clamp-1">{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <footer className="pt-8 mt-6 flex items-center gap-3">
                                        <button
                                            onClick={() => handleOpenForm(tier)}
                                            className="flex-1 h-14 bg-[#11171D] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
                                        >
                                            Editar
                                            <span className="material-symbols-outlined !text-xl">edit_note</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tier.id)}
                                            className={`size-14 ${isPremium ? 'bg-white/10' : 'bg-white/20'} text-white hover:bg-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg`}
                                        >
                                            <span className="material-symbols-outlined !text-2xl">delete</span>
                                        </button>
                                    </footer>
                                </div>
                            </div>
                        );
                    })}

                    <button
                        onClick={() => handleOpenForm()}
                        className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] hover:border-indigo-500 hover:bg-indigo-50/10 transition-all flex flex-col items-center justify-center gap-8 group min-h-[550px] shadow-sm"
                    >
                        <div className="size-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:text-indigo-500 group-hover:bg-white transition-all shadow-inner">
                            <span className="material-symbols-outlined !text-4xl font-light">architecture</span>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 group-hover:text-indigo-600">Nuevo Plan</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-40">Componer oferta</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Plan Form Modal Overhaul */}
            {isFormOpen && editingTier && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className={`modal-container max-w-5xl !rounded-[3rem] shadow-2xl transition-all duration-700 ${getPlanColor(editingTier.name || '').bg}`}>
                        <header className="modal-header !p-12 !pb-8 border-none">
                            <div className="space-y-1">
                                <p className={`text-[10px] font-black uppercase tracking-[0.4em] opacity-60 ${getPlanColor(editingTier.name || '').accent}`}>Curaduría de Membresías</p>
                                <h3 className="text-5xl tracking-tighter uppercase font-black text-white leading-none">
                                    {editingTier.id ? 'Redefinir' : 'Nuevo'} <span className="opacity-30">Plan</span>
                                </h3>
                            </div>
                            <button 
                                onClick={handleCloseForm} 
                                className="size-14 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center group"
                            >
                                <span className="material-symbols-outlined !text-2xl font-light group-hover:rotate-90 transition-transform">close</span>
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="modal-body !p-12 !pt-4 space-y-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div className="space-y-10">
                                    <div className="neu-input-wrapper">
                                        <label className="neu-input-label !bg-white">Denominación del Tier</label>
                                        <input
                                            required
                                            type="text"
                                            value={editingTier.name || ''}
                                            onChange={e => setEditingTier({ ...editingTier, name: e.target.value })}
                                            className="neu-input text-2xl font-black uppercase tracking-widest !bg-white border-slate-100 shadow-sm"
                                            placeholder="EJ. PREMIUM WORKSPACE"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="neu-input-wrapper">
                                            <label className="neu-input-label !bg-white">Costo Base (USD)</label>
                                            <input
                                                required
                                                type="number"
                                                value={editingTier.price || 0}
                                                onChange={e => setEditingTier({ ...editingTier, price: +e.target.value })}
                                                className="neu-input !h-16 text-xl font-black !bg-white border-slate-100 shadow-sm"
                                            />
                                        </div>
                                        <PremiumSelect
                                            label="Ciclo Facturación"
                                            icon="sync"
                                            value={editingTier.billing_cycle || 'monthly'}
                                            placeholder="SELECCIONAR..."
                                            options={[
                                                { value: 'monthly', label: 'MENSUAL' },
                                                { value: 'annual', label: 'ANUAL' },
                                                { value: 'daily', label: 'DIARIO' }
                                            ]}
                                            onChange={val => setEditingTier({ ...editingTier, billing_cycle: val as any })}
                                        />
                                    </div>

                                    <div className="neu-input-wrapper">
                                        <label className="neu-input-label !bg-white">Narrativa de Valor</label>
                                        <textarea
                                            rows={4}
                                            value={editingTier.description || ''}
                                            onChange={e => setEditingTier({ ...editingTier, description: e.target.value })}
                                            className="neu-input !h-auto py-6 uppercase tracking-widest text-[10px] font-bold !bg-white border-slate-100 shadow-sm"
                                            placeholder="DEFINE LA ESENCIA DE ESTA SUSCRIPCIÓN..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 px-2">Atributos Operativos</p>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="neu-input-wrapper">
                                                <label className="neu-input-label !bg-white">Créditos / Mes</label>
                                                <input type="number" value={editingTier.monthly_credits} onChange={e => setEditingTier({...editingTier, monthly_credits: +e.target.value})} className="neu-input !h-16 text-center font-black !bg-white border-slate-100 shadow-sm" />
                                            </div>
                                            <div className="neu-input-wrapper">
                                                <label className="neu-input-label !bg-white">Sala de Juntas (Hrs)</label>
                                                <input type="number" value={editingTier.meeting_room_hours} onChange={e => setEditingTier({...editingTier, meeting_room_hours: +e.target.value})} className="neu-input !h-16 text-center font-black !bg-white border-slate-100 shadow-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Features / Ventajas</p>
                                            <button type="button" onClick={handleAddFeature} disabled={!newFeature.trim()} className="size-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all disabled:opacity-30">
                                                <span className="material-symbols-outlined !text-xl">add</span>
                                            </button>
                                        </div>
                                        <div className="neu-input-wrapper">
                                            <input
                                                value={newFeature}
                                                onChange={e => setNewFeature(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddFeature(e)}
                                                className="neu-input !h-14 uppercase tracking-widest text-[10px] font-bold !bg-white border-slate-100 shadow-sm"
                                                placeholder="ACCESO 24/7, CAFÉ ILIMITADO..."
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {editingTier.features?.map((feat, i) => (
                                                <div key={i} className="bg-white/10 border border-white/10 pl-4 pr-1 py-1 rounded-full flex items-center gap-3 group/feat hover:bg-white/20 transition-all">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white">{feat}</span>
                                                    <button type="button" onClick={() => removeFeature(i)} className="size-6 bg-rose-500/20 text-rose-200 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                                        <span className="material-symbols-outlined !text-[10px]">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10 pt-4 px-2">
                                        <label className="flex items-center gap-4 cursor-pointer group">
                                            <div className="relative w-12 h-6 bg-white/10 rounded-full transition-all">
                                                <input type="checkbox" checked={editingTier.is_active} onChange={e => setEditingTier({ ...editingTier, is_active: e.target.checked })} className="peer sr-only" />
                                                <div className="absolute left-1 top-1 size-4 bg-white/40 rounded-full transition-all peer-checked:translate-x-6 peer-checked:bg-white shadow-sm"></div>
                                            </div>
                                            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-white">Activo</span>
                                        </label>

                                        <label className="flex items-center gap-4 cursor-pointer group">
                                            <div className="relative w-12 h-6 bg-white/10 rounded-full transition-all">
                                                <input type="checkbox" checked={editingTier.is_popular} onChange={e => setEditingTier({ ...editingTier, is_popular: e.target.checked })} className="peer sr-only" />
                                                <div className="absolute left-1 top-1 size-4 bg-white/40 rounded-full transition-all peer-checked:translate-x-6 peer-checked:bg-white shadow-sm"></div>
                                            </div>
                                            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-white">Popular</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <footer className="modal-footer !p-0 !bg-transparent flex items-center gap-4 pt-4 border-none">
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    className="flex-1 h-16 bg-white/5 text-white/40 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white/10 hover:text-white transition-all border-none cursor-pointer"
                                >
                                    DESCARTAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-[2] h-16 btn-brand-yellow rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-xl shadow-yellow-500/10 group/btn border-none cursor-pointer"
                                >
                                    {formLoading ? (
                                        <div className="size-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>{editingTier.id ? 'GUARDAR ESTRUCTURA' : 'COMPONER PLAN'}</span>
                                            <span className="material-symbols-outlined !text-2xl group-hover:rotate-12 transition-transform">architecture</span>
                                        </>
                                    )}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePlans;
