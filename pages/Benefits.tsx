import React, { useState, useEffect } from 'react';
import { Benefit } from '../types';
import { useTenant } from '../contexts/TenantContext';
import { supabase } from '../supabase';

const Benefits: React.FC = () => {
  const { tenant } = useTenant();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Todos');

  const categories = ['Todos', 'Gastronomía', 'Bienestar', 'Servicios', 'Cultura', 'Viajes'];

  useEffect(() => {
    fetchBenefits();
  }, []);

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('benefits')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBenefits(data || []);
    } catch (err) {
      console.error('Error fetching benefits:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBenefits = benefits.filter(b => activeTab === 'Todos' || b.category === activeTab);

  return (
    <div className="space-y-12 animate-fade pb-20">
      {/* Minimalist Header */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-10 border-b border-[var(--outline-variant)]/10">
        <div className="flex flex-col">
            <div className="flex items-center gap-5 mb-4">
                <div className="size-14 bg-[#6b6d00] text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined !text-3xl">loyalty</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">Beneficios</h1>
            </div>
            <p className="text-sm font-medium opacity-60 font-jakarta leading-relaxed max-w-2xl">
                Alianzas estratégicas y privilegios exclusivos curados para la comunidad del Buró.
            </p>
        </div>

        <nav className="flex bg-[var(--surface-container-low)] p-1.5 rounded-xl items-center border border-[var(--outline-variant)]/10 shadow-sm overflow-x-auto no-scrollbar max-w-full">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 font-jakarta whitespace-nowrap ${activeTab === cat ? 'bg-[var(--on-primary-fixed)] text-white shadow-xl' : 'text-[var(--on-surface)]/30 hover:text-[var(--on-surface)]'}`}
                >
                    {cat}
                </button>
            ))}
        </nav>
      </header>

      <main className="mt-8">
        {loading ? (
             <div className="py-40 text-center space-y-6">
                <div className="size-12 border-4 border-[var(--outline-variant)]/20 border-t-[var(--primary-container)] rounded-full animate-spin mx-auto"></div>
                <p className="label-md opacity-20">Syncing Alliance Protocols</p>
             </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
             {filteredBenefits.map((benefit, i) => (
               <article 
                 key={benefit.id} 
                 className="group space-y-10 animate-slide"
                 style={{ animationDelay: `${i * 100}ms` }}
               >
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-[var(--surface-container)] shadow-sm">
                     {benefit.image ? (
                       <img 
                        src={benefit.image} 
                        alt={benefit.title} 
                        className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105" 
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-[var(--on-surface)]/10">
                          <span className="material-symbols-outlined text-[120px]">verified</span>
                       </div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-[var(--on-surface)]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-12">
                        <button className="btn-primary w-full">
                           Reclamar Beneficio
                        </button>
                     </div>
                     <div className="absolute top-8 right-8 px-4 py-2 bg-white/20 backdrop-blur-xl rounded-lg border border-white/20">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest font-jakarta">{benefit.category}</span>
                     </div>
                  </div>

                  <div className="space-y-4 px-4">
                     <div className="flex items-center gap-4">
                        <span className="h-[2px] w-8 bg-[var(--primary-container)]"></span>
                        <h3 className="headline-md tracking-tight leading-tight group-hover:text-[var(--primary-container)] transition-colors duration-500 uppercase">{benefit.title}</h3>
                     </div>
                     <p className="text-lg opacity-40 font-jakarta font-medium leading-relaxed">
                        {benefit.description}
                     </p>
                  </div>
               </article>
             ))}

             {filteredBenefits.length === 0 && (
               <div className="col-span-full py-60 border border-dashed border-[var(--outline-variant)]/30 rounded-3xl text-center space-y-8">
                  <span className="material-symbols-outlined text-[80px] opacity-10">inventory_2</span>
                  <div className="space-y-4">
                    <h3 className="display-lg opacity-10 uppercase">Registry Empty</h3>
                    <p className="label-md opacity-20">No strategic alliances found in this sector</p>
                  </div>
               </div>
             )}
          </div>
        )}
      </main>

      {/* Partnership CTA */}
      <section className="mt-60 px-6 md:px-20">
        <div className="bg-[var(--on-primary-fixed)] rounded-3xl p-12 md:p-32 relative overflow-hidden group shadow-2xl">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-[var(--primary-container)]/10 blur-[150px] rounded-full translate-x-1/3 -translate-y-1/2"></div>
           
           <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10">
                 <h2 className="text-6xl md:text-8xl font-black text-white font-manrope tracking-tighter leading-[0.85] uppercase">
                    ESCALA TU <br />
                    <span className="text-[var(--primary-container)]">INFLUENCIA</span>
                 </h2>
                 <p className="max-w-md text-xl text-white/40 font-jakarta font-medium leading-relaxed">
                    Únete a nuestra red exclusiva de aliados estratégicos y posiciona tu marca frente a los líderes de la industria en Panamá.
                 </p>
              </div>

              <div className="space-y-12">
                 <div className="grid grid-cols-2 gap-8">
                    {[
                      { icon: 'hub', label: 'Networking Elite' },
                      { icon: 'visibility', label: 'Alta Visibilidad' },
                      { icon: 'diversity_3', label: 'Comunidad B2B' },
                      { icon: 'bolt', label: 'Acceso Directo' }
                    ].map((perk, i) => (
                      <div key={i} className="flex flex-col gap-4 p-8 bg-white/5 rounded-3xl border border-white/5 group/perk hover:border-[var(--primary-container)]/20 transition-all">
                         <span className="material-symbols-outlined text-[var(--primary-container)] !text-4xl">{perk.icon}</span>
                         <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest font-jakarta">{perk.label}</span>
                      </div>
                    ))}
                 </div>
                 
                 <button className="btn-primary w-full py-8 text-[12px] font-black uppercase tracking-[0.5em] font-manrope flex items-center justify-center gap-6 group/btn">
                    <span>Solicitar Partnership</span>
                    <span className="material-symbols-outlined !text-xl group-hover/btn:translate-x-4 transition-transform duration-700">arrow_forward</span>
                 </button>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Benefits;

