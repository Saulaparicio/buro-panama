import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { Icon } from '../../components/ui/Icon';

interface AdminLoginProps {
  onLoginSuccess: (role: 'admin' | 'staff') => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      if (authError) throw authError;

      if (authData?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error('No se pudo encontrar el perfil de usuario asociado.');
        }

        const role = profile.role;
        if (role === 'admin' || role === 'staff') {
          onLoginSuccess(role);
          navigate('/welcome', { state: { from: '/admin' } });
        } else {
          await supabase.auth.signOut();
          throw new Error('Acceso denegado. Esta cuenta no posee credenciales de administrador.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación del administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans antialiased">
      
      {/* Left side: Premium Coworking Image (50% Width) */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white flex-col justify-between p-16 relative overflow-hidden shrink-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-110" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/90 via-indigo-900/50 to-transparent mix-blend-multiply"></div>
        
        {/* Branding Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="size-11 bg-white text-black flex items-center justify-center font-black tracking-tighter rounded-xl shadow-lg transition-transform group-hover:rotate-12 duration-500">
              B
            </div>
            <span className="text-xl font-black uppercase tracking-[0.1em] text-white">
              BURÓ <span className="font-light opacity-60">PANAMÁ</span>
            </span>
          </Link>
        </div>

        {/* Brand Core Message (Matches Screenshot layout exactly) */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-display">
            Buró Workspace
          </h2>
          <p className="text-base text-indigo-100/90 leading-relaxed font-medium">
            Diseña tu jornada laboral ideal en espacios que potencian tu creatividad y comunidad.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs tracking-widest font-semibold opacity-40 uppercase">
          © 2026 BURÓ WORKSPACE CO.
        </div>
      </div>

      {/* Right side: Clean, Modern Admin Form (50% Width) */}
      <div className="w-full md:w-1/2 flex flex-col justify-between px-8 sm:px-16 md:px-12 lg:px-20 py-10 bg-[#FAF9FC] overflow-y-auto">
        {/* Top Header Placeholder (e.g. Back button or empty) */}
        <div className="flex justify-end">
          <Link 
            to="/" 
            className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider flex items-center gap-2"
          >
            <Icon name="arrow_back" className="text-sm" />
            Volver al inicio
          </Link>
        </div>

        {/* Form Container */}
        <div className="max-w-[440px] mx-auto w-full space-y-10 my-auto">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Portal Administrativo
            </h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Ingresa tus credenciales autorizadas para gestionar y monitorear el ecosistema de Buró Panamá.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-3 border border-rose-100 animate-fade">
                <Icon name="error" className="text-lg" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-0.5">
                  Correo Electrónico
                </label>
                <div className="relative flex items-center border border-slate-200 rounded-xl px-4 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm">
                  <Icon name="mail" className="text-slate-400 text-lg mr-2 select-none" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="w-full py-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none border-none bg-transparent"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                    Contraseña
                  </label>
                  <Link 
                    to="/login" 
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    Recuperar
                  </Link>
                </div>
                <div className="relative flex items-center border border-slate-200 rounded-xl px-4 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm">
                  <Icon name="key" className="text-slate-400 text-lg mr-2 select-none" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full py-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none border-none bg-transparent"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer flex items-center ml-2"
                  >
                    <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-lg" />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer border-none"
            >
              {loading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Verificar Identidad
                  <Icon name="shield" className="text-sm" />
                </>
              )}
            </button>
          </form>

          {/* Social Authentications styling / Member Login redirect */}
          <div className="space-y-6 pt-4 border-t border-slate-200/60">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">O continuar con</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                to="/login"
                className="flex-1 py-3.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Icon name="person" className="text-base" />
                Portal Miembros
              </Link>
              <Link 
                to="/registro"
                className="flex-1 py-3.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Icon name="workspace_premium" className="text-base" />
                Iniciar Afiliación
              </Link>
            </div>
          </div>
        </div>

        {/* Footer help section */}
        <div className="flex justify-between items-center text-xs text-slate-400 font-semibold pt-8">
          <span>¿Ya tienes cuenta? <Link to="/login" className="text-indigo-600 hover:underline">Inicia sesión</Link></span>
          <a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
            <Icon name="help_outline" className="text-sm" />
            Ayuda
          </a>
        </div>
      </div>

    </div>
  );
};

export default AdminLogin;
