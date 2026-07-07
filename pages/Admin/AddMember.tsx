import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import PremiumSelect from '../../components/ui/PremiumSelect';


const AddMember: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        role: 'member',
        registration_date: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([
                    {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        company: formData.company,
                        role: formData.role,
                        status: 'active',
                        credits: 0,
                        registration_date: formData.registration_date,
                        avatar_url: `https://picsum.photos/seed/${formData.name.replace(/\s/g, '')}/400`
                    }
                ]);

            if (insertError) throw insertError;

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FDE910', '#11171D', '#686000']
            });

            toast.success('IDENTIDAD REGISTRADA');
            
            setTimeout(() => {
                navigate('/admin/members');
            }, 1500);

        } catch (err: any) {
            toast.error('Error al persistir la identidad.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade pb-32 px-6 md:px-12">
            {/* Editorial Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 pb-12 border-b-2 border-black/5">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="w-12 h-[1px] bg-[var(--primary)]"></span>
                        <p className="label-md uppercase tracking-[0.3em]">Identity Protocol / New Member Enrollment</p>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] text-[var(--on-surface)]">
                            REGISTRO DE <span className="opacity-30">MIEMBROS</span>
                        </h1>
                    </div>
                    <p className="text-sm text-[var(--on-surface-subtle)] font-medium max-w-md uppercase tracking-wider leading-relaxed">
                        Generación de identidades digitales y validación de perfiles en el ecosistema BURÓ.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <button 
                        onClick={() => navigate('/admin/members')} 
                        className="h-16 px-8 rounded-2xl bg-[var(--surface)] shadow-[var(--neu-flat-sm)] hover:shadow-[var(--neu-pressed-sm)] text-[10px] font-black uppercase tracking-[0.3em] text-[var(--on-surface-subtle)] transition-all flex items-center gap-4 group"
                    >
                        <span className="material-symbols-outlined !text-xl group-hover:-translate-x-2 transition-transform">west</span>
                        Volver al Directorio
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                <article className="card-workspace !p-0 overflow-hidden animate-slide">
                    <form onSubmit={handleSubmit} className="p-12 md:p-20 space-y-20 relative">
                        {/* Section: Professional Identity */}
                        <section className="space-y-16 relative z-10">
                            <header className="flex items-center gap-6">
                                <div className="size-12 bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center rounded-2xl text-[11px] font-black shadow-2xl">01</div>
                                <div className="space-y-1">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--on-surface)]">Perfil Antropológico</h3>
                                    <p className="text-[8px] font-bold text-[var(--on-surface-subtle)] uppercase tracking-widest opacity-40">Identidad Digital Única</p>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="md:col-span-2 group relative">
                                    <label className="absolute -top-3 left-6 px-2 bg-[var(--surface)] text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)] z-10">Nombre Completo</label>
                                    <input 
                                        required 
                                        name="name"
                                        type="text" 
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="EJ. GABRIEL CASTILLO" 
                                        className="w-full h-20 bg-[var(--surface)] border-none shadow-[var(--neu-pressed-sm)] rounded-2xl px-8 text-xl font-black uppercase tracking-tighter focus:ring-0 transition-all text-[var(--on-surface)]" 
                                    />
                                </div>

                                <div className="group relative">
                                    <label className="absolute -top-3 left-6 px-2 bg-[var(--surface)] text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)] z-10">Correo Electrónico</label>
                                    <input 
                                        required 
                                        name="email"
                                        type="email" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="SOCIO@BURO.COM" 
                                        className="w-full h-20 bg-[var(--surface)] border-none shadow-[var(--neu-pressed-sm)] rounded-2xl px-8 text-sm font-black uppercase tracking-widest focus:ring-0 transition-all text-[var(--on-surface)]" 
                                    />
                                </div>
                                <div className="group relative">
                                    <label className="absolute -top-3 left-6 px-2 bg-[var(--surface)] text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)] z-10">Conectividad Móvil</label>
                                    <input 
                                        name="phone"
                                        type="tel" 
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+507 0000-0000" 
                                        className="w-full h-20 bg-[var(--surface)] border-none shadow-[var(--neu-pressed-sm)] rounded-2xl px-8 text-sm font-black focus:ring-0 transition-all text-[var(--on-surface)]" 
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="h-px bg-black/5 relative">
                            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 size-2 bg-[var(--primary)] rotate-45 shadow-[0_0_10px_var(--primary)]"></div>
                        </div>

                        {/* Section: Corporate Context */}
                        <section className="space-y-16 relative z-10">
                            <header className="flex items-center gap-6">
                                <div className="size-12 bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center rounded-2xl text-[11px] font-black shadow-2xl">02</div>
                                <div className="space-y-1">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--on-surface)]">Contexto Corporativo</h3>
                                    <p className="text-[8px] font-bold text-[var(--on-surface-subtle)] uppercase tracking-widest opacity-40">Vinculación Institucional</p>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="md:col-span-2 group relative">
                                    <label className="absolute -top-3 left-6 px-2 bg-[var(--surface)] text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)] z-10">Firma / Proyecto</label>
                                    <input 
                                        name="company"
                                        type="text" 
                                        value={formData.company}
                                        onChange={handleChange}
                                        placeholder="ARCHITECTURAL SOLUTIONS LTD." 
                                        className="w-full h-20 bg-[var(--surface)] border-none shadow-[var(--neu-pressed-sm)] rounded-2xl px-8 text-lg font-black uppercase tracking-tight focus:ring-0 transition-all text-[var(--on-surface)]" 
                                    />
                                </div>

                                <PremiumSelect 
                                    label="Privilegios de Acceso"
                                    icon="key"
                                    value={formData.role}
                                    placeholder="SELECCIONAR..."
                                    options={[
                                        { value: 'member', label: 'SOCIO ESTÁNDAR' },
                                        { value: 'admin', label: 'CURADOR DE SISTEMA' }
                                    ]}
                                    onChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
                                />
                                <div className="group relative">
                                    <label className="absolute -top-3 left-6 px-2 bg-[var(--surface)] text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)] z-10">Fecha de Inserción</label>
                                    <input 
                                        name="registration_date"
                                        type="date" 
                                        value={formData.registration_date}
                                        onChange={handleChange}
                                        className="w-full h-20 bg-[var(--surface)] border-none shadow-[var(--neu-pressed-sm)] rounded-2xl px-8 text-[11px] font-black uppercase tracking-widest focus:ring-0 transition-all text-[var(--on-surface)]" 
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Actions Architecture */}
                        <footer className="pt-12 flex flex-col md:flex-row items-center justify-between gap-12 border-t border-black/5 relative z-10">
                            <div className="flex items-center gap-6 opacity-30 group/verify">
                                <span className="material-symbols-outlined !text-5xl font-thin text-[var(--on-surface)] group-hover/verify:text-[var(--primary)] transition-colors">verified_user</span>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] max-w-[200px] leading-relaxed">
                                    Generación de identidad digital criptográfica única y persistente.
                                </p>
                            </div>
                            <button 
                                disabled={loading} 
                                type="submit" 
                                className="w-full md:w-auto px-16 h-20 btn-brand-yellow rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-6 disabled:opacity-50 group/btn"
                            >
                                {loading ? (
                                    <div className="size-6 border-2 border-[var(--secondary)] border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Consolidar Registro
                                        <span className="material-symbols-outlined !text-2xl font-light group-hover:translate-x-3 transition-transform">east</span>
                                    </>
                                )}
                            </button>
                        </footer>

                        <div className="absolute inset-0 bg-[radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.02] pointer-events-none"></div>
                    </form>
                </article>
            </div>
        </div>
    );
};

export default AddMember;
