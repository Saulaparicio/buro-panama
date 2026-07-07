import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'Architecture',
    employeeRange: '1-10',
    avatarUrl: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          setFormData({
            companyName: data.company || '',
            industry: data.settings?.industry || 'Architecture',
            employeeRange: data.settings?.employeeRange || '1-10',
            avatarUrl: data.avatar_url || ''
          });
        }
      } else {
        // Redirect to login if not logged in
        navigate('/login');
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show a loading toast
    const loadingToast = toast.loading('Subiendo imagen de perfil...');

    try {
      // 1. Try to upload to supabase storage bucket 'avatars'
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id || Math.random()}-${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!uploadError && data) {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
        toast.success('¡Imagen subida correctamente!', { id: loadingToast });
      } else {
        // Fallback: Convert to Base64 if bucket upload fails (very safe for local setups)
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setFormData(prev => ({ ...prev, avatarUrl: base64String }));
          toast.success('¡Imagen cargada localmente!', { id: loadingToast });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Error al subir la imagen.', { id: loadingToast });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró sesión de usuario.');

      const { error } = await supabase
        .from('profiles')
        .update({
          company: formData.companyName,
          avatar_url: formData.avatarUrl,
          settings: {
            ...profile?.settings,
            industry: formData.industry,
            employeeRange: formData.employeeRange,
            onboardingCompleted: true
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('¡Perfil configurado con éxito!');
      // Navigate to welcome splash screen
      navigate('/welcome', { state: { from: '/' } });
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF9FC] font-sans antialiased">
      
      {/* Left side: Premium branding image (same as registration/login flow) */}
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

      {/* Right side: Onboarding Form (Paso 3 de 4) */}
      <div className="w-full md:w-[55%] lg:w-[60%] flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 py-12 overflow-y-auto">
        <div className="max-w-[560px] mx-auto w-full space-y-8">
          
          {/* Progress Indicator */}
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

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Avatar upload component */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div 
                onClick={handleAvatarClick}
                className="size-28 rounded-full border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-500 transition-all flex items-center justify-center relative cursor-pointer group overflow-hidden shadow-sm"
              >
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="material-symbols-outlined !text-3xl text-slate-400 group-hover:scale-110 transition-transform">add_a_photo</span>
                )}
                
                {/* Pencil indicator icon */}
                <div className="absolute bottom-1 right-1 size-7 bg-indigo-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <span className="material-symbols-outlined !text-sm">edit</span>
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
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  placeholder="Ej. Creative Dynamics"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sector de la Industria</label>
                <div className="relative">
                  <select 
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="Architecture">Arquitectura & Diseño</option>
                    <option value="Technology">Tecnología & Software</option>
                    <option value="Consulting">Consultoría & Finanzas</option>
                    <option value="Marketing">Marketing & Creatividad</option>
                    <option value="Other">Otro Sector</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            {/* Employee number options (Grid of 4 pills) */}
            <div className="space-y-3">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Número de Empleados</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['1-10', '11-50', '51-200', '200+'].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setFormData({...formData, employeeRange: range})}
                    className={`py-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                      formData.employeeRange === range 
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
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer border-none"
            >
              {loading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Continuar'
              )}
            </button>
          </form>

          {/* Footer actions */}
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 pt-4">
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer text-xs font-bold uppercase tracking-wider"
            >
              <span className="material-symbols-outlined !text-base">arrow_back</span> Atrás
            </button>
            <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">
              © 2026 BURÓ COWORKING
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Onboarding;
