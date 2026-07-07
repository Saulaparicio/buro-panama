import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Benefit } from '../../types';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import PremiumSelect from '../../components/ui/PremiumSelect';
import { useTenant } from '../../contexts/TenantContext';


const ManageBenefits: React.FC = () => {
    const { tenant } = useTenant();
    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBenefit, setEditingBenefit] = useState<Partial<Benefit> | null>(null);
    const [benefitImage, setBenefitImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (tenant?.id) {
            fetchBenefits();
        }
    }, [tenant?.id]);

    const fetchBenefits = async () => {
        if (!tenant?.id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('benefits')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBenefits(data || []);
        } catch (err: any) {
            console.error('Error fetching benefits:', err);
            toast.error('Error al cargar alianzas estratégicas del tenant.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBenefitImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setUploading(true);
            let imageUrl = editingBenefit?.image || '';

            if (benefitImage) {
                const fileExt = benefitImage.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `benefit-${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('benefits')
                    .upload(filePath, benefitImage);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('benefits').getPublicUrl(filePath);
                imageUrl = data.publicUrl;
            }

            const benefitData = {
                title: editingBenefit?.title,
                category: editingBenefit?.category,
                description: editingBenefit?.description,
                image: imageUrl || `https://images.unsplash.com/photo-1540317580324-e51045a4263f?auto=format&fit=crop&q=80&w=800`,
                is_active: editingBenefit?.is_active ?? true
            };

            if (editingBenefit?.id) {
                const { error } = await supabase.from('benefits').update(benefitData).eq('id', editingBenefit.id);
                if (error) throw error;
                toast.success('ALIANZA ACTUALIZADA');
            } else {
                const { error } = await supabase.from('benefits').insert([{ ...benefitData, tenant_id: tenant?.id }]);
                if (error) throw error;
                toast.success('ALIANZA REGISTRADA');
            }

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FDE910', '#11171D', '#686000']
            });

            setIsModalOpen(false);
            setBenefitImage(null);
            setImagePreview(null);
            fetchBenefits();
        } catch (err: any) {
            toast.error(err.message || 'ERROR EN LA OPERACIÓN');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿CONFIRMA LA ELIMINACIÓN DE ESTE ACTIVO?')) return;
        try {
            const { error } = await supabase.from('benefits').delete().eq('id', id);
            if (error) throw error;
            toast.success('ACTIVO ELIMINADO');
            fetchBenefits();
        } catch (err: any) {
            toast.error('ERROR EN LA ELIMINACIÓN');
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade pb-32 px-6 md:px-12">
            {/* SaaS Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-900 text-white shadow-lg flex items-center gap-2">
                            <span className="material-symbols-outlined !text-lg">loyalty</span>
                            Beneficios
                        </div>
                    </div>
                    
                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

                    <p className="text-sm text-slate-400 font-medium hidden md:block">
                        {benefits.length} alianzas activas
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { setEditingBenefit({}); setIsModalOpen(true); }}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-slate-200 border-none cursor-pointer"
                    >
                        <span className="material-symbols-outlined !text-lg">add</span>
                        Nueva Alianza
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-48 flex flex-col items-center justify-center gap-12">
                    <div className="relative size-32">
                        <div className="absolute inset-0 border-[1px] border-slate-100 rounded-full scale-150"></div>
                        <div className="absolute inset-0 border-t-2 border-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined !text-4xl text-slate-200 animate-pulse">loyalty</span>
                        </div>
                    </div>
                    <div className="text-center space-y-4">
                        <p className="text-sm font-bold text-slate-400 animate-pulse">Sincronizando Catálogo de Privilegios</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((benefit, i) => (
                        <div 
                            key={benefit.id} 
                            className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col"
                        >
                            <div className="aspect-[16/10] overflow-hidden bg-slate-50 relative">
                                <img 
                                    src={benefit.image || 'https://images.unsplash.com/photo-1540317580324-e51045a4263f?auto=format&fit=crop&q=80&w=800'} 
                                    alt="" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" 
                                />
                                <div className="absolute top-4 left-4 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-sm">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{benefit.category}</span>
                                </div>
                            </div>

                            <div className="p-8 space-y-6 flex flex-col flex-1">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{benefit.title}</h3>
                                        <div className={`shrink-0 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${benefit.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {benefit.is_active ? 'Activo' : 'Pausa'}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                                        "{benefit.description}"
                                    </p>
                                </div>

                                <div className="pt-6 mt-auto border-t border-slate-50 flex items-center justify-between">
                                    <button
                                        onClick={() => { setEditingBenefit(benefit); setIsModalOpen(true); }}
                                        className="h-11 px-6 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined !text-lg">edit_note</span>
                                        Gestionar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(benefit.id)}
                                        className="size-11 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined !text-xl">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button
                        onClick={() => { setEditingBenefit({}); setIsModalOpen(true); }}
                        className="rounded-[2rem] border-2 border-dashed border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-6 group min-h-[400px]"
                    >
                        <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-white transition-all">
                            <span className="material-symbols-outlined !text-3xl">loyalty</span>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-900">Nueva Alianza</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Socio Estratégico</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Benefit Form Modal Overhaul */}
            {isModalOpen && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="modal-container max-w-5xl !rounded-[3rem] shadow-2xl">
                        <header className="modal-header !p-12 !pb-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--primary)] opacity-60">Curaduría de Alianzas</p>
                                <h3 className="text-5xl tracking-tighter uppercase font-black text-[var(--on-surface)] leading-none">
                                    {editingBenefit?.id ? 'Redefinir' : 'Nueva'} <span className="opacity-30">Alianza</span>
                                </h3>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="size-14 rounded-2xl bg-[var(--surface)] shadow-[var(--neu-flat-sm)] text-[var(--on-surface)] hover:shadow-[var(--neu-pressed-sm)] transition-all flex items-center justify-center group"
                            >
                                <span className="material-symbols-outlined !text-2xl font-light group-hover:rotate-90 transition-transform">close</span>
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="modal-body !p-12 !pt-4 space-y-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div className="space-y-10">
                                    <div className="neu-input-wrapper">
                                        <label className="neu-input-label !bg-white">Identidad del Partner</label>
                                        <input
                                            required
                                            type="text"
                                            value={editingBenefit?.title || ''}
                                            onChange={e => setEditingBenefit({ ...editingBenefit, title: e.target.value })}
                                            className="neu-input text-2xl font-black uppercase tracking-widest !bg-white border-slate-100 shadow-sm"
                                            placeholder="NOMBRE DE LA FIRMA / ALIADO"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <PremiumSelect 
                                            label="Categoría del Privilegio"
                                            icon="category"
                                            value={editingBenefit?.category || ''}
                                            placeholder="SELECCIONAR..."
                                            options={[
                                                { value: 'Gastronomía', label: 'GASTRONOMÍA' },
                                                { value: 'Bienestar', label: 'BIENESTAR' },
                                                { value: 'Servicios', label: 'SERVICIOS' },
                                                { value: 'Cultura', label: 'CULTURA' },
                                                { value: 'Viajes', label: 'VIAJES' }
                                            ]}
                                            onChange={(val) => setEditingBenefit({ ...editingBenefit, category: val })}
                                        />
                                        <div className="neu-input-wrapper">
                                            <label className="neu-input-label !bg-white">Estado Operativo</label>
                                            <div className="w-full h-16 bg-slate-50 rounded-2xl px-6 flex items-center justify-between border border-slate-100">
                                                <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">{editingBenefit?.is_active ?? true ? 'Habilitado' : 'Suspendido'}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={editingBenefit?.is_active ?? true} onChange={e => setEditingBenefit({ ...editingBenefit, is_active: e.target.checked })} />
                                                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="neu-input-wrapper">
                                        <label className="neu-input-label !bg-white">Narrativa del Privilegio</label>
                                        <textarea
                                            rows={5}
                                            className="neu-input !h-auto py-6 uppercase tracking-widest text-[10px] font-bold !bg-white border-slate-100 shadow-sm"
                                            placeholder="DEFINE EL BENEFICIO EXCLUSIVO..."
                                            value={editingBenefit?.description || ''}
                                            onChange={e => setEditingBenefit({ ...editingBenefit, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 px-2">Visual Asset</p>
                                        
                                        <div
                                            onClick={() => document.getElementById('benefit-file')?.click()}
                                            className="group relative aspect-video border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-[var(--primary)]/40 hover:bg-white transition-all bg-slate-50"
                                        >
                                            <input id="benefit-file" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                            <div className="size-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:text-[var(--primary)] transition-all">
                                                <span className="material-symbols-outlined !text-3xl font-light">cloud_upload</span>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Subir Activo</p>
                                        </div>

                                        <div className="aspect-video rounded-[3rem] overflow-hidden shadow-sm border border-slate-100 bg-slate-50">
                                            {(imagePreview || editingBenefit?.image) ? (
                                                <img src={imagePreview || editingBenefit?.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt="" />
                                            ) : (
                                                <div className="h-full flex items-center justify-center opacity-10">
                                                    <span className="material-symbols-outlined !text-7xl font-thin">image</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <footer className="modal-footer !p-0 !bg-transparent flex items-center gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-slate-100 hover:text-slate-600 transition-all border-none cursor-pointer"
                                >
                                    DESCARTAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !editingBenefit?.title}
                                    className="flex-[2] h-16 btn-brand-yellow rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-xl shadow-yellow-500/10 group/btn border-none cursor-pointer"
                                >
                                    {uploading ? (
                                        <div className="size-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>{editingBenefit?.id ? 'ACTUALIZAR ALIANZA' : 'REGISTRAR SOCIO'}</span>
                                            <span className="material-symbols-outlined !text-2xl group-hover:translate-x-2 transition-transform">verified</span>
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

export default ManageBenefits;
