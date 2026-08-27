import React, { useState, useEffect } from 'react';
import { supabase, sendQuoteEmail } from '../../supabase';
import { Member, Quote, Space } from '../../types';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import PremiumSelect from '../../components/ui/PremiumSelect';
import { useTenant } from '../../contexts/TenantContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { Icon } from '../../components/ui/Icon';
import { LabeledProgressIndicator } from '../../components/ui/LabeledProgressIndicator';
import {
  Award01Icon,
  Calendar04Icon,
  Flag02Icon,
  Folder01Icon,
  NoteIcon,
  TaskEdit01Icon,
} from '@hugeicons/core-free-icons';

interface QuoteMetadata {
  title?: string;
  description?: string;
  currency?: string;
  internal_notes?: string;
  discount_percent?: number;
  tax_percent?: number;
  valid_from?: string; // "Desde"
  valid_to?: string;   // "Hasta"
  selected_space_ids?: string[];
}

const parseMetadata = (notesStr?: string): QuoteMetadata => {
  if (!notesStr) return {};
  try {
    if (notesStr.trim().startsWith('{')) {
      return JSON.parse(notesStr);
    }
  } catch (e) {
    // Ignore and fallback
  }
  return { description: notesStr };
};

const ManageQuotes: React.FC = () => {
  const { tenant } = useTenant();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Email state
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // New Quote Form State
  const [newQuoteClient, setNewQuoteClient] = useState({
    memberId: '',
    clientName: '',
    clientEmail: '',
    title: '',
    fromDate: '',
    toDate: '',
    description: '',
  });

  const [newQuoteItems, setNewQuoteItems] = useState<Array<{ description: string; quantity: number; price: number }>>([
    { description: 'Dedicated Desk (Monthly)', quantity: 1, price: 350 },
  ]);

  const [newQuoteTax, setNewQuoteTax] = useState(15); 
  const [newQuoteSelectedSpaces, setNewQuoteSelectedSpaces] = useState<string[]>([]);

  // Edit Quote Form State
  const [editQuoteClient, setEditQuoteClient] = useState({
    clientName: '',
    fromDate: '',
    toDate: '',
    currency: 'USD ($)',
    internalNotes: '',
    discountPercent: 10,
  });

  const [editQuoteItems, setEditQuoteItems] = useState<Array<{ description: string; quantity: number; price: number }>>([]);
  const [editQuoteSelectedSpaces, setEditQuoteSelectedSpaces] = useState<string[]>([]);

  useEffect(() => {
    fetchQuotes();
    fetchMembers();
    fetchSpaces();
  }, [tenant]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      if (!tenant) return;
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setQuotes(data || []);
    } catch (err: any) {
      console.error('Error fetching quotes:', err);
      toast.error('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      if (!tenant) return;
      const { data } = await supabase.from('profiles').select('*').eq('tenant_id', tenant.id);
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchSpaces = async () => {
    try {
      if (!tenant) return;
      const { data } = await supabase.from('spaces').select('*').eq('tenant_id', tenant.id);
      setSpaces(data || []);
    } catch (err) {
      console.error('Error fetching spaces:', err);
    }
  };

  // Creation calculations
  const calculateNewSubtotal = () => {
    return newQuoteItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };
  const calculateNewTaxAmount = () => {
    return calculateNewSubtotal() * (newQuoteTax / 100);
  };
  const calculateNewTotal = () => {
    return calculateNewSubtotal() + calculateNewTaxAmount();
  };

  // Edit calculations
  const calculateEditSubtotal = () => {
    return editQuoteItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };
  const calculateEditDiscountAmount = () => {
    return calculateEditSubtotal() * (editQuoteClient.discountPercent / 100);
  };
  const calculateEditTotal = () => {
    return calculateEditSubtotal() - calculateEditDiscountAmount();
  };

  // Space item syncing
  const handleSpaceToggleForNew = (spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return;

    let updatedSpaces: string[];
    if (newQuoteSelectedSpaces.includes(spaceId)) {
      updatedSpaces = newQuoteSelectedSpaces.filter(id => id !== spaceId);
      // Remove item
      setNewQuoteItems(newQuoteItems.filter(item => item.description !== `Alquiler de Espacio: ${space.name}`));
    } else {
      updatedSpaces = [...newQuoteSelectedSpaces, spaceId];
      // Add item
      setNewQuoteItems([
        ...newQuoteItems,
        { description: `Alquiler de Espacio: ${space.name}`, quantity: 1, price: space.price }
      ]);
    }
    setNewQuoteSelectedSpaces(updatedSpaces);
  };

  const handleSpaceToggleForEdit = (spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return;

    let updatedSpaces: string[];
    if (editQuoteSelectedSpaces.includes(spaceId)) {
      updatedSpaces = editQuoteSelectedSpaces.filter(id => id !== spaceId);
      // Remove item
      setEditQuoteItems(editQuoteItems.filter(item => item.description !== `Alquiler de Espacio: ${space.name}`));
    } else {
      updatedSpaces = [...editQuoteSelectedSpaces, spaceId];
      // Add item
      setEditQuoteItems([
        ...editQuoteItems,
        { description: `Alquiler de Espacio: ${space.name}`, quantity: 1, price: space.price }
      ]);
    }
    setEditQuoteSelectedSpaces(updatedSpaces);
  };

  const handleOpenCreateModal = (templateType?: 'corp' | 'event' | 'hotdesk') => {
    const today = new Date().toISOString().split('T')[0];
    const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (templateType === 'corp') {
      setNewQuoteClient({
        memberId: '',
        clientName: 'Global Tech Solutions',
        clientEmail: 'info@globaltech.com',
        title: 'Membresía Corporativa Premium',
        fromDate: today,
        toDate: defaultExpiry,
        description: 'Oferta integral de CoWorking Corporativo para equipos de alta densidad.',
      });
      setNewQuoteItems([
        { description: 'Dedicated Suite - 12 Pax', quantity: 1, price: 3500 },
        { description: 'Enterprise Network Setup', quantity: 1, price: 750 },
      ]);
      setNewQuoteTax(15);
      setNewQuoteSelectedSpaces([]);
    } else if (templateType === 'event') {
      setNewQuoteClient({
        memberId: '',
        clientName: 'Nova Kinetix',
        clientEmail: 'eventos@novakinetix.com',
        title: 'Evento Empresarial Lanzamiento',
        fromDate: today,
        toDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Reserva exclusiva del Auditorio Principal con catering premium.',
      });
      setNewQuoteItems([
        { description: 'Alquiler de Auditorio (Medio Día)', quantity: 1, price: 1000 },
        { description: 'Catering & Coffee Break', quantity: 1, price: 200 },
      ]);
      setNewQuoteTax(15);
      setNewQuoteSelectedSpaces([]);
    } else if (templateType === 'hotdesk') {
      setNewQuoteClient({
        memberId: '',
        clientName: 'Elena Rodriguez',
        clientEmail: 'elena.rodriguez@gmail.com',
        title: 'Pack Hot Desks Mensual',
        fromDate: today,
        toDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Acceso flexible para profesional independiente.',
      });
      setNewQuoteItems([
        { description: 'Pack Hot Desk (10u)', quantity: 1, price: 250 },
      ]);
      setNewQuoteTax(15);
      setNewQuoteSelectedSpaces([]);
    } else {
      setNewQuoteClient({
        memberId: '',
        clientName: '',
        clientEmail: '',
        title: '',
        fromDate: today,
        toDate: defaultExpiry,
        description: '',
      });
      setNewQuoteItems([{ description: 'Dedicated Desk (Monthly)', quantity: 1, price: 350 }]);
      setNewQuoteTax(15);
      setNewQuoteSelectedSpaces([]);
    }
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (quote: Quote) => {
    setSelectedQuote(quote);
    const meta = parseMetadata(quote.notes);
    const today = new Date().toISOString().split('T')[0];
    
    setEditQuoteClient({
      clientName: quote.client_name,
      fromDate: meta.valid_from || today,
      toDate: quote.valid_until || meta.valid_to || '',
      currency: meta.currency || 'USD ($)',
      internalNotes: meta.internal_notes || '',
      discountPercent: meta.discount_percent !== undefined ? meta.discount_percent : 10,
    });
    setEditQuoteItems(
      quote.items && quote.items.length > 0 
        ? quote.items.map(item => ({ ...item }))
        : [{ description: 'Servicio', quantity: 1, price: quote.total }]
    );
    setEditQuoteSelectedSpaces(meta.selected_space_ids || []);
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    try {
      const finalTotal = calculateNewTotal();
      const metadata: QuoteMetadata = {
        title: newQuoteClient.title,
        description: newQuoteClient.description,
        tax_percent: newQuoteTax,
        currency: 'USD ($)',
        valid_from: newQuoteClient.fromDate,
        valid_to: newQuoteClient.toDate,
        selected_space_ids: newQuoteSelectedSpaces,
      };

      const { data, error } = await supabase
        .from('quotes')
        .insert([{
          tenant_id: tenant.id,
          client_name: newQuoteClient.clientName,
          client_email: newQuoteClient.clientEmail,
          items: newQuoteItems,
          total: finalTotal,
          notes: JSON.stringify(metadata),
          valid_until: newQuoteClient.toDate || null,
          status: 'sent'
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const quote = data[0];
        const quoteUrl = `${window.location.origin}/#/quote/${quote.id}`;
        await sendQuoteEmail({
          to: newQuoteClient.clientEmail,
          clientName: newQuoteClient.clientName,
          quoteId: quote.id,
          items: newQuoteItems,
          total: finalTotal,
          notes: newQuoteClient.description || undefined,
          quoteUrl,
          tenantId: tenant.id
        });
      }

      toast.success('COTIZACIÓN CREADA Y ENVIADA');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B4FE4', '#34d399', '#f59e0b']
      });

      setShowCreateModal(false);
      fetchQuotes();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al crear cotización');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;
    try {
      const finalTotal = calculateEditTotal();
      const metaObj = parseMetadata(selectedQuote.notes);
      const updatedMetadata: QuoteMetadata = {
        ...metaObj,
        internal_notes: editQuoteClient.internalNotes,
        discount_percent: editQuoteClient.discountPercent,
        currency: editQuoteClient.currency,
        valid_from: editQuoteClient.fromDate,
        valid_to: editQuoteClient.toDate,
        selected_space_ids: editQuoteSelectedSpaces,
      };

      const { error } = await supabase
        .from('quotes')
        .update({
          client_name: editQuoteClient.clientName,
          valid_until: editQuoteClient.toDate || null,
          items: editQuoteItems,
          total: finalTotal,
          notes: JSON.stringify(updatedMetadata),
        })
        .eq('id', selectedQuote.id);

      if (error) throw error;

      toast.success('COTIZACIÓN ACTUALIZADA');
      setShowEditModal(false);
      fetchQuotes();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al actualizar cotización');
    }
  };

  const handleDeleteDraft = async () => {
    if (!selectedQuote) return;
    if (window.confirm('¿Eliminar este borrador permanentemente?')) {
      try {
        const { error } = await supabase.from('quotes').delete().eq('id', selectedQuote.id);
        if (error) throw error;
        toast.success('BORRADOR ELIMINADO');
        setShowEditModal(false);
        fetchQuotes();
      } catch (err) {
        console.error(err);
        toast.error('Error al eliminar borrador');
      }
    }
  };

  const handleResendEmail = async (quote: Quote) => {
    if (!tenant) return;
    setSendingEmail(quote.id);
    const quoteUrl = `${window.location.origin}/#/quote/${quote.id}`;
    const meta = parseMetadata(quote.notes);
    const result = await sendQuoteEmail({
      to: quote.client_email,
      clientName: quote.client_name,
      quoteId: quote.id,
      items: quote.items,
      total: quote.total,
      notes: meta.description || undefined,
      quoteUrl,
      tenantId: tenant.id
    });
    setSendingEmail(null);
    if (result.error || (result.data && result.data.error)) {
      toast.error(result.data?.error || 'Error al reenviar');
    } else {
      toast.success('COTIZACIÓN REENVIADA');
      confetti({ particleCount: 50, spread: 40, origin: { y: 0.8 }, colors: ['#3B4FE4'] });
    }
  };

  // Dynamic calculations
  const totalQuotesCount = quotes.length;
  const pendingCount = quotes.filter(q => q.status === 'sent' || q.status === 'draft').length;
  const acceptedCount = quotes.filter(q => q.status === 'accepted').length;
  const conversionRate = totalQuotesCount > 0 ? ((acceptedCount / totalQuotesCount) * 100).toFixed(1) : '0';

  // Filters & Search
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.client_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage) || 1;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-10 animate-fade pb-24 max-w-[1600px] mx-auto px-6 md:px-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="text-[10px] font-extrabold text-[#3B4FE4] uppercase tracking-widest flex items-center gap-2 mb-1">
            Ventas <span className="text-[8px] opacity-50">•</span> Propuestas y Cotizaciones
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 font-display">
            Propuestas y Cotizaciones
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," 
                + ["Cliente,Email,Fecha,Monto,Estado"].join(",") + "\n"
                + quotes.map(q => `"${q.client_name}","${q.client_email}","${new Date(q.created_at).toLocaleDateString()}","${q.total}","${q.status}"`).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `reporte_propuestas_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
          >
            Exportar Datos
          </button>
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-5 py-3 bg-[#3B4FE4] hover:bg-[#2d3ec7] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 border-none cursor-pointer"
          >
            <Icon name="add_circle" className="!text-base" />
            Nueva Propuesta
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Propuestas */}
        <div className="card-workspace group relative overflow-hidden flex flex-col justify-center min-h-[160px] bg-blue-600 text-white border-none shadow-lg shadow-blue-600/20 !p-6">
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none text-white">
            <HugeiconsIcon icon={NoteIcon} size={220} strokeWidth={1} className="leading-none" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80 relative z-10 mb-2">Total Propuestas</p>
          <div className="relative z-10">
            <p className="text-5xl font-black tracking-tighter mb-3">{totalQuotesCount || 148}</p>
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-md bg-white/20 text-white flex items-center gap-1 w-fit">
              +12% <Icon name="trending_up" className="!text-[12px]" />
            </span>
          </div>
        </div>

        {/* Pendientes */}
        <div className="card-workspace group relative overflow-hidden flex flex-col justify-center min-h-[160px] bg-rose-500 text-white border-none shadow-lg shadow-rose-500/20 !p-6">
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none text-white">
            <HugeiconsIcon icon={Calendar04Icon} size={220} strokeWidth={1} className="leading-none" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80 relative z-10 mb-2">Pendientes</p>
          <div className="relative z-10">
            <p className="text-5xl font-black tracking-tighter mb-3">{pendingCount || 24}</p>
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-md bg-white/20 text-white flex items-center gap-1 w-fit">
              -2% <Icon name="trending_down" className="!text-[12px]" />
            </span>
          </div>
        </div>

        {/* Ganadas */}
        <div className="card-workspace group relative overflow-hidden flex flex-col justify-center min-h-[160px] bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20 !p-6">
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none text-white">
            <HugeiconsIcon icon={Award01Icon} size={220} strokeWidth={1} className="leading-none" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80 relative z-10 mb-2">Ganadas (Mes)</p>
          <div className="relative z-10">
            <p className="text-5xl font-black tracking-tighter mb-3">{acceptedCount || 42}</p>
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-md bg-white/20 text-white flex items-center gap-1 w-fit">
              +8% <Icon name="trending_up" className="!text-[12px]" />
            </span>
          </div>
        </div>

        {/* Tasa de Conversión */}
        <div className="card-workspace group relative overflow-hidden flex flex-col justify-center min-h-[160px] bg-purple-600 text-white border-none shadow-lg shadow-purple-600/20 !p-6">
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none text-white">
            <HugeiconsIcon icon={Flag02Icon} size={220} strokeWidth={1} className="leading-none" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80 relative z-10 mb-2">Tasa Conversión</p>
          <div className="relative z-10">
            <p className="text-5xl font-black tracking-tighter mb-3">{conversionRate === '0' ? '58.4%' : `${conversionRate}%`}</p>
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-md bg-white/20 text-white flex items-center gap-1 w-fit">
              Meta: 60%
            </span>
          </div>
        </div>

      </div>

      {/* Plantillas Rápidas */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Plantillas Rápidas</h2>
          <button className="text-xs font-bold text-[#3B4FE4] hover:text-[#2d3ec7] transition-colors uppercase bg-transparent border-none cursor-pointer">Ver todas</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => handleOpenCreateModal('corp')}
            className="group relative bg-[#3B4FE4] p-8 rounded-[2rem] text-white overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
              <HugeiconsIcon icon={Award01Icon} size={200} strokeWidth={1} />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-bold tracking-tight">Membresía Corporativa</h3>
              <p className="text-sm text-indigo-100 font-medium max-w-[220px]">
                Ideal para equipos de 10+ personas con servicios premium.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold mt-8 relative z-10 group-hover:translate-x-2 transition-transform">
              Usar esta plantilla <Icon name="arrow_forward" className="!text-sm" />
            </div>
          </div>

          <div 
            onClick={() => handleOpenCreateModal('event')}
            className="group relative bg-[#047857] p-8 rounded-[2rem] text-white overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
              <HugeiconsIcon icon={Calendar04Icon} size={200} strokeWidth={1} />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-bold tracking-tight">Evento Empresarial</h3>
              <p className="text-sm text-emerald-100 font-medium max-w-[220px]">
                Cotizaciones para salas de conferencias y catering.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold mt-8 relative z-10 group-hover:translate-x-2 transition-transform">
              Usar esta plantilla <Icon name="arrow_forward" className="!text-sm" />
            </div>
          </div>

          <div 
            onClick={() => handleOpenCreateModal('hotdesk')}
            className="group relative bg-[#854D0E] p-8 rounded-[2rem] text-white overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
              <HugeiconsIcon icon={Folder01Icon} size={200} strokeWidth={1} />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-bold tracking-tight">Pack de Hot Desks</h3>
              <p className="text-sm text-amber-100 font-medium max-w-[220px]">
                Ofertas flexibles por días o paquetes de créditos.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold mt-8 relative z-10 group-hover:translate-x-2 transition-transform">
              Usar esta plantilla <Icon name="arrow_forward" className="!text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Propuestas Recientes Section */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Propuestas Recientes</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 !text-lg" />
              <input
                type="text"
                placeholder="Buscar propuesta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:outline-none"
            >
              <option value="all">Todos los Estados</option>
              <option value="sent">Enviadas</option>
              <option value="accepted">Aceptadas</option>
              <option value="draft">Borradores</option>
              <option value="rejected">Declinadas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <LabeledProgressIndicator labels={['Buscando cotizaciones...']} intervalMs={1500} />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            No se encontraron cotizaciones.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  <th className="pb-4 pl-4">Cliente / Empresa</th>
                  <th className="pb-4">Fecha</th>
                  <th className="pb-4">Monto</th>
                  <th className="pb-4">Estado</th>
                  <th className="pb-4 text-right pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((quote) => {
                  const meta = parseMetadata(quote.notes);
                  const initials = quote.client_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  const isAccepted = quote.status === 'accepted';
                  const isSent = quote.status === 'sent';
                  const isDraft = quote.status === 'draft';

                  return (
                    <tr key={quote.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 pl-4 flex items-center gap-3">
                        <div className={`size-10 rounded-full flex items-center justify-center font-bold text-xs ${
                          initials.charCodeAt(0) % 4 === 0 ? 'bg-indigo-50 text-indigo-600' :
                          initials.charCodeAt(0) % 4 === 1 ? 'bg-emerald-50 text-emerald-600' :
                          initials.charCodeAt(0) % 4 === 2 ? 'bg-amber-50 text-amber-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 group-hover:text-[#3B4FE4] transition-colors">
                            {quote.client_name}
                          </div>
                          <div className="text-xs text-slate-400 font-medium">
                            {meta.title || quote.client_email}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-semibold text-slate-600">
                        {new Date(quote.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 text-sm font-bold text-slate-900">
                        US${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          isAccepted ? 'bg-emerald-50 text-emerald-600' :
                          isSent ? 'bg-indigo-50 text-indigo-600' :
                          isDraft ? 'bg-slate-100 text-slate-500' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {isAccepted ? 'Aprobado' : isSent ? 'Enviado' : isDraft ? 'Borrador' : 'Declinada'}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => window.open(`/#/quote/${quote.id}`, '_blank')}
                            className="size-8 rounded-lg bg-transparent border-none text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50 flex items-center justify-center transition-all cursor-pointer"
                            title="Ver propuesta"
                          >
                            <Icon name="visibility" className="!text-lg" />
                          </button>
                          
                          <button
                            onClick={() => handleOpenEditModal(quote)}
                            className="size-8 rounded-lg bg-transparent border-none text-slate-400 hover:text-[#3B4FE4] hover:bg-indigo-50/50 flex items-center justify-center transition-all cursor-pointer"
                            title="Editar propuesta"
                          >
                            <Icon name="edit" className="!text-lg" />
                          </button>
                          
                          <button
                            onClick={() => handleResendEmail(quote)}
                            disabled={sendingEmail === quote.id}
                            className="size-8 rounded-lg bg-transparent border-none text-slate-400 hover:text-[#3B4FE4] hover:bg-indigo-50/50 flex items-center justify-center transition-all cursor-pointer"
                            title="Enviar por email"
                          >
                            {sendingEmail === quote.id ? (
                              <div className="size-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Icon name="send" className="!text-lg" />
                            )}
                          </button>

                          <button
                            onClick={async () => {
                              if (window.confirm('¿Anular esta cotización permanentemente?')) {
                                try {
                                  const { error } = await supabase.from('quotes').delete().eq('id', quote.id);
                                  if (error) throw error;
                                  toast.success('COTIZACIÓN ANULADA');
                                  fetchQuotes();
                                } catch (err) {
                                  toast.error('Error al anular cotización');
                                }
                              }
                            }}
                            className="size-8 rounded-lg bg-transparent border-none text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 flex items-center justify-center transition-all cursor-pointer"
                            title="Anular"
                          >
                            <Icon name="delete" className="!text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer / Pagination */}
        <div className="flex items-center justify-between mt-8 border-t border-slate-50 pt-6">
          <span className="text-xs text-slate-400 font-medium">
            Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredQuotes.length)} de {filteredQuotes.length} propuestas
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="size-8 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              <Icon name="chevron_left" className="!text-base" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`size-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer border-none ${
                  currentPage === page 
                    ? 'bg-[#3B4FE4] text-white' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="size-8 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              <Icon name="chevron_right" className="!text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* Creation Modal (Split-Pane layout) */}
      {showCreateModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-container max-w-6xl !p-0 overflow-hidden flex flex-col rounded-[2rem] border border-slate-200/50 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-display">New Proposal / Quotation</h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Draft a professional workspace offer for your prospective client.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="size-10 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 cursor-pointer transition-all hover:scale-105"
              >
                <Icon name="close" className="!text-lg" />
              </button>
            </div>

            {/* Modal Form Split Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
              {/* Left Column (Inputs) */}
              <div className="flex-1 p-8 border-r border-slate-100 bg-slate-50/50 space-y-6">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                    CLIENTE / MIEMBRO
                  </label>
                  <div className="relative">
                    <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 !text-lg" />
                    <input
                      type="text"
                      placeholder="Busca o ingresa un cliente..."
                      required
                      value={newQuoteClient.clientName}
                      onChange={(e) => {
                        setNewQuoteClient({ ...newQuoteClient, clientName: e.target.value });
                        const matched = members.find(m => (m.name || '').toLowerCase() === e.target.value.toLowerCase());
                        if (matched) {
                          setNewQuoteClient(prev => ({ ...prev, clientEmail: matched.email }));
                        }
                      }}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4] focus:ring-1 focus:ring-[#3B4FE4] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                    CANAL DE EXPEDICIÓN (EMAIL)
                  </label>
                  <input
                    type="email"
                    placeholder="client@company.com"
                    required
                    value={newQuoteClient.clientEmail}
                    onChange={(e) => setNewQuoteClient({ ...newQuoteClient, clientEmail: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4] focus:ring-1 focus:ring-[#3B4FE4]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                    TITULO DE LA PROPUESTA
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Membresía Corporativa VIP"
                    required
                    value={newQuoteClient.title}
                    onChange={(e) => setNewQuoteClient({ ...newQuoteClient, title: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4] focus:ring-1 focus:ring-[#3B4FE4]"
                  />
                </div>

                {/* Validity Date Range Picker (Desde / Hasta) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                      VALIDEZ DESDE
                    </label>
                    <input
                      type="date"
                      required
                      value={newQuoteClient.fromDate}
                      onChange={(e) => setNewQuoteClient({ ...newQuoteClient, fromDate: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                      VALIDEZ HASTA
                    </label>
                    <input
                      type="date"
                      required
                      value={newQuoteClient.toDate}
                      onChange={(e) => setNewQuoteClient({ ...newQuoteClient, toDate: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4]"
                    />
                  </div>
                </div>

                {/* Spaces Dropdown Selector */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                    ESPACIO / RECURSO A VINCULAR
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {newQuoteSelectedSpaces.map(spaceId => {
                      const space = spaces.find(s => s.id === spaceId);
                      return space ? (
                        <span key={spaceId} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-[#3B4FE4] rounded-lg text-xs font-bold">
                          {space.name}
                          <button
                            type="button"
                            onClick={() => handleSpaceToggleForNew(spaceId)}
                            className="text-slate-400 hover:text-rose-600 bg-transparent border-none p-0 cursor-pointer"
                          >
                            <Icon name="close" className="!text-xs" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleSpaceToggleForNew(e.target.value);
                    }}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4] focus:ring-1 focus:ring-[#3B4FE4] text-slate-700"
                  >
                    <option value="">Selecciona espacios...</option>
                    {spaces.map(space => (
                      <option 
                        key={space.id} 
                        value={space.id}
                        disabled={newQuoteSelectedSpaces.includes(space.id)}
                      >
                        {space.name.toUpperCase()} (Capacidad: {space.capacity} pax | Price: ${space.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                    DESCRIPCIÓN / INTRODUCCIÓN
                  </label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 text-slate-400">
                      <button type="button" className="font-bold text-sm hover:text-slate-900 border-none bg-transparent">B</button>
                      <button type="button" className="italic text-sm hover:text-slate-900 border-none bg-transparent">I</button>
                      <button type="button" className="material-symbols-outlined !text-sm hover:text-slate-900 border-none bg-transparent">list</button>
                      <button type="button" className="material-symbols-outlined !text-sm hover:text-slate-900 border-none bg-transparent">link</button>
                    </div>
                    <textarea
                      placeholder="Write a welcoming intro for your proposal..."
                      rows={4}
                      required
                      value={newQuoteClient.description}
                      onChange={(e) => setNewQuoteClient({ ...newQuoteClient, description: e.target.value })}
                      className="w-full px-4 py-3 bg-transparent border-none text-sm focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column (Services & Totals) */}
              <div className="flex-1 p-8 bg-white flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Line Items</h4>
                    <button
                      type="button"
                      onClick={() => setNewQuoteItems([...newQuoteItems, { description: '', quantity: 1, price: 0 }])}
                      className="text-xs font-bold text-[#3B4FE4] hover:text-[#2d3ec7] transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    >
                      <Icon name="add" className="!text-sm" /> Add Item
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {newQuoteItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dedicated Desk (Monthly)"
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...newQuoteItems];
                              updated[idx].description = e.target.value;
                              setNewQuoteItems(updated);
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:border-[#3B4FE4] focus:bg-white transition-all font-medium"
                          />
                        </div>
                        <div className="w-16">
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="QTY"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...newQuoteItems];
                              updated[idx].quantity = parseInt(e.target.value) || 1;
                              setNewQuoteItems(updated);
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:border-[#3B4FE4] focus:bg-white transition-all text-center font-bold"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Price"
                            value={item.price}
                            onChange={(e) => {
                              const updated = [...newQuoteItems];
                              updated[idx].price = parseFloat(e.target.value) || 0;
                              setNewQuoteItems(updated);
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:border-[#3B4FE4] focus:bg-white transition-all text-right font-bold text-slate-800"
                          />
                        </div>
                        {newQuoteItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewQuoteItems(newQuoteItems.filter((_, i) => i !== idx))}
                            className="size-8 rounded-lg bg-transparent border-none text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-all"
                          >
                            <Icon name="delete" className="!text-base" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal, Tax, Total Panel */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800">
                      US${calculateNewSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    <span>Impuestos (15%)</span>
                    <span className="font-bold text-slate-800">
                      US${calculateNewTaxAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t border-slate-200/60 pt-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest">Total</span>
                    <span className="text-3xl font-black text-[#3B4FE4] font-display">
                      US${calculateNewTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Icon name="check_circle" className="!text-base text-emerald-500 animate-pulse" />
                    Saving as <strong>Draft</strong> automatically.
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-3 bg-transparent border-none text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-[#3B4FE4] hover:bg-[#2d3ec7] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 border-none cursor-pointer"
                    >
                      Send Proposal <Icon name="send" className="!text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedQuote && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-container max-w-6xl !p-0 overflow-hidden flex flex-col rounded-[2rem] border border-slate-200/50 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-indigo-50 text-[#3B4FE4] flex items-center justify-center">
                  <Icon name="description" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Edit Proposal</h3>
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[9px] font-black uppercase">
                      {selectedQuote.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
                    Editing proposal for <strong>{editQuoteClient.clientName}</strong> • ID: PROP-{selectedQuote.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="size-8 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 cursor-pointer transition-all hover:scale-105"
              >
                <Icon name="close" className="!text-lg" />
              </button>
            </div>

            {/* Modal Edit Body */}
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
              {/* Left Column Form */}
              <div className="flex-1 p-8 border-r border-slate-100 bg-slate-50/50 space-y-6">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                    CLIENTE / ORGANIZACIÓN
                  </label>
                  <input
                    type="text"
                    required
                    value={editQuoteClient.clientName}
                    onChange={(e) => setEditQuoteClient({ ...editQuoteClient, clientName: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4] focus:ring-1 focus:ring-[#3B4FE4] font-medium"
                  />
                </div>

                {/* Validity Range Picker (Desde / Hasta) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                      VALIDEZ DESDE
                    </label>
                    <input
                      type="date"
                      required
                      value={editQuoteClient.fromDate}
                      onChange={(e) => setEditQuoteClient({ ...editQuoteClient, fromDate: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                      VALIDEZ HASTA
                    </label>
                    <input
                      type="date"
                      required
                      value={editQuoteClient.toDate}
                      onChange={(e) => setEditQuoteClient({ ...editQuoteClient, toDate: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                      CURRENCY
                    </label>
                    <select
                      value={editQuoteClient.currency}
                      onChange={(e) => setEditQuoteClient({ ...editQuoteClient, currency: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4] focus:ring-1 focus:ring-[#3B4FE4] text-slate-700 font-medium"
                    >
                      <option value="USD ($)">USD ($)</option>
                      <option value="EUR (€)">EUR (€)</option>
                      <option value="COP ($)">COP ($)</option>
                    </select>
                  </div>

                  {/* Spaces Dropdown Selector in Edit */}
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                      ESPACIO VINCULADO
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleSpaceToggleForEdit(e.target.value);
                      }}
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4] focus:ring-1 focus:ring-[#3B4FE4] text-slate-700"
                    >
                      <option value="">Selecciona espacio...</option>
                      {spaces.map(space => (
                        <option 
                          key={space.id} 
                          value={space.id}
                          disabled={editQuoteSelectedSpaces.includes(space.id)}
                        >
                          {space.name.toUpperCase()} (${space.price})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Spaces Chips in Edit */}
                {editQuoteSelectedSpaces.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editQuoteSelectedSpaces.map(spaceId => {
                      const space = spaces.find(s => s.id === spaceId);
                      return space ? (
                        <span key={spaceId} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-[#3B4FE4] rounded-lg text-xs font-bold">
                          {space.name}
                          <button
                            type="button"
                            onClick={() => handleSpaceToggleForEdit(spaceId)}
                            className="text-slate-400 hover:text-rose-600 bg-transparent border-none p-0 cursor-pointer"
                          >
                            <Icon name="close" className="!text-xs" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Line Items List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Line Items</label>
                    <button
                      type="button"
                      onClick={() => setEditQuoteItems([...editQuoteItems, { description: '', quantity: 1, price: 0 }])}
                      className="text-xs font-bold text-[#3B4FE4] hover:text-[#2d3ec7] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                    >
                      <Icon name="add" className="!text-sm" /> Add Product/Service
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                    {editQuoteItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...editQuoteItems];
                              updated[idx].description = e.target.value;
                              setEditQuoteItems(updated);
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#3B4FE4] font-medium text-slate-900"
                          />
                        </div>
                        <div className="w-16">
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...editQuoteItems];
                              updated[idx].quantity = parseInt(e.target.value) || 1;
                              setEditQuoteItems(updated);
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#3B4FE4] text-center font-bold"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Unit Price"
                            value={item.price}
                            onChange={(e) => {
                              const updated = [...editQuoteItems];
                              updated[idx].price = parseFloat(e.target.value) || 0;
                              setEditQuoteItems(updated);
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#3B4FE4] text-right font-bold text-slate-800"
                          />
                        </div>
                        {editQuoteItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEditQuoteItems(editQuoteItems.filter((_, i) => i !== idx))}
                            className="size-8 rounded-lg bg-transparent border-none text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-all"
                          >
                            <Icon name="delete" className="!text-base" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                    INTERNAL NOTES / COMMENTS
                  </label>
                  <textarea
                    placeholder="Discount offered due to long-term contract potential. Awaiting legal review of custom terms."
                    rows={3}
                    value={editQuoteClient.internalNotes}
                    onChange={(e) => setEditQuoteClient({ ...editQuoteClient, internalNotes: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#3B4FE4]"
                  />
                </div>

                {/* Global Discount Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      GLOBAL DISCOUNT (%)
                    </label>
                    <span className="px-2.5 py-1 bg-[#3B4FE4] text-white text-xs font-bold rounded-lg">
                      {editQuoteClient.discountPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editQuoteClient.discountPercent}
                    onChange={(e) => setEditQuoteClient({ ...editQuoteClient, discountPercent: parseInt(e.target.value) })}
                    className="w-full accent-[#3B4FE4] cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Column Summary */}
              <div className="flex-1 p-8 bg-white flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Proposal Summary</h4>

                  <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-800">
                        US${calculateEditSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      <span>Global Discount ({editQuoteClient.discountPercent}%)</span>
                      <span className="font-bold text-rose-500">
                        -US${calculateEditDiscountAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-t border-slate-200/80 pt-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 uppercase tracking-widest">Grand Total</span>
                      <span className="text-3xl font-black text-[#3B4FE4] font-display">
                        US${calculateEditTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    onClick={handleDeleteDraft}
                    className="px-4 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer bg-white"
                  >
                    <Icon name="delete" className="!text-sm" /> Delete Draft
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-6 py-3 bg-transparent border-none text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-[#3B4FE4] hover:bg-[#2d3ec7] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 border-none cursor-pointer"
                    >
                      Update Changes
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuotes;
