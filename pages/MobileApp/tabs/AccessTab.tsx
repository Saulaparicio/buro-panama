import React, { useState, useEffect } from 'react';
import { Icon } from '../../../components/ui/Icon';

export const AccessTab: React.FC<{ profile: any; isOnline: boolean }> = ({ profile, isOnline }) => {
  const [progress, setProgress] = useState(100);
  const qrData = profile?.id || 'offline-fallback-qr';

  useEffect(() => {
    let timer: number;
    if (isOnline) {
      // Simulate rotating code every 30s (progress bar 100 to 0)
      timer = window.setInterval(() => {
        setProgress(p => (p <= 0 ? 100 : p - (100 / 300))); // 30s = 300 * 100ms
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isOnline]);

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center min-h-[70vh] animate-fade">
      <div className="w-full max-w-sm bg-[#111111] rounded-[32px] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Top Header */}
        <div className="w-full flex justify-between items-center mb-8">
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Acceso Seguro</span>
          <Icon name="shield" className="text-white/40 !text-lg" />
        </div>

        {/* QR Code Area */}
        <div className={`bg-white p-6 rounded-3xl w-full aspect-square flex flex-col items-center justify-center shadow-inner relative transition-opacity duration-300 ${!isOnline ? 'opacity-50' : 'opacity-100'}`}>
          {!isOnline && (
            <div className="absolute inset-0 bg-white/80 rounded-3xl flex flex-col items-center justify-center z-10 p-6 text-center">
              <Icon name="wifi_off" className="text-red-500 !text-4xl mb-2" />
              <p className="text-[#111111] text-sm font-bold">Sin conexión</p>
              <p className="text-gray-500 text-xs mt-1">Mostrando código de emergencia offline.</p>
            </div>
          )}
          
          {/* Simulated QR Code via UI-Avatars for structure (in real app use QRCode component) */}
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
            alt="QR Code"
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>

        {/* Dynamic Data */}
        <div className="mt-8 text-center w-full">
          <p className="text-white text-xl font-display font-medium tracking-tight">{profile?.name || 'Miembro'}</p>
          <p className="text-[#FDE910] text-[10px] font-bold uppercase tracking-widest mt-1">Membresía Premium</p>
          
          {/* Progress Bar (Time remaining for next code) */}
          {isOnline && (
            <div className="w-full h-1 bg-white/10 rounded-full mt-8 overflow-hidden">
              <div 
                className="h-full bg-[#FDE910] rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          {isOnline && (
            <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mt-3">El código se actualiza automáticamente</p>
          )}
        </div>
      </div>
      <p className="text-gray-400 text-xs text-center mt-8 px-4">Acerca tu teléfono al lector de la puerta principal para ingresar al coworking.</p>
    </div>
  );
};
