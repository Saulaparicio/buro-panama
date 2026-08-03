import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import { Member, Reservation, MembershipTier, Membership } from '../../types';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import { useTenant } from '../../contexts/TenantContext';
import { Icon } from '../../components/ui/Icon';

interface ExtendedMembership extends Membership {
    tier: MembershipTier;
}

const MemberDetail: React.FC = () => {
    const { tenant } = useTenant();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [member, setMember] = useState<Member | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [membership, setMembership] = useState<ExtendedMembership | null>(null);
    const [tiers, setTiers] = useState<MembershipTier[]>([]);
    const [loading, setLoading] = useState(true);

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        role: '',
        pushNotifications: true,
        weeklySummary: false,
    });
    const [saving, setSaving] = useState(false);

    // Plan Modal State
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [selectedTierId, setSelectedTierId] = useState<string>('');
    const [updatingPlan, setUpdatingPlan] = useState(false);

    useEffect(() => {
        if (id) {
            fetchMemberData();
            fetchTiers();
        }
    }, [id]);

    const fetchTiers = async () => {
        if (!tenant?.id) return;
        try {
            const { data } = await supabase
                .from('membership_tiers')
                .select('*')
                .eq('tenant_id', tenant.id)
                .eq('is_active', true);
            if (data) setTiers(data);
        } catch (err) {
            console.error('Error loading tiers:', err);
        }
    };

    const fetchMemberData = async () => {
        try {
            setLoading(true);
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;
            setMember(profile);

            // Extract settings
            const settings = profile.settings || {};
            setEditForm({
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                company: profile.company || '',
                role: profile.role || '',
                pushNotifications: settings.notifications?.push !== false,
                weeklySummary: settings.notifications?.weekly === true,
            });

            // Get reservations with space detail
            const { data: res, error: resError } = await supabase
                .from('reservations')
                .select('*, space:spaces(*)')
                .eq('member_id', id)
                .order('start_time', { ascending: false })
                .limit(5);

            if (!resError && res) setReservations(res);

            // Get membership
            const { data: mem, error: memError } = await supabase
                .from('memberships')
                .select(`
                    *,
                    tier:tier_id ( * )
                `)
                .eq('profile_id', id)
                .eq('status', 'active')
                .maybeSingle();

            if (!memError) setMembership(mem as any);

        } catch (err) {
            toast.error('Error al cargar expediente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!id) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: editForm.name,
                    email: editForm.email,
                    phone: editForm.phone,
                    company: editForm.company,
                    role: editForm.role,
                    settings: {
                        interests: member?.settings?.interests || ['Design', 'Tech'],
                        notifications: {
                            push: editForm.pushNotifications,
                            weekly: editForm.weeklySummary
                        }
                    }
                })
                .eq('id', id);

            if (error) throw error;

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#11171d', '#ffffff']
            });

            setIsEditing(false);
            fetchMemberData();
            toast.success('EXPEDIENTE ACTUALIZADO');
        } catch (err: any) {
            toast.error('Error al guardar cambios.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMember = async () => {
        if (!id) return;
        if (!window.confirm('¿Está seguro de que desea eliminar permanentemente este usuario?')) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success('Usuario eliminado exitosamente');
            navigate('/admin/members');
        } catch (err: any) {
            toast.error('Error al eliminar usuario: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePlan = async () => {
        if (!selectedTierId || !id) return;
        setUpdatingPlan(true);
        try {
            if (membership) {
                const { error } = await supabase
                    .from('memberships')
                    .update({ tier_id: selectedTierId })
                    .eq('id', membership.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('memberships')
                    .insert([{
                        profile_id: id,
                        tier_id: selectedTierId,
                        start_date: new Date().toISOString(),
                        status: 'active',
                        tenant_id: tenant?.id
                    }]);
                if (error) throw error;
            }

            confetti({
                particleCount: 100,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#3b82f6', '#11171D']
            });

            setIsPlanModalOpen(false);
            fetchMemberData();
            toast.success('NIVEL DE ACCESO ACTUALIZADO');
        } catch (err: any) {
            toast.error('Error al modificar membresía.');
        } finally {
            setUpdatingPlan(false);
        }
    };

    if (loading) return (
        <div className="py-48 flex flex-col items-center justify-center gap-12">
            <div className="relative size-32">
                <div className="absolute inset-0 border-[1px] border-slate-100 rounded-full scale-150"></div>
                <div className="absolute inset-0 border-t-2 border-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="id_card" className="!text-4xl text-slate-200 animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-4">
                <p className="text-sm font-bold text-slate-400 animate-pulse">Sincronizando Expediente Digital</p>
            </div>
        </div>
    );

    if (!member) return (
        <div className="py-32 text-center card-workspace space-y-8 bg-transparent">
            <div className="size-20 bg-slate-50 rounded-xl flex items-center justify-center mx-auto text-slate-300">
                <Icon name="person_off" className="!text-4xl font-extralight" />
            </div>
            <h3 className="text-2xl text-slate-900 mb-2 font-black uppercase tracking-tight">Expediente No Localizado</h3>
        </div>
    );

    const displayName = member.name || 'CLIENTE BURÓ';
    const memberTags = member.settings?.interests || ['Filtro HEPA', 'Doble Monitor', 'Luz Natural', 'Silencio'];

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade pb-32 px-6 md:px-12">
            {/* Header / Navigation */}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">
                <Link to="/admin/members" className="hover:text-indigo-600 transition-colors">Clientes</Link>
                <Icon name="chevron_right" className="!text-[10px]" />
                <span>Detalle</span>
            </div>

            {/* CoWork Manager Profile Dashboard Layout (Screenshot 1) */}
            <div className="bg-slate-50/50 p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-12">
                {/* 1. Header & Top Profile Card */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative size-32 rounded-3xl overflow-hidden border border-slate-200 shadow-lg shrink-0">
                            <img
                                src={member.image || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${member.id}`}
                                alt={displayName}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 right-2 size-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-indigo-700 transition-all">
                                <Icon name="photo_camera" className="!text-base" />
                            </div>
                        </div>

                        <div className="space-y-3 text-center sm:text-left">
                            <h2 className="text-4xl font-black text-slate-950 tracking-tight leading-none uppercase">
                                {displayName}
                            </h2>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-[9px] font-black tracking-widest uppercase">
                                    {membership?.tier?.name || 'Premium Member'}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="material-symbols-outlined !text-sm">location_on</span>
                                    Madrid, ES
                                </span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsEditing(true)}
                        className="h-14 px-8 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm hover:shadow-md cursor-pointer"
                    >
                        <Icon name="edit" className="!text-lg" />
                        Editar Perfil
                    </button>
                </div>

                {/* 2. KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="size-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Icon name="calendar_today" className="!text-2xl" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RESERVAS ACTIVAS</p>
                            <p className="text-3xl font-black text-slate-900 leading-none">12</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="size-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Icon name="schedule" className="!text-2xl" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL HORAS</p>
                            <p className="text-3xl font-black text-slate-900 leading-none">148h</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="size-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Icon name="workspace_premium" className="!text-2xl" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PUNTOS COMMUNITY</p>
                            <p className="text-3xl font-black text-slate-900 leading-none">2,450</p>
                        </div>
                    </div>
                </div>

                {/* 3. Main Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Personal Info & Bookings History */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Personal Information */}
                        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase border-b border-slate-50 pb-4">
                                Información Personal
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correo Electrónico</p>
                                    <p className="text-sm font-semibold text-slate-800 lowercase">{member.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teléfono</p>
                                    <p className="text-sm font-semibold text-slate-800">{member.phone || '+34 612 345 678'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empresa</p>
                                    <p className="text-sm font-semibold text-slate-800">{member.company || 'Proton Creative Agency'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargo</p>
                                    <p className="text-sm font-semibold text-slate-800">{member.role || 'Senior Art Director'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Booking History */}
                        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
                                    Historial de Reservas
                                </h3>
                                <Link to="/admin/reservations" className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-wider">
                                    Ver todo
                                </Link>
                            </div>

                            <div className="space-y-6">
                                {reservations.length > 0 ? reservations.map((res: any) => (
                                    <div key={res.id} className="flex gap-4 items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                                <img 
                                                    src={(res.space?.images && res.space.images[0]) || 'https://picsum.photos/seed/space/100'} 
                                                    alt={res.space?.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                                                    {res.space?.name || 'Sala de Conferencias B-04'}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">
                                                    {new Date(res.start_time).toLocaleDateString('es-PA', { day: 'numeric', month: 'long', year: 'numeric' })} · {new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(res.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                                            {res.status === 'completed' ? 'Completado' : 'Confirmado'}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="py-8 text-center text-slate-400 space-y-4">
                                        <Icon name="desk" className="!text-4xl opacity-30" />
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-40">No hay reservas recientes</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Plan & Settings */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Membership & Billing */}
                        <div className="bg-indigo-600 text-white p-10 rounded-3xl shadow-lg space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-all duration-1000"></div>
                            
                            <div className="space-y-1 relative z-10">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Membresía & Facturación</p>
                                <p className="text-[10px] text-indigo-300">Plan Actual</p>
                                <p className="text-3xl font-black uppercase tracking-tight">
                                    {membership?.tier?.name || 'Pro Plan'}
                                </p>
                                <p className="text-xs text-indigo-200">Renovación: 15 Junio, 2024</p>
                            </div>

                            <button 
                                onClick={() => {
                                    setSelectedTierId(membership?.tier_id || tiers[0]?.id);
                                    setIsPlanModalOpen(true);
                                }}
                                className="w-full py-4 bg-white text-indigo-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-md relative z-10 border-none cursor-pointer"
                            >
                                Gestionar Suscripción
                            </button>
                        </div>

                        {/* Preferences */}
                        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase border-b border-slate-50 pb-4">
                                Preferencias
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Notificaciones Push</p>
                                        <p className="text-[10px] text-slate-400">Recibir alertas en tiempo real</p>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full p-0.5 transition-all ${editForm.pushNotifications ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <div className={`size-4 bg-white rounded-full transition-all ${editForm.pushNotifications ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Resumen Semanal</p>
                                        <p className="text-[10px] text-slate-400">Recibir resumen por correo</p>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full p-0.5 transition-all ${editForm.weeklySummary ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <div className={`size-4 bg-white rounded-full transition-all ${editForm.weeklySummary ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intereses de Espacio</p>
                                    <div className="flex flex-wrap gap-2">
                                        {memberTags.map((tag: string) => (
                                            <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit User Modal (Screenshot 2) */}
            {isEditing && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fade">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[90vh]">
                        {/* Modal Header */}
                        <header className="p-8 sm:p-10 border-b border-slate-100 flex justify-between items-start shrink-0">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Edit User</h3>
                                <p className="text-xs text-slate-400 font-medium">Update profile information for {displayName}.</p>
                            </div>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="size-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all border-none bg-transparent cursor-pointer"
                            >
                                <Icon name="close" />
                            </button>
                        </header>

                        {/* Modal Body */}
                        <div className="p-8 sm:p-10 overflow-y-auto no-scrollbar space-y-8 flex-1">
                            {/* Profile Picture with Edit Icon */}
                            <div className="flex justify-center">
                                <div className="relative size-28 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                                    <img
                                        src={member.image || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${member.id}`}
                                        alt={displayName}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                        <div className="size-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                                            <Icon name="edit" className="!text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Personal Information */}
                            <div className="space-y-6">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">PERSONAL INFORMATION</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                                        <input 
                                            type="email" 
                                            value={editForm.email}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                                        <input 
                                            type="text" 
                                            value={editForm.phone}
                                            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company</label>
                                        <input 
                                            type="text" 
                                            value={editForm.company}
                                            onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</label>
                                    <input 
                                        type="text" 
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            {/* Section: Preferences */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">PREFERENCES</p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">Push Notifications</p>
                                            <p className="text-[10px] text-slate-400">Receive real-time alerts for booking changes.</p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, pushNotifications: !editForm.pushNotifications })}
                                            className={`w-12 h-6 rounded-full p-1 transition-all ${editForm.pushNotifications ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                        >
                                            <div className={`size-4 bg-white rounded-full transition-transform ${editForm.pushNotifications ? 'translate-x-6' : ''}`}></div>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">Weekly Summary</p>
                                            <p className="text-[10px] text-slate-400">Get an email digest of your workspace usage.</p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, weeklySummary: !editForm.weeklySummary })}
                                            className={`w-12 h-6 rounded-full p-1 transition-all ${editForm.weeklySummary ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                        >
                                            <div className={`size-4 bg-white rounded-full transition-transform ${editForm.weeklySummary ? 'translate-x-6' : ''}`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <footer className="p-8 sm:p-10 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <button
                                type="button"
                                onClick={handleDeleteMember}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <Icon name="delete" className="!text-base" />
                                Delete User
                            </button>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="h-12 px-6 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="h-12 px-6 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 border-none cursor-pointer"
                                >
                                    {saving ? (
                                        <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        'Update Profile'
                                    )}
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>
            )}

            {/* Plan Assignment Modal Overhaul */}
            {isPlanModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fade">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPlanModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-100">
                        <header className="p-8 sm:p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 opacity-60">Architectural Tier Selection</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
                                    {membership ? 'Evolución' : 'Asignación'} Plan
                                </h3>
                            </div>
                            <button 
                                onClick={() => setIsPlanModalOpen(false)} 
                                className="size-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all border-none bg-transparent cursor-pointer"
                            >
                                <Icon name="close" />
                            </button>
                        </header>

                        <div className="p-8 sm:p-10 space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar">
                            {tiers.map(tier => {
                                const isSelected = selectedTierId === tier.id;
                                return (
                                    <button
                                        key={tier.id}
                                        onClick={() => setSelectedTierId(tier.id)}
                                        className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-slate-300 hover:bg-white text-slate-900'}`}
                                    >
                                        <div>
                                            <p className="text-lg font-black tracking-wide uppercase">{tier.name}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{tier.billing_cycle}</p>
                                        </div>
                                        <div>
                                            <span className="text-2xl font-black">${tier.price}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <footer className="p-8 sm:p-10 border-t border-slate-100 flex flex-col gap-3 bg-slate-50/50 shrink-0">
                            <button
                                onClick={handleUpdatePlan}
                                disabled={updatingPlan}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-md flex items-center justify-center gap-2 border-none cursor-pointer"
                            >
                                {updatingPlan ? <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : (
                                    <>
                                        <span>Confirmar Membresía</span>
                                        <Icon name="bolt" className="!text-lg" />
                                    </>
                                )}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberDetail;
