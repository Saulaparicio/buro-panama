
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';

const CheckIn: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpiring = timeLeft < 30;

  return (
    <div className="min-h-screen bg-[var(--surface)] flex flex-col animate-fade">
      {/* Minimal Workspace Header */}
      <header className="px-6 md:px-12 py-6 md:py-8 flex items-center justify-between border-b border-[var(--outline-variant)]/10">
        <Link
          to="/"
          className="size-12 rounded-2xl bg-[var(--surface-container-low)] flex items-center justify-center text-[var(--on-primary-fixed)] hover:bg-[var(--on-primary-fixed)] hover:text-white transition-all duration-500 border border-[var(--outline-variant)]/10"
        >
          <Icon name="arrow_back" className="!text-xl" />
        </Link>
        <div className="bg-[var(--on-primary-fixed)] px-6 py-2.5 flex items-center justify-center rounded-xl shadow-xl">
          <span className="text-[10px] font-black tracking-[0.5em] text-[var(--primary)] uppercase">BURÓ</span>
        </div>
        <div className="w-12"></div>
      </header>

      {/* Main Content - Scanner Interface */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 pb-24 md:pb-32 gap-12 md:gap-16">
        {/* Title Block */}
        <div className="text-center space-y-4">
          <span className="label-md opacity-40 tracking-[0.4em] uppercase font-black text-[10px] block">Smart Access Protocol</span>
          <h1 className="display-lg text-5xl md:text-8xl font-display uppercase tracking-tighter leading-[0.85] text-[var(--on-primary-fixed)]">
            Check-in
          </h1>
        </div>

        {/* QR Container - Workspace Styled */}
        <div className="relative w-full max-w-[280px] md:max-w-[380px] aspect-square card-workspace !p-8 md:!p-12 flex items-center justify-center group">
          <div
            className="w-full h-full bg-cover bg-center rounded-2xl md:rounded-3xl opacity-90 transition-all duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=BURÓ_PANAMÁ_ACCESS_${Date.now()}')` }}
          ></div>

          {/* Corner Accents - Primary color */}
          <div className="absolute -top-1 -left-1 size-14 md:size-20 border-t-4 md:border-t-[6px] border-l-4 md:border-l-[6px] border-[var(--primary)] rounded-tl-[2.5rem] md:rounded-tl-[3.5rem] animate-pulse"></div>
          <div className="absolute -top-1 -right-1 size-14 md:size-20 border-t-4 md:border-t-[6px] border-r-4 md:border-r-[6px] border-[var(--primary)] rounded-tr-[2.5rem] md:rounded-tr-[3.5rem] animate-pulse"></div>
          <div className="absolute -bottom-1 -left-1 size-14 md:size-20 border-b-4 md:border-b-[6px] border-l-4 md:border-l-[6px] border-[var(--primary)] rounded-bl-[2.5rem] md:rounded-bl-[3.5rem] animate-pulse"></div>
          <div className="absolute -bottom-1 -right-1 size-14 md:size-20 border-b-4 md:border-b-[6px] border-r-4 md:border-r-[6px] border-[var(--primary)] rounded-br-[2.5rem] md:rounded-br-[3.5rem] animate-pulse"></div>
        </div>

        {/* Instructions & Timer */}
        <div className="space-y-8 max-w-sm text-center">
          <p className="label-md text-[10px] md:text-[11px] opacity-40 uppercase tracking-widest font-light leading-relaxed">
            Escanea el código en el lector de la entrada para ingresar a{' '}
            <span className="font-black text-[var(--on-primary-fixed)] opacity-100">BURÓ Panamá</span>.
          </p>

          <div className="flex flex-col items-center gap-4">
            <span className="label-md text-[9px] font-black uppercase tracking-[0.4em] opacity-30">Expira en</span>
            <div className={`px-10 py-4 rounded-2xl border transition-all duration-500 ${
              isExpiring
                ? 'bg-red-50 text-red-500 border-red-200 scale-110 shadow-[0_20px_60px_-10px_rgba(239,68,68,0.2)]'
                : 'bg-[var(--surface-container-low)] text-[var(--on-primary-fixed)] border-[var(--outline-variant)]/10 shadow-xl'
            }`}>
              <span className="text-3xl md:text-4xl font-display tracking-tighter tabular-nums">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Renew Button */}
        <button
          onClick={() => setTimeLeft(180)}
          className="flex items-center gap-4 px-10 md:px-14 py-5 md:py-6 bg-[var(--on-primary-fixed)] text-[var(--primary)] rounded-2xl label-md text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all duration-700 shadow-2xl active:scale-95"
        >
          <Icon name="refresh" className="!text-xl" />
          Renovar Protocolo
        </button>
      </main>

      {/* Footer */}
      <footer className="p-8 md:p-12 text-center border-t border-[var(--outline-variant)]/10">
        <p className="label-md text-[9px] opacity-30 font-black uppercase tracking-[0.4em]">
          Sujeto a términos y condiciones de BURÓ Panamá © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default CheckIn;
