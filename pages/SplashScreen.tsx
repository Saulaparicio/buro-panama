import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';

const SplashScreen: React.FC = () => {
  const [isEntering, setIsEntering] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from || '/';
  const isAdmin = destination.startsWith('/admin');

  const handleEnter = () => {
    setIsEntering(true);
    
    setTimeout(() => {
      navigate(destination);
    }, 1200); // 1.2 seconds for the animation to play
  };

  return (
    <div className={`fixed inset-0 z-[200] ${isAdmin ? 'bg-slate-900 text-white' : 'bg-[var(--surface)] text-[var(--on-surface)]'} overflow-hidden selection:bg-[var(--primary-container)] selection:text-[var(--on-primary-container)] transition-opacity duration-1000 ease-in-out`}>
      {/* Background Layer with Professional Overlay */}
      <div className="fixed inset-0 z-0 h-full w-full">
        {/* Main Background Image */}
        <div 
          className={`h-full w-full bg-cover bg-center transition-transform duration-[10s] ease-linear hover:scale-105 ${isAdmin ? 'grayscale opacity-70' : ''}`} 
          style={{ backgroundImage: isAdmin ? "url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600')" : "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFWEG_SeSMhWfPvMqLeFBvhJYSO-uatOlEdFRvibp8LtNeUC4rvFOow1K8DADc__yXZZhxlCPox3kP5Sj-Qqyphbv9bYtAEZaxQdAozbiEJT_nOh48uJPx62a-Rc0KS_ZAz3Km1VQuUayveh2JkmfbmNMT36SpiYPVSOz83inGDIqBVv5njeArU4ucccOc0zBDB5YvLRgOW61rd3ip_OZaF-IeZVwfBlTrSXfVTMrUZfMhoO3H-77RqcrRnwYhpOhB3AcNb7AKAb0')" }}
        ></div>
        {/* Brand Tint Overlay */}
        <div className={`absolute inset-0 ${isAdmin ? 'bg-indigo-950/60' : 'bg-[var(--primary)]/20'} backdrop-blur-[2px]`}></div>
        {/* Gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
      </div>

      {/* Main Content Canvas */}
      <main className="relative z-10 flex flex-col items-center justify-between min-h-screen px-4 md:px-10 py-12">
        {/* Top Section: Brand Identity */}
        <div className="w-full flex justify-center animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${isAdmin ? 'bg-white text-black' : 'bg-[var(--primary-container)] text-[var(--on-primary-container)]'} rounded-lg flex items-center justify-center shadow-lg font-black tracking-tighter text-xl`}>
              {isAdmin ? 'B' : <Icon name="rocket_launch" style={{ fontVariationSettings: "'FILL' 1" }} />}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {isAdmin ? 'Buró Panamá' : 'Buró Workspace'}
            </h1>
          </div>
        </div>

        {/* Center Section: Welcome Messaging */}
        <div className="flex flex-col items-center text-center max-w-4xl animate-fade-in-up" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
          <p className={`label-md text-xs font-bold ${isAdmin ? 'text-indigo-300' : 'text-[var(--primary-container)]'} uppercase tracking-[0.2em] mb-6 opacity-90`}>
            {isAdmin ? 'Panel de Control' : 'Gestión de espacios inteligente'}
          </p>
          <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight md:leading-[1.1] text-white mb-8">
            {isAdmin ? (
              <>
                Iniciando Portal <br/>
                <span className="text-indigo-400">Administrativo</span>
              </>
            ) : (
              <>
                Tu espacio, tu comunidad,<br/>
                <span className="text-[#ffbb00]">tu mejor trabajo.</span>
              </>
            )}
          </h2>
          
          <div className="mt-8">
            {/* Primary CTA */}
            <button 
              onClick={handleEnter}
              disabled={isEntering}
              className={`group relative overflow-hidden ${isAdmin ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-[var(--primary)] hover:bg-[var(--primary)]'} hover:bg-opacity-90 text-white px-12 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-xl border-none cursor-pointer ${isEntering ? 'scale-95 opacity-80' : 'hover:scale-105 active:scale-95'}`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isAdmin ? 'Acceder al Panel' : 'Empezar'}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </span>
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </button>
          </div>

          {/* Subtle Loading/Indicator */}
          <div className={`mt-12 flex flex-col items-center gap-2 transition-opacity duration-500 ${isEntering ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-12 h-[2px] bg-white/20 relative overflow-hidden">
              <div className={`absolute inset-0 ${isAdmin ? 'bg-indigo-400' : 'bg-[#ffbb00]'} w-1/3 animate-shimmer-fast`}></div>
            </div>
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">
              {isAdmin ? 'Verificando credenciales...' : 'Sincronizando flujo de trabajo...'}
            </span>
          </div>
        </div>

        {/* Footer Section: Secondary Links & Copyright */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 text-white/50 animate-fade-in-up" style={{ animationDelay: '0.8s', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="text-sm">
            © 2026 {isAdmin ? 'Buró Workspace Co.' : 'Buró Workspace'} Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6">
            <a className="text-sm hover:text-white transition-colors" href="#">Términos</a>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <a className="text-sm hover:text-white transition-colors" href="#">Privacidad</a>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <a className="text-sm hover:text-white transition-colors flex items-center gap-1" href="#">
              <Icon name="language" className="text-[16px]" />
              ES
            </a>
          </div>
        </div>
      </main>

      {/* Floating Background Details for Atmosphere */}
      <div className={`fixed top-1/4 right-1/4 w-96 h-96 ${isAdmin ? 'bg-indigo-600/20' : 'bg-[var(--primary)]/20'} blur-[120px] pointer-events-none rounded-full`}></div>
      <div className={`fixed bottom-1/4 left-1/4 w-64 h-64 ${isAdmin ? 'bg-slate-400/10' : 'bg-[#ffbb00]/10'} blur-[80px] pointer-events-none rounded-full`}></div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation-name: fade-in-up;
          animation-duration: 1.2s;
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-shimmer-fast {
          animation: shimmer-fast 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
