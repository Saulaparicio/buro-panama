import React from 'react';
import { Icon } from '../../../components/ui/Icon';

export const ServicesTab: React.FC = () => {
  return (
    <div className="p-6 space-y-8 animate-fade pb-[120px]">
      <h2 className="text-2xl font-display font-medium tracking-tight text-[#111111]">Servicios y Soporte</h2>

      {/* Tech Support */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Soporte Técnico Rápido</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white border border-gray-100 p-4 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-[#111111] hover:border-[#111111]/10">
            <Icon name="wifi" className="!text-2xl text-[#FDE910]" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Credenciales Wi-Fi</span>
          </button>
          <button className="bg-white border border-gray-100 p-4 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-[#111111] hover:border-[#111111]/10">
            <Icon name="print" className="!text-2xl text-[#111111]" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Impresora</span>
          </button>
          <button className="bg-white border border-gray-100 p-4 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-[#111111] hover:border-[#111111]/10">
            <Icon name="ac_unit" className="!text-2xl text-[#111111]" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ajustar A/C</span>
          </button>
          <button className="bg-white border border-gray-100 p-4 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-[#111111] hover:border-[#111111]/10">
            <Icon name="support_agent" className="!text-2xl text-[#111111]" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Hablar con Staff</span>
          </button>
        </div>
      </div>

      {/* Cafe Menu */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">BURÓ Café (Pide a tu mesa)</h3>
        <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-[#F9F9FB] rounded-full flex items-center justify-center">
                <Icon name="local_cafe" className="text-[#111111]" />
              </div>
              <div>
                <p className="text-sm font-black uppercase text-[#111111]">Café Americano</p>
                <p className="text-xs text-gray-500 font-medium">Panamá Geisha, tueste medio.</p>
              </div>
            </div>
            <p className="text-sm font-black text-[#111111]">$2.50</p>
          </div>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-[#F9F9FB] rounded-full flex items-center justify-center">
                <Icon name="water_drop" className="text-[#111111]" />
              </div>
              <div>
                <p className="text-sm font-black uppercase text-[#111111]">Agua Mineral</p>
                <p className="text-xs text-gray-500 font-medium">Con o sin gas.</p>
              </div>
            </div>
            <p className="text-sm font-black text-[#111111]">$1.50</p>
          </div>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-[#F9F9FB] rounded-full flex items-center justify-center">
                <Icon name="bakery_dining" className="text-[#111111]" />
              </div>
              <div>
                <p className="text-sm font-black uppercase text-[#111111]">Croissant Mantequilla</p>
                <p className="text-xs text-gray-500 font-medium">Recién horneado.</p>
              </div>
            </div>
            <p className="text-sm font-black text-[#111111]">$3.00</p>
          </div>
          <div className="p-4 bg-[#F9F9FB]">
            <button className="w-full bg-[#111111] text-white py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
              <Icon name="shopping_cart" className="!text-sm" />
              Ver Menú Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
