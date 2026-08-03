import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, sendWelcomeEmail } from '../supabase';
import { toast } from 'react-hot-toast';
import { Icon } from '../components/ui/Icon';

const Registro: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Paso 1 — Variable de estado global para el paso actual
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    password: '',
    confirmPassword: ''
  });

  // OTP state
  const [otpToken, setOtpToken] = useState('');

  // Company Onboarding state (Step 3)
  const [companyData, setCompanyData] = useState({
    companyName: '',
    industry: 'Architecture',
    employeeRange: '1-10',
    avatarUrl: ''
  });

  const [passwordStrength, setPasswordStrength] = useState<'low' | 'medium' | 'high'>('low');

  // Paso 6 — Maneja el regreso del usuario al montar la página
  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          if (profile.settings?.onboardingCompleted) {
            // Si onboarded = true -> redirige directo a / (dashboard)
            navigate('/');
          } else {
            // Si onboarded = false -> muestra pantalla 3 (empresa)
            setCurrentStep(3);
          }
        } else {
          // Si hay sesión pero no hay perfil por alguna razón, se asume no onboarded
          setCurrentStep(3);
        }
      } else {
        // Si no hay sesión -> muestra pantalla 1 (registro)
        setCurrentStep(1);
      }
    } catch (err) {
      console.error('Error checking active session:', err);
      setCurrentStep(1);
    }
  };

  // Password Strength hook
  useEffect(() => {
    const pass = formData.password;
    if (pass.length === 0) {
      setPasswordStrength('low');
      return;
    }
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);

    if (pass.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      setPasswordStrength('high');
    } else if (pass.length >= 6 && hasLetters && hasNumbers) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('low');
    }
  }, [formData.password]);

  const generateSecurePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~}{[]:;?><,./-=";
    let newPassword = "";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+~}{[]:;?><,./-=";

    newPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
    newPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
    newPassword += numbers[Math.floor(Math.random() * numbers.length)];
    newPassword += special[Math.floor(Math.random() * special.length)];

    for (let i = 0; i < 10; i++) {
      newPassword += chars[Math.floor(Math.random() * chars.length)];
    }

    newPassword = newPassword.split('').sort(() => 0.5 - Math.random()).join('');

    setFormData(prev => ({
      ...prev,
      password: newPassword,
      confirmPassword: newPassword
    }));
    setShowPassword(true);
  };

  // Paso 2 — Pantalla 1: Formulario de registro
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data, error: registerError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            full_name: formData.name,
            phone: formData.phone,
            role: formData.role
          }
        }
      });

      if (registerError) throw registerError;

      if (data?.user) {
        setUserId(data.user.id);
        // Pre-create the profile row safely
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            credits: 10,
            status: 'active',
            settings: { onboardingCompleted: false }
          }
        ]);
        if (profileError) {
          console.warn('Profile insert warning:', profileError.message);
        }
      }

      // Guardas el email en estado local y avanzas a Paso 2
      toast.success('¡Registro de credenciales exitoso!');
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Error al registrar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/#/registro'
        }
      });
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar con Google.');
    }
  };

  // Paso 3 — Pantalla 2: Verificar email (OTP)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otpToken,
        type: 'signup'
      });

      if (otpError) throw otpError;

      if (data?.session) {
        toast.success('¡Correo verificado con éxito!');
        // Avanzas a paso 3
        setCurrentStep(3);
      } else {
        throw new Error('No se pudo iniciar sesión activa tras verificar el código.');
      }
    } catch (err: any) {
      setError(err.message || 'Código OTP inválido o expirado. Reinténtalo.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 4 — Pantalla 3: Datos de empresa
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Subiendo imagen...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId || Math.random()}-${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!uploadError && data) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        setCompanyData(prev => ({ ...prev, avatarUrl: publicUrl }));
        toast.success('¡Imagen subida correctamente!', { id: loadingToast });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCompanyData(prev => ({ ...prev, avatarUrl: reader.result as string }));
          toast.success('¡Imagen cargada correctamente!', { id: loadingToast });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      toast.error('Error al cargar la imagen.', { id: loadingToast });
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión de usuario activa.');

      // Guardas empresa, empleados y logo
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          company: companyData.companyName,
          avatar_url: companyData.avatarUrl,
          settings: {
            industry: companyData.industry,
            employeeRange: companyData.employeeRange,
            onboardingCompleted: true // marcas onboarded: true
          }
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Enviar email de bienvenida definitivo
      sendWelcomeEmail({
        to: formData.email || user.email || '',
        memberName: formData.name || user.user_metadata?.name || 'Socio Buró',
        tenantId: ''
      }).catch(err => console.error('Error welcome email:', err));

      toast.success('¡Perfil corporativo completado!');
      // Avanzas a paso 4
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los detalles de la empresa.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 5 — Pantalla 4: Redirección al Dashboard
  useEffect(() => {
    if (currentStep === 4) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF9FC] font-sans antialiased">
      
      {/* Left side: Premium branding image (Shared style across all steps) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200')" }}></div>
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
            Diseña tu jornada laboral ideal en espacios que potencian tu creatividad y comunidad.
          </p>
        </div>

        <div className="relative z-10 text-[10px] tracking-widest font-bold opacity-30 uppercase">
          © 2026 BURÓ WORKSPACE CO.
        </div>
      </div>

      {/* Right side: Steps display */}
      <div className="w-full md:w-[55%] lg:w-[60%] flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 py-12 overflow-y-auto">
        <div className="max-w-[560px] mx-auto w-full space-y-8">
          
          {/* STEP 1: Registration Form */}
          {currentStep === 1 && (
            <>
              <div className="flex justify-between items-center text-xs font-bold text-indigo-600">
                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-1/4 h-full bg-indigo-600 rounded-full"></div>
                </div>
                <span>Paso 1 de 4 • Datos Iniciales</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Crear Cuenta</h1>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Regístrate para empezar a configurar tu acceso exclusivo en BURÓ.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 border border-red-100">
                    <Icon name="error" className="text-lg" />
                    <span className="flex-1">{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nombre Completo</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Correo Electrónico</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="usuario@ejemplo.com"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Teléfono</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+34 000 000 000"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cargo / Rol</label>
                    <div className="relative">
                      <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="member">Socio Regular</option>
                        <option value="staff">Diseño & Arquitectura</option>
                        <option value="corporate">Corporativo / Empresa</option>
                      </select>
                      <Icon name="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contraseña</label>
                    <button 
                      type="button" 
                      onClick={generateSecurePassword}
                      className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1 focus:outline-none"
                    >
                      <Icon name="lock_reset" className="!text-[11px]" />
                      Generar contraseña segura
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer flex items-center"
                    >
                      <Icon name={showPassword ? "visibility_off" : "visibility"} className="!text-lg" />
                    </button>
                  </div>

                  {/* Password strength */}
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1.5">
                      <div className={`h-1 flex-1 rounded-full ${formData.password.length > 0 ? (passwordStrength === 'low' ? 'bg-red-500' : 'bg-indigo-600') : 'bg-slate-100'}`}></div>
                      <div className={`h-1 flex-1 rounded-full ${formData.password.length > 0 && (passwordStrength === 'medium' || passwordStrength === 'high') ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
                      <div className={`h-1 flex-1 rounded-full ${formData.password.length > 0 && passwordStrength === 'high' ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Confirmar Contraseña</label>
                  <input 
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Repite tu contraseña"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer border-none"
                >
                  {loading ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Registrar Credenciales'
                  )}
                </button>
              </form>

              {/* Social logins */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/60"></div>
                </div>
                <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
                  <span className="bg-[#FAF9FC] px-4 text-slate-400 text-[9px]">O continuar con</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={handleGoogleLogin} className="flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 transition-all rounded-xl text-xs font-bold text-slate-600 cursor-pointer">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="size-4" />
                  Google
                </button>
                <button type="button" className="flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 transition-all rounded-xl text-xs font-bold text-slate-600 cursor-pointer">
                  <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="size-4" />
                  GitHub
                </button>
              </div>

              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 pt-4">
                <span>
                  ¿Ya tienes cuenta?{' '}
                  <Link to="/login" className="text-indigo-600 hover:underline">Inicia sesión</Link>
                </span>
              </div>
            </>
          )}

          {/* STEP 2: Verify OTP Code */}
          {currentStep === 2 && (
            <>
              <div className="flex justify-between items-center text-xs font-bold text-indigo-600">
                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-2/4 h-full bg-indigo-600 rounded-full"></div>
                </div>
                <span>Paso 2 de 4 • Verificación</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Verifica tu Correo</h1>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Ingresa el código OTP enviado a <span className="text-indigo-600 font-bold">{formData.email}</span>.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 border border-red-100">
                    <Icon name="error" className="text-lg" />
                    <span className="flex-1">{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Código OTP</label>
                  <input 
                    type="text" 
                    required
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 text-center tracking-[1em] pl-[1.5em] placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer border-none"
                >
                  {loading ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Confirmar Código'
                  )}
                </button>
              </form>

              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 pt-4">
                <button 
                  type="button" 
                  onClick={() => setCurrentStep(1)}
                  className="text-indigo-600 hover:underline bg-transparent border-none cursor-pointer text-xs font-bold"
                >
                  Volver al Registro
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Company Onboarding Details */}
          {currentStep === 3 && (
            <>
              <div className="flex justify-between items-center text-xs font-bold text-indigo-600">
                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-indigo-600 rounded-full"></div>
                </div>
                <span>Paso 3 de 4 • Detalles de Empresa</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Detalles de tu Empresa</h1>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Configura el perfil de tu organización para personalizar tu experiencia en el workspace.
                </p>
              </div>

              <form onSubmit={handleCompanySubmit} className="space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 border border-red-100">
                    <Icon name="error" className="text-lg" />
                    <span className="flex-1">{error}</span>
                  </div>
                )}

                {/* Avatar upload */}
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div 
                    onClick={handleAvatarClick}
                    className="size-28 rounded-full border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-500 transition-all flex items-center justify-center relative cursor-pointer group overflow-hidden shadow-sm"
                  >
                    {companyData.avatarUrl ? (
                      <img src={companyData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Icon name="add_a_photo" className="!text-3xl text-slate-400 group-hover:scale-110 transition-transform" />
                    )}
                    <div className="absolute bottom-1 right-1 size-7 bg-indigo-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      <Icon name="edit" className="!text-sm" />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sube tu logo o foto de perfil</span>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nombre de la Empresa</label>
                    <input 
                      type="text" 
                      required
                      value={companyData.companyName}
                      onChange={(e) => setCompanyData({...companyData, companyName: e.target.value})}
                      placeholder="Ej. Creative Dynamics"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sector de la Industria</label>
                    <div className="relative">
                      <select 
                        value={companyData.industry}
                        onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="Architecture">Arquitectura & Diseño</option>
                        <option value="Technology">Tecnología & Software</option>
                        <option value="Consulting">Consultoría & Finanzas</option>
                        <option value="Marketing">Marketing & Creatividad</option>
                        <option value="Other">Otro Sector</option>
                      </select>
                      <Icon name="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Employees selector */}
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Número de Empleados</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['1-10', '11-50', '51-200', '200+'].map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setCompanyData({...companyData, employeeRange: range})}
                        className={`py-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                          companyData.employeeRange === range 
                            ? 'bg-white border-indigo-600 text-indigo-600 shadow-md ring-1 ring-indigo-600'
                            : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:bg-slate-100/50'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer border-none"
                >
                  {loading ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Continuar'
                  )}
                </button>
              </form>
            </>
          )}

          {/* STEP 4: Redirect / Dashboard Welcome */}
          {currentStep === 4 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="size-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <Icon name="task_alt" className="!text-4xl" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">¡Registro Completado!</h1>
                <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto leading-relaxed">
                  Estamos configurando tu espacio de trabajo. Redirigiéndote al Dashboard...
                </p>
              </div>
              <div className="size-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default Registro;
