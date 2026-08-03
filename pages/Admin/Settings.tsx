import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useTenant } from '../../contexts/TenantContext';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Icon } from '../../components/ui/Icon';

const Settings: React.FC = () => {
    const { tenant } = useTenant();
    const [activeTab, setActiveTab] = useState<'general' | 'smtp'>('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [showTestModal, setShowTestModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form states
    const [generalData, setGeneralData] = useState({
        name: '',
        brandColor: '#FDE910',
        logoUrl: ''
    });

    const [smtpData, setSmtpData] = useState({
        host: '',
        port: 587,
        username: '',
        password: '',
        senderEmail: '',
        senderName: ''
    });

    useEffect(() => {
        if (tenant) {
            loadSettings();
        }
    }, [tenant]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', tenant?.id)
                .single();

            if (error) throw error;

            if (data) {
                const settings = data.settings || {};

                setGeneralData({
                    name: data.name || '',
                    brandColor: settings.brand_color || '#FDE910',
                    logoUrl: settings.logo_url || ''
                });

                const smtp = settings.smtp || {};

                setSmtpData({
                    host: smtp.host || '',
                    port: smtp.port || 587,
                    username: smtp.username || '',
                    password: smtp.password || '',
                    senderEmail: smtp.sender_email || '',
                    senderName: smtp.sender_name || ''
                });
            }
        } catch (err: any) {
            console.error('Error loading settings:', err);
            toast.error('Error al cargar la configuración global.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Get current settings object to merge
            const { data: currentTenant } = await supabase
                .from('tenants')
                .select('settings')
                .eq('id', tenant?.id)
                .single();

            const mergedSettings = {
                ...(currentTenant?.settings || {}),
                brand_color: generalData.brandColor,
                logo_url: generalData.logoUrl
            };

            const { error } = await supabase
                .from('tenants')
                .update({
                    name: generalData.name,
                    settings: mergedSettings
                })
                .eq('id', tenant?.id);

            if (error) throw error;

            toast.success('CONFIGURACIÓN GENERAL GUARDADA');
            confetti({
                particleCount: 100,
                spread: 60,
                colors: [generalData.brandColor, '#11171D']
            });
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar los ajustes generales.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSMTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Get current settings object to merge
            const { data: currentTenant } = await supabase
                .from('tenants')
                .select('settings')
                .eq('id', tenant?.id)
                .single();

            const mergedSettings = {
                ...(currentTenant?.settings || {}),
                smtp: {
                    host: smtpData.host,
                    port: smtpData.port,
                    username: smtpData.username,
                    password: smtpData.password,
                    sender_email: smtpData.senderEmail,
                    sender_name: smtpData.senderName
                }
            };

            const { error } = await supabase
                .from('tenants')
                .update({
                    settings: mergedSettings
                })
                .eq('id', tenant?.id);

            if (error) throw error;

            toast.success('CONFIGURACIÓN SMTP ACTUALIZADA');
            
            // Also notify user that they can now test
            confetti({
                particleCount: 50,
                spread: 40,
                colors: ['#3d4ad8', '#11171D']
            });
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar configuración SMTP.');
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmail) {
            toast.error('Ingresa una dirección de correo válida.');
            return;
        }

        setTesting(true);
        try {
            // We invoke the 'send-email' edge function with a welcome type to test delivery.
            // Under a verified custom SMTP server, this will route through the SMTP credentials saved in the tenant settings.
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    type: 'welcome',
                    to: testEmail,
                    memberName: 'Usuario de Prueba SMTP',
                    tenantId: tenant?.id,
                    smtp: {
                        host: smtpData.host,
                        port: smtpData.port,
                        username: smtpData.username,
                        password: smtpData.password,
                        sender_email: smtpData.senderEmail,
                        sender_name: smtpData.senderName
                    }
                }
            });

            if (error) throw error;
            if (data && data.error) throw new Error(data.error);

            toast.success('¡Correo de prueba enviado con éxito! Revisa tu bandeja de entrada.');
            setShowTestModal(false);
        } catch (err: any) {
            console.error('SMTP test error:', err);
            toast.error(err.message || 'Error al enviar el correo de prueba. Revisa los datos de SMTP.');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="py-48 flex flex-col items-center justify-center gap-12">
                <div className="relative size-32">
                    <div className="absolute inset-0 border-[1px] border-slate-100 rounded-full scale-150"></div>
                    <div className="absolute inset-0 border-t-2 border-[var(--primary)] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="settings" className="!text-4xl text-slate-200 animate-pulse" />
                    </div>
                </div>
                <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Cargando Configuración Global</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 animate-fade pb-32 px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-900 text-white shadow-lg flex items-center gap-2">
                            <Icon name="settings" className="!text-lg" />
                            Configuración
                        </div>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
                    <p className="text-sm text-slate-400 font-medium hidden md:block">
                        Administración global de {tenant?.name}
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-100">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border-none ${activeTab === 'general' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('smtp')}
                        className={`px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border-none ${activeTab === 'smtp' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
                    >
                        Servidor SMTP
                    </button>
                </div>
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 max-w-3xl mx-auto space-y-8 animate-slide">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ajustes del Workspace</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Configura la identidad visual y marca de tu entorno de trabajo.</p>
                    </div>

                    <form onSubmit={handleSaveGeneral} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre de la Organización</label>
                                <input
                                    type="text"
                                    required
                                    value={generalData.name}
                                    onChange={(e) => setGeneralData({ ...generalData, name: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                    placeholder="Nombre del coworking"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Color de Marca (Principal)</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="color"
                                        value={generalData.brandColor}
                                        onChange={(e) => setGeneralData({ ...generalData, brandColor: e.target.value })}
                                        className="size-12 border border-slate-200 rounded-xl cursor-pointer p-0 bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={generalData.brandColor}
                                        onChange={(e) => setGeneralData({ ...generalData, brandColor: e.target.value })}
                                        className="border border-slate-200 rounded-xl p-3 text-xs font-bold w-32 uppercase"
                                    />
                                    <div 
                                        className="h-8 w-8 rounded-full border border-slate-200" 
                                        style={{ backgroundColor: generalData.brandColor }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Enlace del Logotipo (URL) o Subir Archivo</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={generalData.logoUrl}
                                        onChange={(e) => setGeneralData({ ...generalData, logoUrl: e.target.value })}
                                        className="flex-1 border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                        placeholder="https://example.com/logo.png"
                                    />
                                    <label className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-xl cursor-pointer transition-colors border border-slate-200" title="Subir desde PC">
                                        <Icon name="upload" className="!text-lg" />
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                if (file.size > 800 * 1024) {
                                                    toast.error('La imagen es muy grande. Máximo 800KB sugerido.');
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    if (event.target?.result) {
                                                        setGeneralData(prev => ({ ...prev, logoUrl: event.target!.result as string }));
                                                    }
                                                };
                                                reader.readAsDataURL(file);
                                            }}
                                        />
                                    </label>
                                </div>
                                {generalData.logoUrl && (
                                    <div className="mt-4 p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-center">
                                        <img src={generalData.logoUrl} alt="Logo preview" className="max-h-16 object-contain max-w-[200px]" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none shadow-lg shadow-slate-200 flex items-center justify-center min-w-[140px]"
                            >
                                {saving ? 'Guardando...' : 'Guardar Ajustes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SMTP Tab */}
            {activeTab === 'smtp' && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 max-w-3xl mx-auto space-y-8 animate-slide">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Servidor de Correo SMTP</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Configura las credenciales SMTP para el envío global de notificaciones y cotizaciones.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowTestModal(true)}
                            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border border-slate-200 cursor-pointer flex items-center gap-2"
                        >
                            <Icon name="mail" className="!text-sm" />
                            Probar Conexión
                        </button>
                    </div>

                    <form onSubmit={handleSaveSMTP} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Servidor SMTP (Host)</label>
                                <input
                                    type="text"
                                    required
                                    value={smtpData.host}
                                    onChange={(e) => setSmtpData({ ...smtpData, host: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                                    placeholder="e.g. smtp.resend.com"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Puerto SMTP</label>
                                <input
                                    type="number"
                                    required
                                    value={smtpData.port}
                                    onChange={(e) => setSmtpData({ ...smtpData, port: parseInt(e.target.value) || 587 })}
                                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                                    placeholder="e.g. 587"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Usuario SMTP</label>
                                <input
                                    type="text"
                                    required
                                    value={smtpData.username}
                                    onChange={(e) => setSmtpData({ ...smtpData, username: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                                    placeholder="e.g. resend"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contraseña SMTP / API Key</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={smtpData.password}
                                        onChange={(e) => setSmtpData({ ...smtpData, password: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl p-3 pr-10 text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                                        placeholder="API Key o Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                                    >
                                        <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="!text-lg" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Remitente</label>
                                <input
                                    type="text"
                                    required
                                    value={smtpData.senderName}
                                    onChange={(e) => setSmtpData({ ...smtpData, senderName: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                                    placeholder="e.g. BURÓ Panamá"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email de Envío (Remitente)</label>
                                <input
                                    type="email"
                                    required
                                    value={smtpData.senderEmail}
                                    onChange={(e) => setSmtpData({ ...smtpData, senderEmail: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                                    placeholder="e.g. onboarding@resend.dev"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none shadow-lg shadow-slate-200 flex items-center justify-center min-w-[140px]"
                            >
                                {saving ? 'Guardando...' : 'Guardar SMTP'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Test Connection Modal */}
            {showTestModal && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="modal-container max-w-md !rounded-[2.5rem] shadow-2xl p-10 bg-white border border-slate-100">
                        <div className="size-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-inner mb-6">
                            <Icon name="mark_email_read" className="!text-3xl" />
                        </div>

                        <div className="space-y-2 text-center mb-6">
                            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">Probar Servidor SMTP</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                Enviaremos un correo de bienvenida de prueba para validar la entrega.
                            </p>
                        </div>

                        <form onSubmit={handleSendTestEmail} className="space-y-6">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest text-left mb-1.5">Dirección de Destino</label>
                                <input
                                    type="email"
                                    required
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={testing}
                                    className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-none cursor-pointer"
                                >
                                    {testing ? (
                                        <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Icon name="send" className="!text-lg" />
                                    )}
                                    {testing ? 'PROBANDO...' : 'ENVIAR CORREO PRUEBA'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTestModal(false)}
                                    className="w-full h-12 bg-transparent text-slate-400 hover:text-slate-600 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all border-none cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
