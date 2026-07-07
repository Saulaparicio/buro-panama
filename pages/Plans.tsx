import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { MembershipTier } from '../types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

const Plans: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [currentMembership, setCurrentMembership] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const [tiersRes, membershipRes] = await Promise.all([
        supabase.from('membership_tiers').select('*').order('price', { ascending: true }),
        user ? supabase.from('memberships').select('*, tier:membership_tiers(*)').eq('profile_id', user.id).eq('status', 'active').maybeSingle() : Promise.resolve({ data: null })
      ]);

      if (tiersRes.error) throw tiersRes.error;
      
      setTiers(tiersRes.data || []);
      setCurrentMembership(membershipRes?.data);
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setSelectedTier(tierId);
      // Logic for subscription simulation or integration would go here
      // For now, we simulate a successful upgrade
      
      const { error } = await supabase
        .from('memberships')
        .upsert({
          profile_id: user.id,
          tier_id: tierId,
          status: 'active',
          start_date: new Date().toISOString(),
          next_billing: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FDE910', '#11171D', '#FFFFFF', '#F1F0E8']
      });

      toast.success('Membresía activada con éxito');
      fetchTiers();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSelectedTier(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="size-16 border-2 border-[var(--outline-variant)] border-t-[var(--on-primary-fixed)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade pb-20">
      {/* Minimalist Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-[var(--outline-variant)]/10">
        <div className="flex flex-col">
            <div className="flex items-center gap-5 mb-4">
                <div className="size-14 bg-[#6b6d00] text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined !text-3xl">workspace_premium</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">Planes & Membresías</h1>
            </div>
            <p className="text-sm font-medium opacity-60 leading-relaxed max-w-2xl">
                Privilegios de membresía y accesos curatoriales diseñados para potenciar tu experiencia en el Buró.
            </p>
        </div>
      </header>

      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier, idx) => {
            const name = tier.name.toLowerCase();
            const isCurrent = currentMembership?.tier_id === tier.id;
            const isPremium = name.includes('premium') || name.includes('elite');

            // Style mapping similar to Admin view for consistency
            let cardStyle = {
                bg: 'bg-white',
                text: 'text-slate-900',
                accent: 'text-indigo-600',
                badge: 'bg-slate-100 text-slate-600',
                pattern: 'opacity-10',
                border: 'border-slate-100',
                btn: 'bg-slate-900 text-white hover:bg-black'
            };

            if (isPremium) {
                cardStyle = {
                    bg: 'bg-[#11171D]', // Deep Charcoal/Black
                    text: 'text-white', // Silver-like
                    accent: 'text-slate-300',
                    badge: 'bg-white/10 text-slate-300',
                    pattern: 'opacity-20',
                    border: 'border-white/10',
                    btn: 'bg-white text-slate-900 hover:bg-slate-200'
                };
            } else {
                const colors = [
                    { bg: 'bg-[#4ADE80]', text: 'text-white', accent: 'text-white/80', badge: 'bg-white/20 text-white', pattern: 'opacity-30', border: 'border-white/20', btn: 'bg-white/20 text-white hover:bg-white/30' }, // Green
                    { bg: 'bg-[#FB923C]', text: 'text-white', accent: 'text-white/80', badge: 'bg-white/20 text-white', pattern: 'opacity-30', border: 'border-white/20', btn: 'bg-white/20 text-white hover:bg-white/30' }, // Orange
                    { bg: 'bg-[#2563EB]', text: 'text-white', accent: 'text-white/80', badge: 'bg-white/20 text-white', pattern: 'opacity-30', border: 'border-white/20', btn: 'bg-white/20 text-white hover:bg-white/30' }, // Blue
                    { bg: 'bg-[#A855F7]', text: 'text-white', accent: 'text-white/80', badge: 'bg-white/20 text-white', pattern: 'opacity-30', border: 'border-white/20', btn: 'bg-white/20 text-white hover:bg-white/30' }  // Purple
                ];
                cardStyle = colors[idx % colors.length];
            }
            
            return (
              <div 
                key={tier.id}
                className={`group relative ${cardStyle.bg} p-6 rounded-[3rem] border ${cardStyle.border} shadow-xl hover:shadow-2xl hover:-translate-y-4 transition-all duration-700 overflow-hidden flex flex-col min-h-[600px]`}
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

                <div className="relative z-10 flex-1 flex flex-col">
                    <header className="flex justify-between items-start mb-10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className={`label-md text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${cardStyle.badge}`}>
                                    Tier 0{(idx + 1)}
                                </span>
                                {isCurrent && (
                                    <span className="material-symbols-outlined !text-lg text-emerald-400 animate-pulse">verified</span>
                                )}
                            </div>
                            <h3 className={`text-3xl lg:text-4xl font-black tracking-tighter leading-tight ${cardStyle.text}`}>
                                {tier.name}
                            </h3>
                        </div>
                        <div className="size-14 bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/10 text-white shadow-inner">
                            <span className="material-symbols-outlined !text-2xl">workspace_premium</span>
                        </div>
                    </header>

                    <div className="mb-10">
                        <div className="flex items-baseline gap-0.5">
                            <span className={`text-xl font-bold ${cardStyle.accent}`}>$</span>
                            <span className={`text-6xl font-black ${cardStyle.text} tracking-tighter`}>{tier.price}</span>
                            <span className={`text-[10px] font-bold ${cardStyle.accent} uppercase tracking-widest ml-2`}>/ mes</span>
                        </div>
                    </div>

                    <div className="space-y-8 flex-1">
                        <div className={`h-px ${isPremium ? 'bg-white/10' : 'bg-black/10'}`}></div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined !text-xl opacity-40">token</span>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${cardStyle.text}`}>{tier.monthly_credits} Créditos Mensuales</p>
                            </div>
                            
                            <ul className="space-y-4">
                                {(tier.features || ['Acceso Global Workspace', 'Wifi de Alta Fidelidad', 'Cabinas Telefónicas Privativas', 'Gestión de Correspondencia']).slice(0, 5).map((ben, i) => (
                                    <li key={i} className={`flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-80 ${cardStyle.text}`}>
                                        <span className="size-1.5 rounded-full bg-current opacity-40"></span>
                                        <span className="line-clamp-1">{ben}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <button
                        onClick={() => handleSubscribe(tier.id)}
                        disabled={isCurrent || selectedTier === tier.id}
                        className={`w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 active:scale-95 shadow-2xl relative z-10 mt-12 backdrop-blur-sm ${
                            isCurrent 
                            ? 'bg-transparent border-2 border-current opacity-40 cursor-default' 
                            : cardStyle.btn
                        }`}
                    >
                        {isCurrent ? 'Membresía Actual' : selectedTier === tier.id ? 'Procesando...' : 'Seleccionar'}
                    </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Benefits Footer Section */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-t border-[var(--outline-variant)]/20 pt-20">
          {[
            { icon: 'architecture', title: 'Diseño Premial', desc: 'Espacios curados por arquitectos de renombre' },
            { icon: 'groups_3', title: 'Red Global', desc: 'Conecte con líderes de industria en Panamá' },
            { icon: 'verified_user', title: 'Seguridad 24/7', desc: 'Protocolos de acceso biométrico y vigilancia' },
            { icon: 'speed', title: 'Velocidad', desc: 'Infraestructura digital de latencia cero' }
          ].map((item, idx) => (
            <div key={idx} className="space-y-6 text-center md:text-left animate-fade" style={{ animationDelay: `${idx * 100}ms` }}>
              <span className="material-symbols-outlined !text-4xl text-[var(--on-primary-fixed)] opacity-20">{item.icon}</span>
              <div className="space-y-2">
                <h4 className="title-md font-display uppercase tracking-tight text-[var(--on-primary-fixed)]">{item.title}</h4>
                <p className="label-md text-[10px] opacity-40 uppercase tracking-widest font-light">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Plans;
