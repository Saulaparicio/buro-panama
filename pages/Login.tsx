import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // Ensure profile exists
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('id, settings').eq('id', user.id).single();
        if (!profile) {
          await supabase.from('profiles').insert([
            { id: user.id, name: user.user_metadata.name || user.user_metadata.full_name || 'Nuevo Miembro' }
          ]);
          navigate('/onboarding');
        } else if (!profile.settings?.onboardingCompleted) {
          navigate('/onboarding');
        } else {
          navigate('/welcome', { state: { from: '/' } });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF9FC] font-sans antialiased">
      
      {/* Left side: Premium branding image (continuity with registration page) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/90 via-indigo-900/60 to-transparent mix-blend-multiply"></div>
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="size-10 bg-white text-black flex items-center justify-center font-black tracking-tighter rounded-xl shadow-lg">
              B
            </div>
            <span className="text-lg font-black uppercase tracking-[0.1em] text-white">BURÓ <span className="font-light opacity-60">PANAMÁ</span></span>
          </Link>
        </div>

        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-[1.1] font-display">
            Buró Workspace
          </h2>
          <p className="text-sm text-indigo-200/90 leading-relaxed font-medium max-w-sm">
            Accede a tu panel y gestiona tu entorno de trabajo inteligente y colaborativo.
          </p>
        </div>

        <div className="relative z-10 text-[10px] tracking-widest font-bold opacity-30 uppercase">
          © 2026 BURÓ WORKSPACE CO.
        </div>
      </div>

      {/* Right side: Login Form matching screenshot editorial guidelines */}
      <div className="w-full md:w-[55%] lg:w-[60%] flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 py-12 overflow-y-auto">
        <div className="max-w-[480px] mx-auto w-full space-y-12">
          
          {/* Header styled exactly like screenshot */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-light uppercase tracking-[0.1em] text-slate-800 font-display">
              Acceso <br />
              <span className="font-black text-indigo-600">Privado</span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 opacity-60 tracking-[0.35em] uppercase">Protocolo de Identidad Corporativa</p>
          </div>

          {/* Form Box container */}
          <div className="bg-white p-10 md:p-12 rounded-[2rem] border border-slate-200/60 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>

            <form onSubmit={handleLogin} className="space-y-8">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 border border-red-100">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Email field in screenshot style */}
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block ml-1">Credencial de Enlace (Email)</label>
                  <div className="relative flex items-center border border-slate-200 rounded-xl px-4 bg-slate-50 focus-within:bg-white focus-within:border-indigo-500 transition-all">
                    <span className="text-slate-400 text-sm mr-2 select-none">@</span>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="socio@buro.com"
                      className="w-full py-4 text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none bg-transparent uppercase tracking-wider border-none"
                    />
                  </div>
                </div>

                {/* Password field in screenshot style */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Código de Entrada (Pass)</label>
                    <button type="button" className="text-[8px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer">
                      Recuperar
                    </button>
                  </div>
                  <div className="relative flex items-center border border-slate-200 rounded-xl px-4 bg-slate-50 focus-within:bg-white focus-within:border-indigo-500 transition-all">
                    <span className="material-symbols-outlined text-slate-400 text-base mr-2 select-none">fingerprint</span>
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-4 text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none bg-transparent uppercase tracking-widest border-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer flex items-center"
                    >
                      <span className="material-symbols-outlined !text-base">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit button in screenshot style */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer border-none"
              >
                {loading ? (
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Autenticar Acceso
                    <span className="material-symbols-outlined !text-base">verified_user</span>
                  </>
                )}
              </button>

              <div className="relative flex items-center pt-2 pb-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">O continuar con</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button 
                type="button" 
                onClick={handleGoogleLogin}
                className="w-full py-4.5 bg-white border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                Acceso con Google
              </button>
            </form>
          </div>

          {/* Bottom link to Register */}
          <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            ¿No posee credenciales?{' '}
            <Link to="/registro" className="text-indigo-600 hover:underline ml-1">Iniciar Afiliación</Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;
