import React from 'react';

export type TabValue = 'home' | 'reservations' | 'access' | 'services' | 'community';

interface BottomNavProps {
  activeTab: TabValue;
  onChangeTab: (tab: TabValue) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: 'grid_view' },
    { id: 'reservations', label: 'Reservas', icon: 'desk' },
    { id: 'access', label: 'Acceso', icon: 'qr_code_scanner' },
    { id: 'services', label: 'Servicios', icon: 'room_service' },
    { id: 'community', label: 'Comunidad', icon: 'groups' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t border-gray-100 flex items-center justify-between px-2 pb-safe z-[100]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id as TabValue)}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 bg-transparent border-none ${
              isActive ? 'text-[#111111]' : 'text-gray-400 hover:text-gray-600'
            }`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className={`flex items-center justify-center rounded-xl p-1.5 transition-colors ${isActive ? 'bg-[#FDE910]' : 'bg-transparent'}`}>
              <span className={`material-symbols-outlined !text-[22px] ${isActive ? 'filled' : ''}`}>
                {tab.icon}
              </span>
            </div>
            <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-[#111111]' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
