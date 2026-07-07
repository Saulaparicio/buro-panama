import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { TopHeader } from './components/TopHeader';
import { BottomNav, TabValue } from './components/BottomNav';
import { useNavigate } from 'react-router-dom';

import { DashboardTab } from './tabs/DashboardTab';
import { ReservationsTab } from './tabs/ReservationsTab';
import { AccessTab } from './tabs/AccessTab';
import { ServicesTab } from './tabs/ServicesTab';
import { CommunityTab } from './tabs/CommunityTab';

const MobileApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('home');
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#111111] flex flex-col font-sans selection:bg-[#FDE910] selection:text-black">
      <TopHeader profile={profile} isOnline={isOnline} />
      
      <main className="flex-1 w-full overflow-y-auto no-scrollbar pb-[100px]">
        {activeTab === 'home' && <DashboardTab profile={profile} onNavigate={setActiveTab} />}
        {activeTab === 'reservations' && <ReservationsTab profile={profile} />}
        {activeTab === 'access' && <AccessTab profile={profile} isOnline={isOnline} />}
        {activeTab === 'services' && <ServicesTab />}
        {activeTab === 'community' && <CommunityTab profile={profile} />}
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
};

export default MobileApp;
