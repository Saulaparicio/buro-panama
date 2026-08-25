import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Icon } from '../components/ui/Icon';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/reset-password',
      });
      if (error) throw error;
      setMessage('Te hemos enviado un enlace de recuperación al correo.');
      setIsResetMode(false);
    } catch (err: any) {
      setError(err.message || 'Error al solicitar el enlace.');
    } finally {
      setLoading(false);
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

            <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-8">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 border border-red-100">
                  <Icon name="error" className="text-lg" />
                  <span className="flex-1">{error}</span>
                </div>
              )}
              {message && (
                <div className="p-4 bg-green-50 text-green-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 border border-green-100">
                  <Icon name="check_circle" className="text-lg" />
                  <span className="flex-1">{message}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Email field in screenshot style */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Correo Electrónico</label>
                  <div className="relative flex items-center border border-slate-200 rounded-2xl px-5 bg-white focus-within:border-indigo-500 transition-all shadow-sm">
                    <Icon name="mail" className="text-slate-400 text-xl mr-3 select-none" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@ejemplo.com"
                      className="w-full py-4.5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none bg-transparent tracking-wider border-none [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#1e293b]"
                    />
                  </div>
                </div>

                {/* Password field in screenshot style */}
                {!isResetMode && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Contraseña</label>
                      <button 
                        type="button" 
                        onClick={() => { setIsResetMode(true); setError(null); setMessage(null); }}
                        className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                      >
                        Recuperar
                      </button>
                    </div>
                    <div className="relative flex items-center border border-slate-200 rounded-2xl px-5 bg-white focus-within:border-indigo-500 transition-all shadow-sm">
                      <Icon name="key" className="text-slate-400 text-xl mr-3 select-none" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full py-4.5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none bg-transparent tracking-widest border-none [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#1e293b]"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer flex items-center"
                      >
                        <Icon name={showPassword ? "visibility_off" : "visibility"} className="!text-xl" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit button in screenshot style */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold uppercase tracking-[0.15em] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer border-none"
              >
                {loading ? (
                  <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isResetMode ? 'Enviar Enlace' : 'Verificar Identidad'}
                    <Icon name={isResetMode ? 'send' : 'shield'} className="!text-xl" />
                  </>
                )}
              </button>

              {isResetMode && (
                <button 
                  type="button" 
                  onClick={() => { setIsResetMode(false); setError(null); setMessage(null); }}
                  className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none mt-4 block text-center"
                >
                  Volver al acceso
                </button>
              )}

              {!isResetMode && (
                <>
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
                </>
              )}
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
