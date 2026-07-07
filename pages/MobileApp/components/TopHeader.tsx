import React from 'react';

export const TopHeader: React.FC<{ profile: any, isOnline: boolean }> = ({ profile, isOnline }) => {
  return (
    <header className="sticky top-0 left-0 right-0 h-16 bg-white z-[100] border-b border-gray-100 flex items-center justify-between px-6 bg-white/95 backdrop-blur-3xl">
      {/* Left: Connection Indicator */}
      <div className="flex items-center">
        {!isOnline ? (
          <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-md">
            <span className="size-2 bg-red-500 rounded-full animate-pulse"></span>
            Offline
          </div>
        ) : (
          <div className="flex items-center gap-2 opacity-30">
            <span className="size-1.5 bg-green-500 rounded-full"></span>
          </div>
        )}
      </div>

      {/* Center: Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="text-xl font-black uppercase tracking-[-0.05em] text-[#111111]">
          BURÓ
        </span>
      </div>

      {/* Right: Avatar */}
      <div className="size-8 rounded-full overflow-hidden border border-gray-100">
        <img 
          src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=FDE910&color=111111`} 
          alt="Avatar" 
          className="w-full h-full object-cover" 
        />
      </div>
    </header>
  );
};
