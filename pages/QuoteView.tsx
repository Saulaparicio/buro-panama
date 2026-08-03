import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { Quote } from '../types';
import { Icon } from '../components/ui/Icon';

// Helper to parse metadata
const parseMetadata = (notes: string | null) => {
    if (!notes) return {};
    try {
        return JSON.parse(notes);
    } catch (e) {
        return { description: notes };
    }
};

const QuoteView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepted, setAccepted] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        if (id) fetchQuote();
    }, [id]);

    const fetchQuote = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('quotes')
                .select('*, tenants(name, settings)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setQuote(data);
            if (data.status === 'accepted') setAccepted(true);
        } catch (err) {
            console.error('Error loading quote:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!quote) return;
        try {
            const { error } = await supabase
                .from('quotes')
                .update({ status: 'accepted' })
                .eq('id', quote.id);
            
            if (error) throw error;
            setAccepted(true);
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Error accepting quote:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="size-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Cargando Propuesta</p>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-24 text-center">
                <div className="size-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8">
                    <Icon name="error" className="!text-4xl" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-4">Propuesta no encontrada</h1>
                <p className="text-slate-500 max-w-md mb-8">El enlace puede haber expirado o la cotización fue eliminada.</p>
            </div>
        );
    }

    const meta = parseMetadata(quote.notes);
    const title = meta.description || "Propuesta Comercial";
    
    // Calculate expiration days
    const expirationDate = quote.valid_until ? new Date(quote.valid_until) : new Date(new Date(quote.created_at).getTime() + 15 * 24 * 60 * 60 * 1000);
    const today = new Date();
    const daysLeft = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    const statusText = accepted ? 'Aceptada' : (daysLeft < 0 ? 'Expirada' : 'Pendiente de Firma');
    const statusColor = accepted ? 'bg-emerald-100 text-emerald-800' : (daysLeft < 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800');
    
    const subtotal = quote.total;
    const taxRate = 0.07; // ITBMS 7%
    const tax = subtotal * taxRate;
    const finalTotal = subtotal + tax;

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 sm:px-12 font-sans quote-print-container">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .quote-print-container { background-color: white !important; padding: 0 !important; }
                    .print-shadow-none { box-shadow: none !important; border: 1px solid #E2E8F0 !important; }
                    .print-text-black { color: black !important; }
                    .print-bg-blue { background-color: #4F46E5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
            
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT COLUMN */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Title Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 print-shadow-none relative overflow-hidden">
                        <Icon name="draw" className="absolute -right-6 -top-6 !text-9xl text-slate-50 opacity-50 rotate-12 pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold mb-6 ${statusColor} print-bg-blue print-text-black`}>
                                <Icon name={accepted ? 'task_alt' : 'pending_actions'} className="!text-sm" />
                                {statusText}
                            </div>
                            
                            <h1 className="text-3xl font-black text-slate-900 mb-4 leading-tight">{title}</h1>
                            
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {daysLeft >= 0 && !accepted 
                                    ? `Esta propuesta vence en ${daysLeft} días. Por favor, revise los detalles a continuación para proceder con la aceptación digital.` 
                                    : (accepted ? 'Esta propuesta ya ha sido firmada y aceptada.' : 'Esta propuesta ha expirado.')}
                            </p>
                        </div>
                    </div>

                    {/* Client Info Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 print-shadow-none">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                            <Icon name="person" className="text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-900">Información del Cliente</h3>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                <Icon name="domain" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{quote.client_name}</h4>
                                <p className="text-xs text-slate-500">ID: {quote.client_email}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Icon name="mail" className="text-indigo-500 !text-lg" />
                                {quote.client_email}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Icon name="location_on" className="text-indigo-500 !text-lg" />
                                Ciudad de Panamá, Panamá
                            </div>
                        </div>
                    </div>

                    {/* Provider Info Card */}
                    <div className="bg-indigo-50/50 rounded-3xl p-8 shadow-sm border border-indigo-100/50 print-shadow-none">
                        <div className="flex items-center gap-3 mb-6 border-b border-indigo-100 pb-4">
                            {(quote as any).tenants?.settings?.logo_url ? (
                                <img src={(quote as any).tenants.settings.logo_url} alt="Logo" className="max-h-8 max-w-24 object-contain" />
                            ) : (
                                <Icon name="storefront" className="text-indigo-400" />
                            )}
                            <h3 className="text-sm font-bold text-slate-900">Prestador de Servicios</h3>
                        </div>
                        
                        <h4 className="font-bold text-indigo-900 mb-1">{(quote as any).tenants?.name || 'BURÓ Panamá'}</h4>
                        <p className="text-xs text-indigo-700/70 mb-6">Coworking & Workspace Solutions</p>
                        
                        <div className="space-y-3 text-sm text-indigo-900/80">
                            <p>Obarrio, Calle 53 Este</p>
                            <p>+507 833-0000</p>
                            <p>hola@buropanama.com</p>
                        </div>
                    </div>

                    {/* Terms Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 print-shadow-none">
                        <div className="flex items-center gap-3 mb-6">
                            <Icon name="gavel" className="text-indigo-600" />
                            <h3 className="text-sm font-bold text-slate-900">Términos y Condiciones</h3>
                        </div>
                        
                        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                            <p><strong>1. Vigencia:</strong> Esta cotización tiene una validez de 15 días calendario a partir de su emisión.</p>
                            <p><strong>2. Facturación:</strong> Los servicios se facturan por mes anticipado. El primer pago debe realizarse antes de la fecha de inicio del contrato.</p>
                            <p><strong>3. Permanencia:</strong> El contrato propuesto tiene una duración mínima acorde a lo acordado con el ejecutivo de ventas.</p>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Total & Action Card */}
                    <div 
                        className="rounded-3xl p-10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-8 print-bg-blue print-text-black"
                        style={{ backgroundColor: '#13202E', color: (quote as any).tenants?.settings?.brand_color || '#FDE910' }}
                    >
                        <div>
                            <p className="text-sm font-bold tracking-wider mb-2 uppercase opacity-80">Total Inversión</p>
                            <div className="flex items-end gap-2">
                                <h2 className="text-5xl md:text-6xl font-black tracking-tighter">${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                <span className="font-bold text-xl mb-1.5 opacity-80">/mes</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 min-w-[200px] no-print">
                            {!accepted && (
                                <button 
                                    onClick={handleAccept}
                                    className="w-full bg-white font-bold py-4 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                    style={{ color: '#13202E' }}
                                >
                                    <Icon name="edit_document" className="!text-xl" />
                                    Aceptar y Firmar
                                </button>
                            )}
                            <button 
                                onClick={() => window.print()}
                                className="w-full bg-transparent border border-current font-bold py-4 px-6 rounded-xl transition-all hover:bg-white/10 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Icon name="download" className="!text-xl" />
                                Descargar PDF
                            </button>
                        </div>
                    </div>

                    {/* Services Summary Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print-shadow-none">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">Resumen de Servicios</h3>
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">Período Mensual</span>
                        </div>
                        
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-4 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servicio</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Precio Unit.</th>
                                        <th className="py-4 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {quote.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                                        <Icon name="widgets" className="!text-xl" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{item.description}</p>
                                                        <p className="text-[11px] text-slate-500 mt-1">Servicio Premium</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 text-center text-slate-600 font-medium">{item.quantity}</td>
                                            <td className="py-6 px-4 text-right text-slate-600 font-medium">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="py-6 px-8 text-right text-slate-900 font-black">${(item.quantity * item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Footer */}
                        <div className="bg-slate-50/50 p-8 flex flex-col items-end gap-3 border-t border-slate-100">
                            <div className="flex justify-between w-full max-w-[300px] text-sm text-slate-600 font-medium">
                                <span>Subtotal</span>
                                <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-[300px] text-sm text-slate-600 font-medium">
                                <span>ITBMS (7%)</span>
                                <span>${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-[300px] text-base font-black text-indigo-600 mt-2 pt-4 border-t border-slate-200">
                                <span>Total Mensual</span>
                                <span>${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Image Card */}
                    <div className="relative rounded-3xl overflow-hidden h-[240px] shadow-sm no-print">
                        <img 
                            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200&h=400" 
                            alt="Workspace" 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40"></div>
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 text-center max-w-sm shadow-xl">
                                <div className="size-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Icon name="verified_user" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">Workspace de Confianza</h4>
                                <p className="text-xs text-slate-600">Únete a cientos de empresas que escalan sus operaciones con BURÓ Panamá.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-slide-up">
                        <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Icon name="check_circle" className="!text-4xl" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">¡Propuesta Aceptada!</h2>
                        <p className="text-slate-500 mb-8">Gracias por confiar en BURÓ Panamá. Un representante se pondrá en contacto contigo pronto.</p>
                        
                        <div className="flex gap-3">
                            <button onClick={() => setShowSuccessModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors cursor-pointer">Cerrar</button>
                            <button onClick={() => window.print()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer">Descargar PDF</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteView;
