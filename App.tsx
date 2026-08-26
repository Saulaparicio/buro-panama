import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabase';
import { useTranslation } from 'react-i18next';
import SplashScreen from './pages/SplashScreen';
import { Transition } from './components/ui/Transition';
import { CreateNewDisclosure } from './components/ui/create-new-disclosure';
import { HugeiconsIcon } from '@hugeicons/react';
import { Icon } from './components/ui/Icon';
import {
  Award01Icon,
  Calendar04Icon,
  Flag02Icon,
  Folder01Icon,
  NoteIcon,
  TaskEdit01Icon,
} from '@hugeicons/core-free-icons';

// Lazy loaded components
const prefetchMap: Record<string, () => Promise<any>> = {
  '/app': () => import('./pages/MobileApp/MobileApp'),
  '/': () => import('./pages/Home'),
  '/reservations': () => import('./pages/Reservations'),
  '/community': () => import('./pages/Community'),
  '/benefits': () => import('./pages/Benefits'),
  '/profile': () => import('./pages/Profile'),
  '/checkin': () => import('./pages/CheckIn'),
  '/login': () => import('./pages/Login'),
  '/registro': () => import('./pages/Registro'),
  '/plans': () => import('./pages/Plans'),
  '/events': () => import('./pages/Events'),
  '/guests': () => import('./pages/Guests'),
  '/quoteview': () => import('./pages/QuoteView'),
  '/admin': () => import('./pages/Admin/AdminDashboard'),
  '/admin/add-member': () => import('./pages/Admin/AddMember'),
  '/admin/spaces': () => import('./pages/Admin/ManageSpaces'),
  '/admin/members': () => import('./pages/Admin/MemberDetail'),
  '/admin/manage-members': () => import('./pages/Admin/ManageMembers'),
  '/admin/reservations': () => import('./pages/Admin/ManageReservations'),
  '/admin/plans': () => import('./pages/Admin/ManagePlans'),
  '/admin/events': () => import('./pages/Admin/ManageEvents'),
  '/admin/reports': () => import('./pages/Admin/AdminReports'),
  '/admin/guests': () => import('./pages/Admin/ManageGuests'),
  '/admin/benefits': () => import('./pages/Admin/ManageBenefits'),
  '/admin/quotes': () => import('./pages/Admin/ManageQuotes'),
  '/landing': () => import('./pages/LandingPageAlt'),
  '/admin/login': () => import('./pages/Admin/AdminLogin'),
  '/onboarding': () => import('./pages/Onboarding'),
  '/admin/settings': () => import('./pages/Admin/Settings'),
  '/reset-password': () => import('./pages/ResetPassword'),
};

const prefetchRoute = (path: string) => {
  if (prefetchMap[path]) {
    prefetchMap[path]().catch(() => {});
  }
};

const MobileApp = lazy(prefetchMap['/app']);
const Home = lazy(prefetchMap['/']);
const Reservations = lazy(prefetchMap['/reservations']);
const Community = lazy(prefetchMap['/community']);
const Benefits = lazy(prefetchMap['/benefits']);
const Profile = lazy(prefetchMap['/profile']);
const CheckIn = lazy(prefetchMap['/checkin']);
const Login = lazy(prefetchMap['/login']);
const Registro = lazy(prefetchMap['/registro']);
const Plans = lazy(prefetchMap['/plans']);
const Events = lazy(prefetchMap['/events']);
const Guests = lazy(prefetchMap['/guests']);
const QuoteView = lazy(prefetchMap['/quoteview']);
const LandingPageAlt = lazy(prefetchMap['/landing']);
const ResetPassword = lazy(prefetchMap['/reset-password']);

// Admin Components
const AdminDashboard = lazy(prefetchMap['/admin']);
const AddMember = lazy(prefetchMap['/admin/add-member']);
const ManageSpaces = lazy(prefetchMap['/admin/spaces']);
const MemberDetail = lazy(prefetchMap['/admin/members']);
const ManageMembers = lazy(prefetchMap['/admin/manage-members']);
const ManageReservations = lazy(prefetchMap['/admin/reservations']);
const ManagePlans = lazy(prefetchMap['/admin/plans']);
const ManageEvents = lazy(prefetchMap['/admin/events']);
const AdminReports = lazy(prefetchMap['/admin/reports']);
const ManageGuests = lazy(prefetchMap['/admin/guests']);
const ManageBenefits = lazy(prefetchMap['/admin/benefits']);
const ManageQuotes = lazy(prefetchMap['/admin/quotes']);
const AdminLogin = lazy(prefetchMap['/admin/login']);
const Onboarding = lazy(prefetchMap['/onboarding']);
const Settings = lazy(prefetchMap['/admin/settings']);

// Simple Auth Context simulation
export type UserRole = 'member' | 'admin' | 'staff';

const AdminRoute: React.FC<{ children: React.ReactNode, role: UserRole }> = ({ children, role }) => {
  if (role === 'member') {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const MemberRoute: React.FC<{ children: React.ReactNode, profile: any }> = ({ children, profile }) => {
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const placeholderAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=ffffff`;

const MemberLayout: React.FC<{ children: React.ReactNode, role: UserRole, onRoleChange: (role: UserRole) => void, profile: any, darkMode: boolean, toggleDarkMode: () => void }> = ({ children, role, onRoleChange, profile, darkMode, toggleDarkMode }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const handleAdminAccess = () => {
    onRoleChange('admin');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)] text-[var(--on-surface)] selection:bg-[var(--primary-container)] selection:text-black">
      {/* Top Editorial Header */}
      <header className="fixed top-0 left-0 w-full h-20 z-[100] px-8 md:px-16 flex items-center justify-between border-b border-[var(--outline-variant)] bg-white/95 backdrop-blur-3xl">
        <Link to="/" className="flex items-center gap-4 group">
            <div className="size-10 bg-[var(--secondary)] text-[var(--primary-container)] flex items-center justify-center font-extrabold tracking-tighter rounded-xl group-hover:rotate-12 transition-all duration-700">
               B
            </div>
            <span className="text-xl font-black uppercase tracking-[-0.05em] text-[var(--secondary)]">BURÓ <span className="font-light opacity-30">PANAMÁ</span></span>
        </Link>
        
        <div className="flex items-center gap-12">
          {/* Language Switcher Editorial Style */}
          <button 
            onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
            className="label-md opacity-40 hover:opacity-100 transition-opacity border-none bg-transparent cursor-pointer"
          >
            {i18n.language === 'es' ? 'English' : 'Español'}
          </button>

          <Link to="/profile" className="flex items-center gap-4 group">
            <div className="text-right">
              <p className="label-md opacity-40 mb-1">{t('socio')}</p>
              <h4 className="title-sm font-display uppercase tracking-tighter">{profile?.name?.split(' ')[0] || 'Member'}</h4>
            </div>
            <div className="size-10 rounded-lg overflow-hidden border border-[var(--outline-variant)] p-0.5 group-hover:scale-105 transition-transform">
              <img src={profile?.avatar_url || placeholderAvatar(profile?.name || 'User')} alt="Avatar" className="w-full h-full object-cover rounded-[calc(var(--radius-md)-2px)]" />
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-12 md:px-24 pt-24 pb-48">
        <Transition key={location.key} direction="right" type="curved" introDuration={0.3}>
          {children}
        </Transition>
      </main>

      {/* Floating Architecture Nav */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 bg-[#11171D] rounded-xl shadow-2xl flex items-center gap-1 group transition-all duration-700">
        {[
          { path: '/', label: t('home'), icon: 'grid_view' },
          { path: '/reservations', label: t('reservations'), icon: 'desk' },
          { path: '/community', label: 'COMUNIDAD', icon: 'groups' },
          { path: '/events', label: t('events'), icon: 'local_activity' },
          { path: '/plans', label: 'PLANES', icon: 'workspace_premium' },
        ].map((item, i) => (
          <Link 
            key={item.path} 
            to={item.path}
            onMouseEnter={() => prefetchRoute(item.path)}
            className={`flex items-center justify-center gap-3 px-6 py-4 min-w-[64px] rounded-lg transition-all duration-500 overflow-hidden ${isActive(item.path) ? 'bg-[var(--primary-container)] text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <Icon name={item.icon} className="!text-xl" />
            {isActive(item.path) && (
              <span className="label-md font-bold whitespace-nowrap animate-slide-in">{item.label}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};


const AdminLayout: React.FC<{ children: React.ReactNode, profile: any, darkMode: boolean, toggleDarkMode: () => void, role: UserRole, onRoleChange: (role: UserRole) => void }> = ({ children, profile, darkMode, toggleDarkMode, role, onRoleChange }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const isAdminActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    onRoleChange('member');
    navigate('/');
  };

  const navItems = [
    { path: '/admin', labelKey: 'nav_dashboard', label: 'DASHBOARD', icon: 'dashboard', adminOnly: false, category: 'PRINCIPAL' },
    { path: '/admin/members', labelKey: 'nav_members', label: 'CLIENTES', icon: 'groups', adminOnly: false, category: 'COMUNIDAD' },
    { path: '/admin/reservations', labelKey: 'nav_reservations', label: 'RESERVAS', icon: 'calendar_month', adminOnly: false, category: 'OPERACIONES' },
    { path: '/admin/spaces', labelKey: 'nav_spaces', label: 'ESPACIOS', icon: 'other_houses', adminOnly: false, category: 'OPERACIONES' },
    { path: '/admin/plans', labelKey: 'nav_plans', label: 'PLANES', icon: 'card_membership', adminOnly: true, category: 'OPERACIONES' },
    { path: '/admin/events', labelKey: 'nav_events', label: 'EVENTOS', icon: 'local_activity', adminOnly: false, category: 'OPERACIONES' },
    { path: '/admin/reports', labelKey: 'nav_reports', label: 'ESTADÍSTICAS', icon: 'analytics', adminOnly: true, category: 'ANÁLISIS Y CONFIGURACIÓN' },
    { path: '/admin/quotes', labelKey: 'nav_quotes', label: 'COTIZACIONES', icon: 'request_quote', adminOnly: false, category: 'ANÁLISIS Y CONFIGURACIÓN' },
    { path: '/admin/settings', labelKey: 'nav_settings', label: 'CONFIGURACIÓN', icon: 'settings', adminOnly: true, category: 'ANÁLISIS Y CONFIGURACIÓN' },
  ].filter(item => !item.adminOnly || role === 'admin');

  const filteredNavItems = navItems.filter(item => t(item.labelKey, item.label).toLowerCase().includes(sidebarSearch.toLowerCase()));

  // Get unique categories for rendering
  const categories = Array.from(new Set(filteredNavItems.map(item => item.category)));

  const getPageTitle = () => {
    const currentItem = navItems.find(item => isAdminActive(item.path));
    return currentItem ? t(currentItem.labelKey, currentItem.label) : t('administration', 'ADMINISTRACIÓN');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickActions = [
    { label: 'Nueva Reserva', icon: 'event_available', path: '/admin/reservations', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Nueva Cotización', icon: 'request_quote', path: '/admin/quotes', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Nuevo Evento', icon: 'local_activity', path: '/admin/events', color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Nuevo Cliente', icon: 'person_add', path: '/admin/add-member', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-[#e9e9ec] flex selection:bg-[var(--primary-container)] selection:text-white overflow-hidden">
      {/* Sidebar Architectural Style */}
      <aside className={`h-screen sticky top-0 bg-[#0f172a] text-slate-300 py-6 px-4 flex flex-col shrink-0 shadow-2xl transition-[width] duration-300 ease-in-out z-20 ${isCollapsed ? 'w-[88px]' : 'w-[280px]'}`}>
         
         <div className="flex flex-col h-full overflow-hidden">
           {/* Header / Logo */}
           <div className="flex items-center justify-between px-2 mb-8 min-h-[40px]">
             <Link to="/" className={`flex items-center gap-3 overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'hidden opacity-0' : 'opacity-100'}`}>
                <div className="flex-shrink-0 grid place-items-center size-10 bg-indigo-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
                  <Icon name="verified" className="!text-[22px]" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[15px] font-bold tracking-tight text-white leading-tight">Buró Panamá</span>
                    <span className="text-[10px] font-medium text-slate-400">Panel de Control</span>
                </div>
             </Link>
             
             <button 
               onClick={() => setIsCollapsed(!isCollapsed)}
               className={`flex-shrink-0 grid place-items-center size-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border-none cursor-pointer ${isCollapsed ? 'mx-auto' : ''}`}
               aria-label="Toggle sidebar"
             >
               <Icon name={isCollapsed ? 'menu' : 'panel_left'} className="!text-[20px]" />
             </button>
           </div>

           {/* Search */}
           <div className={`relative flex items-center gap-2.5 h-[42px] px-3 mb-6 border border-slate-700/50 bg-slate-800/30 rounded-xl text-slate-400 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'}`}>
             <Icon name="search" className="!text-[18px]" />
             <input 
               type="text" 
               placeholder="Buscar..." 
               value={sidebarSearch}
               onChange={(e) => setSidebarSearch(e.target.value)}
               className="flex-1 min-w-0 bg-transparent border-none outline-none text-[14px] text-white placeholder-slate-500" 
             />
           </div>

           {/* Nav */}
           <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-4 custom-scrollbar">
              {categories.map(category => (
                <div key={category} className="mb-6">
                  {!isCollapsed && (
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-3">
                      {category}
                    </h4>
                  )}
                  <div className="space-y-1">
                    {filteredNavItems.filter(item => item.category === category).map((item) => {
                       const isActive = isAdminActive(item.path);
                       return (
                           <Link
                              key={item.path}
                              to={item.path}
                              onMouseEnter={() => prefetchRoute(item.path)}
                              title={isCollapsed ? t(item.labelKey, item.label) : undefined}
                              className={`flex items-center gap-3.5 h-[44px] rounded-xl px-3 transition-colors duration-200 cursor-pointer group ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'} ${isCollapsed ? 'justify-center' : 'w-full'}`}
                           >
                              <Icon name={item.icon} className={`!text-[20px] flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                              <span className={`text-[13px] font-medium whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 flex-1 overflow-hidden text-ellipsis'}`}>{t(item.labelKey, item.label)}</span>
                           </Link>
                       );
                     })}
                  </div>
                </div>
              ))}
           </nav>

           {/* Profile & Logout */}
           <div className="mt-auto pt-4 border-t border-slate-800/50">
             <div className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 ${isCollapsed ? 'flex-col justify-center' : 'hover:bg-slate-800/60'}`}>
                <Link to="/profile" className="flex-shrink-0 size-10 rounded-full overflow-hidden border border-slate-700">
                   <img src={profile?.avatar_url || placeholderAvatar('Admin')} className="w-full h-full object-cover rounded-full" alt="Admin" />
                </Link>
                <div className={`flex-1 min-w-0 transition-opacity duration-300 ${isCollapsed ? 'hidden opacity-0' : 'opacity-100'}`}>
                   <p className="text-[13px] font-semibold text-white truncate">{profile?.name?.split(' ')[0] || 'Admin'}</p>
                   <p className="text-[11px] font-medium text-slate-400 truncate">Protocolo Adm</p>
                </div>
                <button 
                  onClick={handleLogout}
                  title="Logout"
                  className={`flex-shrink-0 grid place-items-center size-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border-none bg-transparent cursor-pointer ${isCollapsed ? 'mt-2' : ''}`}
                >
                   <Icon name="logout" className="!text-[20px]" />
                </button>
             </div>
           </div>
         </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 h-screen flex flex-col bg-[var(--surface)]">
         {/* SaaS Top Bar */}
         <header className="h-20 bg-white border-b border-[var(--outline-variant)] px-10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-8">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight capitalize">{getPageTitle().toLowerCase()}</h1>
            </div>

            {/* Middle Search */}
            <div className="hidden lg:flex items-center flex-1 max-w-sm mx-10">
                <div className="relative w-full">
                    <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 !text-xl" />
                    <input 
                        type="text" 
                        placeholder="Search here..." 
                        defaultValue=""
                        className="w-full h-10 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <button 
                  onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors border-none bg-transparent cursor-pointer uppercase tracking-wider"
                >
                  {i18n.language === 'es' ? 'EN' : 'ES'}
                </button>

                <div className="flex items-center gap-2 border-r border-slate-100 pr-6 mr-2">
                    <button className="relative size-10 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors bg-transparent border-none cursor-pointer">
                        <Icon name="notifications" className="text-slate-400" />
                        <span className="absolute top-2 right-2 size-4 bg-orange-500 text-[9px] text-white font-bold flex items-center justify-center rounded-full border-2 border-white">12</span>
                    </button>
                    <button className="relative size-10 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors bg-transparent border-none cursor-pointer">
                        <Icon name="mail" className="text-slate-400" />
                        <span className="absolute top-2 right-2 size-4 bg-orange-400 text-[9px] text-white font-bold flex items-center justify-center rounded-full border-2 border-white">65</span>
                    </button>
                </div>
                
                {/* Quick Actions Menu */}
                <div className="relative z-[200]">
                    <CreateNewDisclosure 
                      items={[
                        { icon: <HugeiconsIcon icon={Calendar04Icon} size={28} strokeWidth={1.5} />, label: "Reserva", path: "/admin/reservations" },
                        { icon: <HugeiconsIcon icon={TaskEdit01Icon} size={28} strokeWidth={1.5} />, label: "Cotización", path: "/admin/quotes" },
                        { icon: <HugeiconsIcon icon={NoteIcon} size={28} strokeWidth={1.5} />, label: "Evento", path: "/admin/events" },
                        { icon: <HugeiconsIcon icon={Award01Icon} size={28} strokeWidth={1.5} />, label: "Cliente", path: "/admin/add-member" },
                        { icon: <HugeiconsIcon icon={Folder01Icon} size={28} strokeWidth={1.5} />, label: "Espacio", path: "/admin/spaces" },
                        { icon: <HugeiconsIcon icon={Flag02Icon} size={28} strokeWidth={1.5} />, label: "Plan", path: "/admin/plans" },
                      ]}
                      initialOpen={false}
                    />
                </div>
            </div>
         </header>

         <main className="flex-1 overflow-y-auto">
            <Transition key={location.key} direction="right" type="curved" introDuration={0.3}>
                <div className="max-w-[1500px] mx-auto p-10">
                   {children}
                </div>
            </Transition>
         </main>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>('member');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchProfile().then(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setUserRole('member');
      }

      if (event === 'PASSWORD_RECOVERY') {
        window.location.hash = '/reset-password';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        if (data?.role) setUserRole(data.role as UserRole);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const toggleRole = (role: UserRole) => setUserRole(role);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  // If loading is true, we just return null or a small loader so it doesn't flash
  if (loading) return null;

  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-white dark:bg-buro-black transition-colors duration-1000">
          <div className="size-20 border-[6px] border-stone-100 border-t-primary rounded-full animate-spin"></div>
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black uppercase text-stone-300 tracking-[0.5em] font-mono animate-pulse">Initializing Buro Core</p>
            <p className="text-xs text-stone-200 font-bold uppercase tracking-widest font-mono">Quantum Interface Loading</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/login" element={<AdminLogin onLoginSuccess={(role) => setUserRole(role)} />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/app" element={<MobileApp />} />
          <Route path="/" element={<MemberRoute profile={profile}><MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Home /></MemberLayout></MemberRoute>} />
          <Route path="/reservations" element={<MemberRoute profile={profile}><MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Reservations role={userRole} /></MemberLayout></MemberRoute>} />
          <Route path="/community" element={<MemberRoute profile={profile}><MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Community /></MemberLayout></MemberRoute>} />
          <Route path="/events" element={<MemberRoute profile={profile}><MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Events /></MemberLayout></MemberRoute>} />
          <Route path="/benefits" element={<MemberRoute profile={profile}><MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Benefits /></MemberLayout></MemberRoute>} />
          <Route path="/profile" element={<MemberRoute profile={profile}><MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Profile role={userRole} onRoleChange={toggleRole} /></MemberLayout></MemberRoute>} />
          <Route path="/plans" element={<MemberRoute profile={profile}><MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Plans /></MemberLayout></MemberRoute>} />
          <Route path="/guests" element={<MemberRoute profile={profile}><MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Guests /></MemberLayout></MemberRoute>} />
          <Route path="/checkin" element={<MemberRoute profile={profile}><CheckIn /></MemberRoute>} />
          <Route path="/quote/:id" element={<QuoteView />} />

          <Route path="/admin" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><AdminDashboard /></AdminLayout></AdminRoute>} />
          <Route path="/admin/add-member" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><AddMember /></AdminLayout></AdminRoute>} />
          <Route path="/admin/spaces" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageSpaces /></AdminLayout></AdminRoute>} />
          <Route path="/admin/members" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageMembers /></AdminLayout></AdminRoute>} />
          <Route path="/admin/reservations" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageReservations /></AdminLayout></AdminRoute>} />
          <Route path="/admin/plans" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManagePlans /></AdminLayout></AdminRoute>} />
          <Route path="/admin/events" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageEvents /></AdminLayout></AdminRoute>} />
          <Route path="/admin/benefits" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageBenefits /></AdminLayout></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><AdminReports /></AdminLayout></AdminRoute>} />
          <Route path="/admin/guests" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageGuests /></AdminLayout></AdminRoute>} />
          <Route path="/admin/quotes" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageQuotes /></AdminLayout></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Settings /></AdminLayout></AdminRoute>} />
          <Route path="/admin/members/:id" element={<AdminRoute role={userRole}><AdminLayout profile={profile} role={userRole} onRoleChange={toggleRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><MemberDetail /></AdminLayout></AdminRoute>} />
          <Route path="/landing" element={<LandingPageAlt />} />
          <Route path="/welcome" element={<SplashScreen />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" />
    </Router>
  );
};

export default App;
