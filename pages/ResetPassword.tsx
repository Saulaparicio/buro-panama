import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Cuando usamos HashRouter, Supabase a veces no puede leer el access_token automáticamente.
    // Lo extraemos manualmente de la URL y establecemos la sesión.
    const hash = window.location.hash;
    if (hash.includes('access_token=')) {
      const hashParams = new URLSearchParams(hash.substring(hash.indexOf('access_token=')));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        }).then(({ error }) => {
          if (!error) {
            // Limpiar la URL para que no queden los tokens expuestos
            window.location.hash = '/reset-password';
          }
        });
      }
    }

    // Escuchamos los cambios de sesión para no redirigir prematuramente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => navigate('/welcome'), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9FC] p-6 font-sans">
      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-800">Nueva Contraseña</h1>
          <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Crea tu nueva credencial</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="size-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined !text-3xl">check</span>
            </div>
            <p className="text-sm font-bold text-slate-600">¡Contraseña actualizada con éxito!</p>
            <p className="text-xs text-slate-400">Redirigiendo a tu panel...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">error</span>
                <span className="flex-1">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Nueva Contraseña</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Confirmar Contraseña</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
