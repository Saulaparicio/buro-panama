import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { Member, MembershipTier } from '../../types';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import { useTenant } from '../../contexts/TenantContext';
import { Icon } from '../../components/ui/Icon';
import { LabeledProgressIndicator } from '../../components/ui/LabeledProgressIndicator';

const ManageMembers: React.FC = () => {
    const { tenant } = useTenant();
    const navigate = useNavigate();
    const [members, setMembers] = useState<Member[]>([]);
    const [tiers, setTiers] = useState<MembershipTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [adding, setAdding] = useState(false);

    // Form states matching Screenshot 3
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        role: 'member', // Designation / Role
    });
    const [activeAccount, setActiveAccount] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [permissions, setPermissions] = useState({
        booking: true,
        guest: false
    });
    const [tags, setTags] = useState<string[]>(['Design', 'Tech']);
    const [newTagInput, setNewTagInput] = useState('');
    const [customAvatarUrl, setCustomAvatarUrl] = useState('');

    useEffect(() => {
        if (tenant?.id) {
            fetchMembers();
            fetchTiers();
        }
    }, [tenant?.id]);

    const getNanoBananaAvatar = (index: string | number) => {
        return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${index}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    };

    const fetchTiers = async () => {
        if (!tenant?.id) return;
        try {
            const { data } = await supabase
                .from('membership_tiers')
                .select('*')
                .eq('tenant_id', tenant.id)
                .eq('is_active', true);
            if (data) {
                setTiers(data);
                if (data.length > 0) setSelectedPlanId(data[0].id);
            }
        } catch (err) {
            console.error('Error fetching tiers:', err);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            // 1. Insert Profile
            const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([
                    {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        company: formData.company,
                        role: formData.role,
                        status: activeAccount ? 'active' : 'inactive',
                        credits: 100, // Default signup credits
                        image: customAvatarUrl || getNanoBananaAvatar(formData.name),
                        tenant_id: tenant?.id,
                        settings: {
                            interests: tags,
                            permissions: {
                                booking: permissions.booking,
                                guest: permissions.guest
                            }
                        }
                    }
                ])
                .select()
                .single();

            if (insertError) throw insertError;

            // 2. Insert Membership if plan selected
            if (selectedPlanId && newProfile) {
                const { error: memError } = await supabase
                    .from('memberships')
                    .insert([{
                        profile_id: newProfile.id,
                        tier_id: selectedPlanId,
                        start_date: new Date().toISOString(),
                        status: 'active',
                        tenant_id: tenant?.id
                    }]);
                if (memError) throw memError;
            }

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#1e293b', '#ffffff']
            });

            toast.success('SOCIO CREADO EXITOSAMENTE');
            setIsAddModalOpen(false);
            
            // Reset
            setFormData({
                name: '',
                email: '',
                phone: '',
                company: '',
                role: 'member',
            });
            setActiveAccount(true);
            setPermissions({ booking: true, guest: false });
            setTags(['Design', 'Tech']);
            setCustomAvatarUrl('');
            
            fetchMembers();
        } catch (err: any) {
            console.error('Error saving member:', err);
            toast.error(err.message || 'ERROR EN EL REGISTRO');
        } finally {
            setAdding(false);
        }
    };

    const fetchMembers = async () => {
        if (!tenant?.id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('name', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error('Error loading members:', err);
            toast.error('Error al cargar la red de miembros.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = () => {
        if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
            setTags([...tags, newTagInput.trim()]);
            setNewTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const filteredMembers = members.filter(member => {
        const matchesSearch =
            (member.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (member.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (member.company?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesRole = filterRole === 'all' || member.role === filterRole;

        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-12 animate-fade pb-32 max-w-[1600px] mx-auto px-6 md:px-12">
            {/* SaaS Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            <Icon name="grid_view" className="!text-lg" />
                            Retícula
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            <Icon name="format_list_bulleted" className="!text-lg" />
                            Lista
                        </button>
                    </div>
                    
                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
                    
                    <p className="text-sm text-slate-400 font-medium hidden md:block">
                        {filteredMembers.length} identidades registradas
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-indigo-200 border-none cursor-pointer"
                    >
                        <Icon name="person_add" className="!text-lg" />
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Modern Search & Filters Area */}
            <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 relative w-full">
                        <Icon name="search" className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 !text-xl" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-16 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700 placeholder:text-slate-300"
                        />
                    </div>

                    <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100 w-full md:w-auto">
                        {['all', 'admin', 'member'].map(role => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`px-8 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filterRole === role
                                    ? 'bg-white text-slate-900 shadow-md'
                                    : 'text-slate-400 hover:text-slate-700'
                                    }`}
                            >
                                {role === 'all' ? 'Todos' : role === 'admin' ? 'Admins' : 'Miembros'}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Community Collective Display */}
            {loading ? (
                <div className="py-48 flex flex-col items-center justify-center gap-12">
                    <LabeledProgressIndicator labels={['Sincronizando Identidades...', 'Buscando miembros...', 'Actualizando directorio...']} intervalMs={1200} />
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="py-48 text-center bg-white rounded-[2rem] border-dashed border-2 border-slate-100 flex flex-col items-center justify-center gap-8">
                    <Icon name="person_search" className="!text-8xl font-thin text-slate-100" />
                    <div className="space-y-2">
                        <p className="text-2xl font-bold text-slate-300">Sin Coincidencias</p>
                        <p className="text-xs text-slate-300 font-medium">Prueba con otros términos de búsqueda</p>
                    </div>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade">
                    {filteredMembers.map((member) => {
                        const isAdmin = member.role?.toLowerCase().includes('admin');
                        const isPremium = member.role?.toLowerCase().includes('premium') || member.role?.toLowerCase().includes('director') || member.role?.toLowerCase().includes('lead');
                        
                        return (
                            <div
                                key={member.id}
                                onClick={() => navigate(`/admin/members/${member.id}`)}
                                className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                                
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="size-20 bg-slate-50 rounded-2xl overflow-hidden border-2 border-white shadow-md transition-all duration-500">
                                        <img
                                            src={member.image || getNanoBananaAvatar(member.id)}
                                            alt={member.name}
                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                        />
                                    </div>

                                    <div className={`px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase ${
                                        isAdmin ? 'bg-indigo-50 text-indigo-600' : 
                                        isPremium ? 'bg-emerald-50 text-emerald-600' : 
                                        'bg-slate-50 text-slate-400'
                                    }`}>
                                        {isAdmin ? 'Administrador' : isPremium ? 'Premium' : 'Miembro'}
                                    </div>
                                </div>

                                <div className="space-y-1 mb-8 relative z-10">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                                        {member.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium truncate">
                                        {member.email}
                                    </p>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                                        <Icon name="corporate_fare" className="!text-lg text-slate-400" />
                                        <span className="text-[11px] font-bold text-slate-500 truncate uppercase tracking-tight">
                                            {member.company || 'Buró Panamá'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`size-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {member.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <Icon name="arrow_forward_ios" className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-fade">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] uppercase font-bold tracking-widest text-slate-400 border-b border-slate-100">
                                    <th className="px-10 py-6">Cliente</th>
                                    <th className="px-10 py-6">Empresa</th>
                                    <th className="px-10 py-6">Rol</th>
                                    <th className="px-10 py-6">Estado</th>
                                    <th className="px-10 py-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredMembers.map(member => (
                                    <tr
                                        key={member.id}
                                        className="hover:bg-slate-50/50 transition-all duration-300 cursor-pointer group"
                                        onClick={() => navigate(`/admin/members/${member.id}`)}
                                    >
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                                    <img
                                                        src={member.image || getNanoBananaAvatar(member.id)}
                                                        alt=""
                                                        className="w-full h-full object-cover transition-all group-hover:scale-110"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{member.name}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{member.company || 'Independiente'}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                                                member.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 
                                                'bg-slate-50 text-slate-400'
                                            }`}>
                                                {member.role || 'Miembro'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`size-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{member.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-md transition-all text-slate-300 hover:text-indigo-600">
                                                <Icon name="chevron_right" className="!text-xl" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create New User Modal (Split-Pane - Screenshot 3) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fade">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-100 max-h-[90vh]">
                        {/* Left Side: General Profile Form */}
                        <div className="flex-1 p-8 sm:p-12 overflow-y-auto no-scrollbar space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Create New User</h3>
                                    <p className="text-xs text-slate-400 font-medium">Onboard a new member to the Hub Central workspace.</p>
                                </div>
                                <button 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="md:hidden size-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400"
                                >
                                    <Icon name="close" />
                                </button>
                            </div>

                            {/* Profile Picture Upload Zone */}
                            <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                                <div className="size-20 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-white text-slate-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-600 transition-all shrink-0">
                                    <Icon name="add_a_photo" className="!text-2xl mb-1" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">UPLOAD</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-500">Profile Picture</p>
                                    <p className="text-[10px] text-slate-400 leading-normal">Recommended: 400x400px JPG or PNG. Max size 2MB.</p>
                                    <button 
                                        type="button"
                                        onClick={() => setCustomAvatarUrl(`https://api.dicebear.com/7.x/adventurer/svg?seed=${Math.random()}`)}
                                        className="text-[10px] font-bold text-indigo-600 hover:underline border-none bg-transparent p-0 cursor-pointer"
                                    >
                                        Import from LinkedIn
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleAddMember} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. Julian Casablancas"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="julian@company.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="+1 (555) 000-0000"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company</label>
                                        <input 
                                            type="text" 
                                            placeholder="Agency Inc."
                                            value={formData.company}
                                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Designation / Role</label>
                                    <input 
                                        type="text" 
                                        placeholder="Creative Director"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Right Side: Account Settings & Perks Form */}
                        <div className="w-full md:w-[420px] bg-slate-50 border-l border-slate-100 p-8 sm:p-12 overflow-y-auto no-scrollbar space-y-8 flex flex-col justify-between">
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="hidden md:flex size-10 rounded-full hover:bg-slate-200 items-center justify-center text-slate-400 self-end transition-all"
                            >
                                <Icon name="close" />
                            </button>

                            <div className="space-y-8">
                                {/* Active Account Switcher */}
                                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Active Account</p>
                                        <p className="text-[10px] text-slate-400">Enable immediate access to tools.</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setActiveAccount(!activeAccount)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all ${activeAccount ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`size-4 bg-white rounded-full transition-transform ${activeAccount ? 'translate-x-6' : ''}`}></div>
                                    </button>
                                </div>

                                {/* Membership Plan Selector */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Membership Plan</label>
                                    <select 
                                        value={selectedPlanId}
                                        onChange={e => setSelectedPlanId(e.target.value)}
                                        className="w-full h-12 px-4 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">No Plan (Guest)</option>
                                        {tiers.map(tier => (
                                            <option key={tier.id} value={tier.id}>{tier.name} - ${tier.price}/mo</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Permissions & Access Checklist */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permissions & Access</label>
                                    
                                    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <input 
                                            type="checkbox" 
                                            checked={permissions.booking} 
                                            onChange={e => setPermissions({ ...permissions, booking: e.target.checked })}
                                            className="size-5 rounded border-slate-300 text-indigo-600 mt-0.5"
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">Meeting Room Booking</p>
                                            <p className="text-[10px] text-slate-400">Allow user to reserve shared spaces.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <input 
                                            type="checkbox" 
                                            checked={permissions.guest} 
                                            onChange={e => setPermissions({ ...permissions, guest: e.target.checked })}
                                            className="size-5 rounded border-slate-300 text-indigo-600 mt-0.5"
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">Guest Invitations</p>
                                            <p className="text-[10px] text-slate-400">Permission to invite external guests.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Interests / Tags */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interests / Tags</label>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wide">
                                                {tag}
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="size-4 hover:bg-indigo-100 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer"
                                                >
                                                    <Icon name="close" className="!text-xs" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Add custom tag..."
                                            value={newTagInput}
                                            onChange={e => setNewTagInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                                            className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleAddTag}
                                            className="h-9 px-4 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg border-none cursor-pointer"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex items-center gap-4 pt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 h-12 bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border-none cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddMember}
                                    disabled={adding}
                                    className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 border-none cursor-pointer"
                                >
                                    {adding ? (
                                        <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>Create User</span>
                                            <Icon name="arrow_forward" className="!text-sm" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMembers;
