import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { UserRole } from '../App';
import { useNavigate } from 'react-router-dom';
import { Payment, Membership, Member } from '../types';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface ProfileProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const PaymentsModal: React.FC<{ payments: Payment[]; onClose: () => void }> = ({ payments, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fade">
      <div className="absolute inset-0 bg-[var(--on-primary-fixed)]/80 backdrop-blur-3xl" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-[var(--surface)] rounded-3xl p-8 sm:p-20 shadow-2xl flex flex-col max-h-[85vh] border border-[var(--outline-variant)]/20 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex justify-between items-start mb-16 shrink-0">
          <div>
            <span className="label-md opacity-40 mb-2 block tracking-[0.4em]">ARCHIVO HISTÓRICO</span>
            <h2 className="display-lg text-4xl uppercase font-display tracking-tighter text-[var(--on-primary-fixed)]">Transacciones</h2>
          </div>
          <button
            onClick={onClose}
            className="size-16 rounded-xl bg-white border border-[var(--outline-variant)]/20 flex items-center justify-center hover:bg-[var(--on-primary-fixed)] hover:text-white transition-all duration-500 active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined !text-xl">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-2">
          {payments.length === 0 ? (
            <div className="py-24 text-center space-y-6 opacity-20">
              <span className="material-symbols-outlined !text-6xl">receipt_long</span>
              <p className="label-md tracking-widest uppercase">Sin registros detectados</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div 
                key={payment.id} 
                className="group p-8 rounded-xl bg-[var(--surface-container-low)] hover:bg-[var(--on-primary-fixed)] transition-all duration-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="flex items-center gap-8">
                  <div className={`size-16 rounded-xl flex items-center justify-center transition-all duration-700 group-hover:bg-white/10 ${
                    payment.status === 'completed' ? 'bg-[var(--on-primary-fixed)]/5 text-[var(--on-primary-fixed)]' : 'bg-[var(--primary)]/20 text-[var(--on-primary-fixed)]'
                  } group-hover:text-[var(--primary)]`}>
                    <span className="material-symbols-outlined !text-3xl">{payment.status === 'completed' ? 'check' : 'pending'}</span>
                  </div>
                  <div>
                    <p className="title-md font-display uppercase tracking-tighter text-[var(--on-primary-fixed)] group-hover:text-white transition-colors">{payment.description || 'Cuota de Membresía'}</p>
                    <p className="label-md text-[10px] opacity-40 mt-1 group-hover:text-white/40 transition-colors uppercase tracking-[0.2em]">
                      {new Date(payment.created_at).toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="display-lg text-3xl font-display tracking-tighter text-[var(--on-primary-fixed)] group-hover:text-white transition-colors">${payment.amount.toLocaleString()}</p>
                  <p className="label-md text-[10px] uppercase tracking-widest opacity-40 group-hover:text-[var(--primary)] transition-colors">{payment.payment_method}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


const Profile: React.FC<ProfileProps> = ({ role, onRoleChange }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Member | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Modals Visibility
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<any>({
    notifications: { email: true, push: true }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const [profileRes, membershipRes, paymentsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('memberships').select('*, tier:membership_tiers(*)').eq('profile_id', user.id).eq('status', 'active').maybeSingle(),
        supabase.from('payments').select('*').eq('profile_id', user.id).order('created_at', { ascending: false })
      ]);

      if (profileRes.error) throw profileRes.error;

      setProfile(profileRes.data);
      setEditData(profileRes.data);
      setNotificationSettings(profileRes.data.settings || { notifications: { email: true, push: true } });
      setMembership(membershipRes.data as unknown as Membership);
      setPayments(paymentsRes.data || []);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editData.name,
          phone: editData.phone,
          company: editData.company
        })
        .eq('id', profile?.id);

      if (error) throw error;
      if (profile) setProfile({ ...profile, name: editData.name, phone: editData.phone, company: editData.company });
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FDE910', '#11171D', '#FFFFFF']
      });

      setIsEditing(false);
      toast.success('Perfil actualizado con éxito');
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Foto de perfil actualizada');
    } catch (err: any) {
      toast.error('Error al subir: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      setPassLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;
      toast.success('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setPasswords({ new: '', confirm: '' });
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setPassLoading(false);
    }
  };

  const handleUpdateSettings = async (newSettings: any) => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ settings: newSettings })
        .eq('id', profile.id);

      if (error) throw error;
      setNotificationSettings(newSettings);
      toast.success('Preferencias actualizadas');
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleRoleToggle = () => {
    if (role === 'admin') {
      onRoleChange('member');
    } else {
      onRoleChange('admin');
      navigate('/admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="size-16 border-2 border-[var(--outline-variant)] border-t-[var(--on-primary-fixed)] rounded-lg animate-spin"></div>
      </div>
    );
  }

  const placeholderAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=FDE910&color=11171D`;

  return (
    <div className="space-y-12 animate-fade pb-20">
      {/* Minimalist Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-[var(--outline-variant)]/10">
        <div className="flex flex-col">
            <div className="flex items-center gap-5 mb-4">
                <div className="size-14 bg-[#6b6d00] text-white rounded-xl flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined !text-3xl">person</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">Mi Perfil</h1>
            </div>
            <p className="text-sm font-medium opacity-60 font-jakarta leading-relaxed max-w-2xl">
                Configuración de identidad corporativa, gestión de membresía y preferencias de cuenta.
            </p>
        </div>

        <div className="flex items-center gap-4">
             <button 
                onClick={handleLogout}
                className="px-6 py-3 bg-red-50 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all duration-500 flex items-center gap-2"
            >
                <span className="material-symbols-outlined !text-sm">logout</span>
                Salir
            </button>
        </div>
      </header>

      {/* Profile Overview Banner */}
      <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-20 p-8 md:p-16 bg-[var(--surface-container-low)] rounded-3xl border border-[var(--outline-variant)]/10">
        <div className="relative group/avatar shrink-0">
          <div className="size-48 md:size-64 rounded-3xl overflow-hidden border border-[var(--outline-variant)]/20 p-2 bg-white/50 backdrop-blur-3xl shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-1000">
            <img 
              src={profile?.avatar_url || placeholderAvatar} 
              alt="Profile" 
              className="w-full h-full rounded-xl object-cover scale-110 group-hover:scale-100 transition-transform duration-1000 ease-out grayscale group-hover:grayscale-0"
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-4 -right-4 size-16 bg-[var(--on-primary-fixed)] text-[var(--primary)] rounded-lg flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-500 border border-white/20 z-10"
          >
            <span className="material-symbols-outlined !text-2xl">photo_camera</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
        </div>

        <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="space-y-4">
                <span className="label-md opacity-40 border-l-[3px] border-[var(--on-primary-fixed)] pl-4 tracking-[0.4em] uppercase block font-black text-[10px]">Identidad Corporativa</span>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none text-[var(--on-primary-fixed)] truncate">
                    {profile?.name}
                </h2>
                <p className="text-lg md:text-xl opacity-40 font-jakarta font-medium lowercase">
                    {profile?.email}
                </p>
            </div>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                {(() => {
                    const name = (membership?.tier?.name || '').toLowerCase();
                    const isPremium = name.includes('premium') || name.includes('elite') || name.includes('gold');
                    const isPlus = name.includes('plus');
                    const isBasico = name.includes('basic') || name.includes('básico');
                    const isFlexible = name.includes('flex');

                    let badgeClass = "bg-white/50 border-[var(--outline-variant)]/30 text-[var(--on-primary-fixed)]";
                    if (isPremium) badgeClass = "bg-black border-black text-[var(--primary)]";
                    else if (isPlus) badgeClass = "bg-[#F5F3FF] border-purple-200 text-[#6D28D9]";
                    else if (isBasico) badgeClass = "bg-[#F0FFF4] border-green-200 text-[#059669]";
                    else if (isFlexible) badgeClass = "bg-[#F0F9FF] border-blue-200 text-[#0284C7]";

                    return (
                        <div className={`px-6 py-2 backdrop-blur-xl rounded-lg border ${badgeClass}`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest font-jakarta">{membership?.tier?.name || 'Invitado'}</span>
                        </div>
                    );
                })()}
                <div className="px-6 py-2 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest font-jakarta">Estado: Activo</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
        {/* Left Column - Financials & Role */}
        <div className="lg:col-span-4 space-y-12">
          {/* Membership Status */}
          <div className="card-workspace p-10 space-y-10 group relative overflow-hidden">
            {(() => {
                const name = (membership?.tier?.name || '').toLowerCase();
                const isPremium = name.includes('premium') || name.includes('elite') || name.includes('gold');
                const isPlus = name.includes('plus');
                const isBasico = name.includes('basic') || name.includes('básico');
                const isFlexible = name.includes('flex');

                let titleColor = "text-[var(--on-primary-fixed)]";
                let accentColor = "bg-[var(--on-primary-fixed)]";
                let containerClass = "";

                if (isPremium) {
                    titleColor = "text-[var(--primary)]";
                    accentColor = "bg-[var(--primary)]";
                    containerClass = "bg-black border-black shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]";
                } else if (isPlus) {
                    accentColor = "bg-purple-500";
                    containerClass = "bg-[#F5F3FF] border-purple-100";
                } else if (isBasico) {
                    accentColor = "bg-green-500";
                    containerClass = "bg-[#F0FFF4] border-green-100";
                } else if (isFlexible) {
                    accentColor = "bg-blue-500";
                    containerClass = "bg-[#F0F9FF] border-blue-100";
                }

                return (
                    <>
                        <div className={`transition-all duration-700 p-10 space-y-10 rounded-2xl ${containerClass}`}>
                            <div className="flex items-center gap-4">
                                <span className={`label-md opacity-30 text-[9px] uppercase tracking-widest ${isPremium ? 'text-white' : ''}`}>Estado Actual</span>
                                <div className={`h-px flex-1 ${isPremium ? 'bg-white/10' : 'bg-[var(--on-primary-fixed)]/10'}`}></div>
                            </div>
                            <div className="space-y-1">
                                <p className={`label-md text-[10px] opacity-40 uppercase tracking-widest ${isPremium ? 'text-white' : ''}`}>Plan Vigente</p>
                                <h3 className={`headline-md text-3xl font-display uppercase tracking-tighter ${isPremium ? 'text-white' : 'text-[var(--on-primary-fixed)]'}`}>{membership?.tier?.name || 'Invitado Global'}</h3>
                            </div>
                            
                            <div className={`space-y-6 pt-8 border-t ${isPremium ? 'border-white/10' : 'border-[var(--outline-variant)]/10'}`}>
                                <div className="flex justify-between items-end">
                                    <span className={`label-md text-[10px] font-bold uppercase tracking-widest opacity-40 ${isPremium ? 'text-white' : ''}`}>Créditos de Acceso</span>
                                    <span className={`display-lg text-4xl tracking-tighter leading-none ${isPremium ? 'text-[var(--primary)]' : 'text-[var(--on-primary-fixed)]'}`}>{Number(profile?.credits || 0).toLocaleString()}</span>
                                </div>
                                <div className={`h-2 w-full rounded-lg overflow-hidden ${isPremium ? 'bg-white/5' : 'bg-[var(--surface-container-high)]'}`}>
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-in-out ${accentColor}`} 
                                        style={{ width: `${Math.min(((profile?.credits || 0) / (membership?.tier?.monthly_credits || 100)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <button 
                                onClick={() => navigate('/plans')}
                                className={`w-full py-6 rounded-xl label-md font-black uppercase tracking-[0.2em] transition-all duration-700 active:scale-95 shadow-lg ${isPremium ? 'bg-[var(--primary)] text-black hover:bg-white' : 'border-2 border-[var(--on-primary-fixed)] text-[var(--on-primary-fixed)] hover:bg-[var(--on-primary-fixed)] hover:text-white'}`}
                            >
                                Mejorar Categoría
                            </button>
                        </div>
                    </>
                );
            })()}
          </div>

          {/* Balance Card */}
          <div className="p-10 bg-[var(--on-primary-fixed)] text-white rounded-3xl space-y-10 relative overflow-hidden shadow-2xl group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/10 blur-[80px] rounded-xl translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="label-md text-[10px] opacity-40 uppercase tracking-widest mb-2 font-black">Capital Corporativo</p>
                <p className="display-lg text-6xl tracking-tighter font-display leading-none">$0.<span className="opacity-30">00</span></p>
              </div>
              <span className="material-symbols-outlined !text-4xl text-[var(--primary)]">account_balance_wallet</span>
            </div>
            <div className="flex gap-4 relative z-10">
              <button className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-xl label-md font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 backdrop-blur-md">Recargar</button>
              <button 
                onClick={() => setShowPaymentsModal(true)}
                className="flex-1 py-5 bg-[var(--primary)] text-[var(--on-primary-fixed)] rounded-xl label-md font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white hover:shadow-2xl active:scale-95"
              >Historial</button>
            </div>
          </div>

          {/* Role Toggle Switcher */}
          <div className="flex items-center justify-between p-8 bg-[var(--surface-container-low)] rounded-3xl border border-[var(--outline-variant)]/20 animate-fade group">
            <div>
              <p className="label-md text-[10px] opacity-40 uppercase tracking-widest mb-1 font-black">Modo de Interacción</p>
              <p className="title-md font-display uppercase tracking-tighter text-[var(--on-primary-fixed)]">{role === 'admin' ? 'WORKSPACE STAFF' : 'MEMBRESÍA ACTIVA'}</p>
            </div>
            <button 
              onClick={handleRoleToggle}
              className={`px-6 py-3 rounded-xl label-md font-black uppercase text-[10px] tracking-widest transition-all duration-500 shadow-xl border ${role === 'admin' ? 'bg-[var(--on-primary-fixed)] text-white border-black' : 'bg-white text-[var(--on-primary-fixed)] hover:bg-[var(--on-primary-fixed)] hover:text-white border-[var(--outline-variant)]/30'}`}
            >
              {role === 'admin' ? 'STAFF ACTIVO' : 'PANELES ADMIN'}
            </button>
          </div>
        </div>

        {/* Right Column - User Data & Controls */}
        <div className="lg:col-span-8 space-y-20">
          {/* Main Info Section */}
          <div className="space-y-16">
            <div className="flex justify-between items-end border-b border-[var(--outline-variant)]/20 pb-10">
              <div className="space-y-4">
                <h2 className="display-lg text-2xl md:text-3xl uppercase font-display tracking-tighter text-[var(--on-primary-fixed)]">Credenciales Corporativas</h2>
                <p className="label-md text-[11px] opacity-40 uppercase tracking-[0.2em] font-black">Gestión de identidad global dentro del ecosistema BURÓ</p>
              </div>
              <button 
                onClick={() => {
                  setEditData({...profile});
                  setIsEditing(prev => !prev);
                }}
                className={`label-md text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 pb-2 border-b-2 ${isEditing ? 'text-red-500 border-red-500 opacity-100' : 'text-[var(--on-primary-fixed)] border-[var(--primary)] opacity-40 hover:opacity-100'}`}
              >
                {isEditing ? 'Descartar Cambios' : 'Editar Particularidades'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade">
                <div className="space-y-4">
                  <label className="label-md text-[10px] opacity-40 uppercase tracking-widest ml-1 font-black">Nombre Completo / Razón Social</label>
                  <input 
                    type="text" required value={editData.name || ''}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="w-full bg-transparent border-b-2 border-[var(--outline-variant)]/30 focus:border-[var(--on-primary-fixed)] py-5 outline-none transition-all title-md font-display uppercase tracking-widest"
                  />
                </div>
                <div className="space-y-4">
                  <label className="label-md text-[10px] opacity-40 uppercase tracking-widest ml-1 font-black">Estudio / Consultora / Startup</label>
                  <input 
                    type="text" value={editData.company || ''}
                    onChange={(e) => setEditData({...editData, company: e.target.value})}
                    className="w-full bg-transparent border-b-2 border-[var(--outline-variant)]/30 focus:border-[var(--on-primary-fixed)] py-5 outline-none transition-all title-md font-display uppercase tracking-widest"
                  />
                </div>
                <div className="space-y-4">
                  <label className="label-md text-[10px] opacity-40 uppercase tracking-widest ml-1 font-black">Frecuencia de Contacto (Teléfono)</label>
                  <input 
                    type="text" value={editData.phone || ''}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    className="w-full bg-transparent border-b-2 border-[var(--outline-variant)]/30 focus:border-[var(--on-primary-fixed)] py-5 outline-none transition-all title-md font-display uppercase tracking-widest"
                  />
                </div>
                <div className="flex items-end pt-6">
                  <button 
                    type="submit" disabled={saving}
                    className="w-full py-6 bg-[var(--on-primary-fixed)] text-[var(--primary)] rounded-lg label-md font-black text-xs uppercase tracking-widest hover:scale-105 transition-all duration-700 active:scale-95 shadow-2xl shadow-black/20"
                  >
                    {saving ? 'Sincronizando...' : 'Publicar Cambios'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                <div className="space-y-4">
                  <span className="label-md text-[10px] opacity-30 uppercase tracking-widest font-black">Dirección Digital</span>
                  <div className="flex items-center gap-4">
                    <p className="title-md font-display uppercase text-[var(--on-primary-fixed)] truncate">{profile?.email}</p>
                    <span className="material-symbols-outlined !text-base text-green-500 animate-pulse">verified_user</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <span className="label-md text-[10px] opacity-30 uppercase tracking-widest font-black">Canal de Enlace</span>
                  <p className="title-md font-display uppercase text-[var(--on-primary-fixed)]">{profile?.phone || 'Sin registro'}</p>
                </div>
                <div className="space-y-4">
                  <span className="label-md text-[10px] opacity-30 uppercase tracking-widest font-black">Curado desde</span>
                  <p className="title-md font-display uppercase text-[var(--on-primary-fixed)]">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-PA', { month: 'long', year: 'numeric' }) : '---'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="card-workspace p-10 group hover:shadow-2xl hover:border-[var(--on-primary-fixed)] transition-all duration-1000"
            >
              <div className="size-16 bg-[var(--surface-container-low)] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[var(--on-primary-fixed)] group-hover:text-[var(--primary)] transition-all">
                <span className="material-symbols-outlined !text-3xl">lock</span>
              </div>
              <p className="label-md font-black uppercase tracking-widest text-[var(--on-primary-fixed)] mt-8">Seguridad</p>
              <p className="label-md text-[9px] opacity-40 lowercase mt-2 tracking-widest font-light">Gestión de accesos y protocolos</p>
            </button>
            
            <button 
              onClick={() => setShowNotificationModal(true)}
              className="card-workspace p-10 group hover:shadow-2xl hover:border-[var(--on-primary-fixed)] transition-all duration-1000"
            >
              <div className="size-16 bg-[var(--surface-container-low)] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[var(--on-primary-fixed)] group-hover:text-[var(--primary)] transition-all">
                <span className="material-symbols-outlined !text-3xl">notifications_active</span>
              </div>
              <p className="label-md font-black uppercase tracking-widest text-[var(--on-primary-fixed)] mt-8">Canales</p>
              <p className="label-md text-[9px] opacity-40 lowercase mt-2 tracking-widest font-light">Preferencias de alerta y avisos</p>
            </button>

            <button 
              onClick={handleLogout}
              className="p-10 bg-red-50 hover:bg-red-500 group transition-all duration-700 rounded-3xl space-y-6 text-left border border-red-100/50 shadow-xl shadow-red-500/5"
            >
              <div className="size-16 bg-white/50 backdrop-blur-md rounded-xl flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all border border-red-100/20">
                <span className="material-symbols-outlined !text-3xl text-red-400 group-hover:text-red-500">logout</span>
              </div>
              <div>
                <p className="label-md font-black uppercase tracking-widest text-red-500 group-hover:text-white">Cerrar Sesión</p>
                <p className="label-md text-[9px] text-red-300 group-hover:text-white/60 lowercase mt-1 font-light tracking-wide">Finalizar actividad global</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Security Modals Subdued */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 animate-fade">
          <div className="absolute inset-0 bg-[#F1F0E8]/95 backdrop-blur-3xl" onClick={() => setShowPasswordModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl p-12 space-y-12 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.5)] border border-[var(--outline-variant)]/20">
            <div className="text-center space-y-6">
              <div className="size-24 bg-[var(--surface-container-low)] rounded-lg mx-auto flex items-center justify-center text-[var(--on-primary-fixed)]">
                  <span className="material-symbols-outlined !text-5xl">key_visualizer</span>
              </div>
              <h2 className="display-lg text-4xl uppercase font-display tracking-tighter text-[var(--on-primary-fixed)]">Acceso Maestro</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-8">
              <div className="space-y-4">
                <label className="label-md text-[10px] opacity-40 uppercase tracking-widest ml-1 font-black">Nuevo Passcode Digital</label>
                <input
                  type="password" required
                  className="w-full bg-[var(--surface-container-low)] border-none rounded-xl p-6 text-[var(--on-primary-fixed)] focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all font-display tracking-[0.5em] text-center"
                  value={passwords.new}
                  onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <label className="label-md text-[10px] opacity-40 uppercase tracking-widest ml-1 font-black">Confirmar Protocolo</label>
                <input
                  type="password" required
                  className="w-full bg-[var(--surface-container-low)] border-none rounded-xl p-6 text-[var(--on-primary-fixed)] focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all font-display tracking-[0.5em] text-center"
                  value={passwords.confirm}
                  onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                />
              </div>
              <div className="pt-8 flex gap-4">
                <button
                  type="button" onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-6 bg-[var(--surface-container-low)] text-[var(--on-primary-fixed)] rounded-xl label-md font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-all active:scale-95 border border-[var(--outline-variant)]/20"
                >Cancelar</button>
                <button
                  type="submit" disabled={passLoading}
                  className="flex-1 py-6 bg-[var(--on-primary-fixed)] text-[var(--primary)] rounded-xl label-md font-black uppercase text-[10px] tracking-widest hover:scale-105 shadow-2xl disabled:opacity-50 transition-all active:scale-95 shadow-black/20"
                >{passLoading ? 'Syncing...' : 'Sincronizar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNotificationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 animate-fade">
          <div className="absolute inset-0 bg-[#F1F0E8]/95 backdrop-blur-3xl" onClick={() => setShowNotificationModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl p-12 space-y-12 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.5)] border border-[var(--outline-variant)]/20">
            <div className="text-center space-y-6">
               <div className="size-24 bg-[var(--surface-container-low)] rounded-lg mx-auto flex items-center justify-center text-[var(--on-primary-fixed)]">
                  <span className="material-symbols-outlined !text-5xl">settings_input_antenna</span>
              </div>
              <h2 className="display-lg text-4xl uppercase font-display tracking-tighter text-[var(--on-primary-fixed)]">Canales de Alerta</h2>
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between p-6 bg-[var(--surface-container-low)] rounded-3xl border border-[var(--outline-variant)]/10">
                <div>
                  <p className="label-md font-black text-[var(--on-primary-fixed)] uppercase tracking-widest mb-1">Correo Electrónico</p>
                  <p className="label-md text-[9px] opacity-40 lowercase tracking-widest font-light">Facturación & Reportes</p>
                </div>
                <button
                  onClick={() => handleUpdateSettings({
                    ...notificationSettings,
                    notifications: { ...notificationSettings.notifications, email: !notificationSettings.notifications.email }
                  })}
                  className={`size-14 rounded-xl flex items-center justify-center transition-all duration-700 shadow-xl ${notificationSettings.notifications.email ? 'bg-[var(--on-primary-fixed)] text-[var(--primary)]' : 'bg-white text-[var(--on-primary-fixed)]'}`}
                >
                  <span className="material-symbols-outlined !text-xl">{notificationSettings.notifications.email ? 'check' : 'close'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-[var(--surface-container-low)] rounded-3xl border border-[var(--outline-variant)]/10">
                <div>
                  <p className="label-md font-black text-[var(--on-primary-fixed)] uppercase tracking-widest mb-1">Notificaciones Push</p>
                  <p className="label-md text-[9px] opacity-40 lowercase tracking-widest font-light">Eventos & Dinámicas</p>
                </div>
                <button
                  onClick={() => handleUpdateSettings({
                    ...notificationSettings,
                    notifications: { ...notificationSettings.notifications, push: !notificationSettings.notifications.push }
                  })}
                  className={`size-14 rounded-xl flex items-center justify-center transition-all duration-700 shadow-xl ${notificationSettings.notifications.push ? 'bg-[var(--on-primary-fixed)] text-[var(--primary)]' : 'bg-white text-[var(--on-primary-fixed)]'}`}
                >
                  <span className="material-symbols-outlined !text-xl">{notificationSettings.notifications.push ? 'check' : 'close'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowNotificationModal(false)}
              className="w-full py-6 bg-[var(--on-primary-fixed)] text-[var(--primary)] rounded-lg label-md font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-105 transition-all shadow-black/20"
            >Salvar Configuración</button>
          </div>
        </div>
      )}

      {showPaymentsModal && <PaymentsModal payments={payments} onClose={() => setShowPaymentsModal(false)} />}
    </div>
  );
};

export default Profile;
