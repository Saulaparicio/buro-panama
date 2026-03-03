import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabase';
import SplashScreen from './pages/SplashScreen';

// Lazy loaded components
const Home = lazy(() => import('./pages/Home'));
const Reservations = lazy(() => import('./pages/Reservations'));
const Community = lazy(() => import('./pages/Community'));
const Benefits = lazy(() => import('./pages/Benefits'));
const Profile = lazy(() => import('./pages/Profile'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const Login = lazy(() => import('./pages/Login'));
const Registro = lazy(() => import('./pages/Registro'));
const Plans = lazy(() => import('./pages/Plans'));
const Events = lazy(() => import('./pages/Events'));

// Admin Components
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AddMember = lazy(() => import('./pages/Admin/AddMember'));
const ManageSpaces = lazy(() => import('./pages/Admin/ManageSpaces'));
const MemberDetail = lazy(() => import('./pages/Admin/MemberDetail'));
const ManageMembers = lazy(() => import('./pages/Admin/ManageMembers'));
const ManageReservations = lazy(() => import('./pages/Admin/ManageReservations'));
const ManagePlans = lazy(() => import('./pages/Admin/ManagePlans'));
const ManageEvents = lazy(() => import('./pages/Admin/ManageEvents'));
const AdminReports = lazy(() => import('./pages/Admin/AdminReports'));

// Simple Auth Context simulation
export type UserRole = 'member' | 'admin';

const AdminRoute: React.FC<{ children: React.ReactNode, role: UserRole }> = ({ children, role }) => {
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const MemberLayout: React.FC<{ children: React.ReactNode, role: UserRole, onRoleChange: (role: UserRole) => void, profile: any, darkMode: boolean, toggleDarkMode: () => void }> = ({ children, role, onRoleChange, profile, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const handleAdminAccess = () => {
    onRoleChange('admin');
    navigate('/admin');
  };

  const placeholderAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=E5E7EB&color=9CA3AF`;

  return (
    <div className="min-h-screen pb-32 flex flex-col bg-white dark:bg-buro-black transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-buro-black/90 backdrop-blur-sm px-6 md:px-12 py-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <button onClick={toggleDarkMode} className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-buro-black dark:text-primary transition-all">
          <span className="material-symbols-outlined !text-xl">{darkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <Link to="/" className="flex items-center justify-center bg-primary px-4 py-1.5 font-black text-[11px] tracking-[0.3em] text-buro-black uppercase border border-buro-black/5 shadow-sm">
          BURÓ
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/profile" className="size-10 rounded-xl overflow-hidden border-2 border-primary shadow-sm relative">
            <img alt="Profile" className="w-full h-full object-cover" src={profile?.avatar_url || placeholderAvatar} />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12">
        {children}
      </main>

      {role !== 'admin' && (
        <button
          onClick={handleAdminAccess}
          title="Acceso Admin"
          className="fixed bottom-28 right-4 z-50 size-12 bg-buro-black text-primary dark:bg-primary dark:text-buro-black rounded-2xl flex items-center justify-center shadow-xl shadow-buro-black/20 hover:scale-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined !text-xl filled">admin_panel_settings</span>
        </button>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1a190b] border-t border-gray-100 dark:border-white/5 px-2 flex justify-around items-center h-24 shadow-[0_-15px_50px_rgba(0,0,0,0.04)]">
        {[
          { path: '/', label: 'Inicio', icon: 'grid_view' },
          { path: '/reservations', label: 'Reservas', icon: 'desk' },
          { path: '/community', label: 'Miembros', icon: 'groups' },
          { path: '/events', label: 'Eventos', icon: 'calendar_today' },
          { path: '/benefits', label: 'Beneficios', icon: 'workspace_premium' },
          { path: '/profile', label: 'Perfil', icon: 'person' },
        ].map((item) => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${isActive(item.path) ? 'text-buro-black dark:text-primary' : 'text-gray-400'}`}>
            <div className={`size-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive(item.path) ? 'bg-primary text-buro-black shadow-lg shadow-primary/20' : 'bg-transparent'}`}>
              <span className={`material-symbols-outlined !text-[26px] ${isActive(item.path) ? 'filled font-bold' : ''}`} style={{ fontVariationSettings: isActive(item.path) ? "'FILL' 1, 'wght' 700" : "'FILL' 0, 'wght' 300" }}>{item.icon}</span>
            </div>
            <span className={`text-[9px] uppercase tracking-[0.15em] transition-all font-black ${isActive(item.path) ? 'text-buro-black dark:text-primary' : 'text-gray-400'}`}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode, profile: any, darkMode: boolean, toggleDarkMode: () => void }> = ({ children, profile, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdminActive = (path: string) => location.pathname === path;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-buro-black transition-colors duration-300 flex flex-col md:flex-row">
      <aside className={`fixed md:sticky top-0 z-[60] w-72 h-screen bg-buro-black text-white p-8 flex flex-col transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-4 mb-12">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-buro-black font-black text-xs tracking-tighter shadow-lg shadow-primary/20">BURÓ</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">Admin Panel</p>
            <p className="text-xs font-bold text-gray-500">v2.4 Workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {[
            { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
            { path: '/admin/reports', label: 'Reportes y Analítica', icon: 'analytics' },
            { path: '/admin/reservations', label: 'Reservaciones', icon: 'calendar_month' },
            { path: '/admin/members', label: 'Gestión de Miembros', icon: 'groups' },
            { path: '/admin/spaces', label: 'Espacios y Sedes', icon: 'other_houses' },
            { path: '/admin/plans', label: 'Planes y Membresías', icon: 'card_membership' },
            { path: '/admin/events', label: 'Eventos', icon: 'local_activity' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${isAdminActive(item.path) ? 'bg-primary text-buro-black shadow-xl shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className={`material-symbols-outlined !text-xl ${isAdminActive(item.path) ? 'filled' : ''}`}>{item.icon}</span>
              <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
          <button onClick={toggleDarkMode} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            <span className="text-xs font-black uppercase tracking-widest">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
          <Link to="/" className="flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">west</span>
            <span className="text-xs font-black uppercase tracking-widest">Vista Miembro</span>
          </Link>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 dark:bg-buro-black/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 px-8 flex items-center justify-between sticky top-0 z-50">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden size-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="hidden md:block">
            <h2 className="text-sm font-black text-buro-black dark:text-white uppercase tracking-[0.2em]">{isAdminActive('/admin') ? 'Dashboard' : 'Administración'}</h2>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/profile" className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-buro-black dark:text-white uppercase tracking-widest leading-none">{profile?.full_name || 'Admin'}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Super Admin</p>
              </div>
              <div className="size-10 rounded-xl overflow-hidden border-2 border-primary shadow-sm">
                <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=Admin&background=fde912&color=1c1b0c`} className="w-full h-full object-cover" alt="Admin" />
              </div>
            </Link>
          </div>
        </header>
        <div className="p-8 md:p-12 overflow-y-auto no-scrollbar flex-1">
          {children}
        </div>
      </main>
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
    fetchProfile();
    // Artificial loading for the splash screen effect
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        if (data?.role === 'admin') setUserRole('admin');
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const toggleRole = (role: UserRole) => setUserRole(role);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  if (loading) return <SplashScreen />;

  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-buro-black transition-colors">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando BURÓ...</p>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          <Route path="/" element={<MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Home /></MemberLayout>} />
          <Route path="/reservations" element={<MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Reservations /></MemberLayout>} />
          <Route path="/community" element={<MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Community /></MemberLayout>} />
          <Route path="/events" element={<MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Events /></MemberLayout>} />
          <Route path="/benefits" element={<MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Benefits /></MemberLayout>} />
          <Route path="/profile" element={<MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Profile role={userRole} onRoleChange={toggleRole} /></MemberLayout>} />
          <Route path="/plans" element={<MemberLayout role={userRole} onRoleChange={toggleRole} profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Plans /></MemberLayout>} />
          <Route path="/checkin" element={<CheckIn />} />

          <Route path="/admin" element={<AdminRoute role={userRole}><AdminLayout profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><AdminDashboard /></AdminLayout></AdminRoute>} />
          <Route path="/admin/add-member" element={<AdminRoute role={userRole}><AdminLayout profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><AddMember /></AdminLayout></AdminRoute>} />
          <Route path="/admin/spaces" element={<AdminRoute role={userRole}><AdminLayout profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageSpaces /></AdminLayout></AdminRoute>} />
          <Route path="/admin/members" element={<AdminRoute role={userRole}><AdminLayout profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageMembers /></AdminLayout></AdminRoute>} />
          <Route path="/admin/reservations" element={<AdminRoute role={userRole}><AdminLayout profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageReservations /></AdminLayout></AdminRoute>} />
          <Route path="/admin/plans" element={<AdminRoute role={userRole}><AdminLayout profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManagePlans /></AdminLayout></AdminRoute>} />
          <Route path="/admin/events" element={<AdminRoute role={userRole}><AdminLayout profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ManageEvents /></AdminLayout></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute role={userRole}><AdminLayout profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><AdminReports /></AdminLayout></AdminRoute>} />
          <Route path="/admin/members/:id" element={<AdminRoute role={userRole}><AdminLayout profile={profile} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><MemberDetail /></AdminLayout></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="bottom-center" />
    </Router>
  );
};

export default App;
