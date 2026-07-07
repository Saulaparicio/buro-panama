import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../supabase';
import { Space, Member } from '../../types';
import confetti from 'canvas-confetti';
import PremiumSelect from '../../components/ui/PremiumSelect';
import { useTenant } from '../../contexts/TenantContext';

/**
 * Componente SpaceGallery
 * Gestiona la visualización interactiva de múltiples imágenes dentro de una tarjeta con estilo Workspace.
 */
const SpaceGallery: React.FC<{ images: string[] }> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface-container)] text-[var(--on-surface-variant)]/30">
        <span className="material-symbols-outlined !text-5xl mb-4 font-thin">architecture</span>
        <span className="label-md text-[10px] font-black uppercase tracking-[0.3em]">No Visual Assets</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group/gallery overflow-hidden bg-[var(--secondary)]">
      <div className="absolute inset-0 grayscale group-hover/gallery:grayscale-0 transition-all duration-[1500ms] ease-out">
        <img
          key={currentIndex}
          src={images[currentIndex]}
          className="w-full h-full object-cover transition-all duration-1000 ease-out group-hover/gallery:scale-110 opacity-70 group-hover/gallery:opacity-100"
          alt={`Space view ${currentIndex + 1}`}
        />
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 group-hover/gallery:opacity-100 transition-all duration-700">
            <button
              onClick={handlePrev}
              className="size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-black transition-all border border-white/20 active:scale-95"
            >
              <span className="material-symbols-outlined !text-xl font-light">west</span>
            </button>
            <button
              onClick={handleNext}
              className="size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-black transition-all border border-white/20 active:scale-95"
            >
              <span className="material-symbols-outlined !text-xl font-light">east</span>
            </button>
          </div>

          <div className="absolute bottom-8 left-8 flex gap-1.5 pointer-events-none">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-[2px] transition-all duration-1000 ease-premium ${i === currentIndex ? 'bg-[var(--primary)] w-12' : 'bg-white/20 w-4'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ManageSpaces: React.FC = () => {
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [selectedSpaceForMap, setSelectedSpaceForMap] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSpace, setEditingSpace] = useState<Partial<Space> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNewSpace, setIsNewSpace] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSpaces(data as Space[] || []);
    } catch (err: any) {
      console.error('Error fetching spaces:', err);
      toast.error('Error al sincronizar inventario.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (space?: Space) => {
    setIsNewSpace(!space);
    setEditingSpace(space || {
      name: '',
      description: '',
      type: 'desk',
      capacity: 1,
      price: 10,
      images: [],
      popular: false,
      features: ['wifi']
    });
    setUploadError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSpace(null);
    setUploadError(null);
    setIsDragging(false);
    setImageProcessing(false);
    setIsNewSpace(false);
  };

  const processFiles = async (files: FileList) => {
    setImageProcessing(true);
    setUploadError(null);
    const newImages: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) continue;
      if (file.size > maxSize) continue;

      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push(await promise);
    }

    setEditingSpace(prev => prev ? { ...prev, images: [...(prev.images || []), ...newImages] } : null);
    setImageProcessing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const removeImage = (index: number) => {
    setEditingSpace(prev => {
      if (!prev || !prev.images) return null;
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpace || imageProcessing) return;
    setFormLoading(true);
    try {
      if (!isNewSpace) {
        const { error } = await supabase.from('spaces').update(editingSpace).eq('id', editingSpace.id!);
        if (error) throw error;
        toast.success('ESPACIO ACTUALIZADO');
      } else {
        const { error } = await supabase.from('spaces').insert([{ ...editingSpace, tenant_id: tenant?.id }]);
        if (error) throw error;
        toast.success('ESPACIO REGISTRADO');
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FDE910', '#11171D', '#686000']
      });

      await fetchSpaces();
      handleCloseForm();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar cambios.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!spaceToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('spaces').delete().eq('id', spaceToDelete.id);
      if (error) throw error;
      setSpaces(prev => prev.filter(s => s.id !== spaceToDelete.id));
      setSpaceToDelete(null);
      toast.success('ESPACIO ELIMINADO');
    } catch (err: any) {
      toast.error("No se pudo eliminar el activo.");
    } finally { setIsDeleting(false); }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'wifi': return 'wifi';
      case 'coffee': return 'coffee';
      case 'print': return 'print';
      case 'videocam': return 'videocam';
      case 'lock': return 'lock';
      case 'ac': return 'ac_unit';
      default: return 'star';
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-fade pb-32 px-6 md:px-12">
      {/* SaaS Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
        <div className="flex items-center gap-6">
          <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
            <div className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-900 text-white shadow-lg flex items-center gap-2">
              <span className="material-symbols-outlined !text-lg">architecture</span>
              Espacios
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
          
          <p className="text-sm text-slate-400 font-medium hidden md:block">
            {spaces.length} activos en inventario
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 mr-4">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              Galería
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              Plano
            </button>
          </div>
          
          <button
            onClick={() => handleOpenForm()}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-slate-200 border-none cursor-pointer"
          >
            <span className="material-symbols-outlined !text-lg">add</span>
            Nuevo Espacio
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-48 flex flex-col items-center justify-center gap-12">
            <div className="relative size-32">
                <div className="absolute inset-0 border-[1px] border-slate-100 rounded-full scale-150"></div>
                <div className="absolute inset-0 border-t-2 border-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined !text-4xl text-slate-200 animate-pulse">architecture</span>
                </div>
            </div>
            <div className="text-center space-y-4">
                <p className="text-sm font-bold text-slate-400 animate-pulse">Sincronizando Inventario Físico</p>
            </div>
        </div>
      ) : activeTab === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 h-[800px] animate-slide pt-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-10 overflow-y-auto custom-scrollbar">
            <div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Directorio</p>
              <h3 className="text-2xl font-bold text-slate-900">Activos</h3>
            </div>

            <div className="space-y-3">
              {spaces.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpaceForMap(s.id)}
                  className={`w-full p-4 rounded-xl transition-all text-left group border ${selectedSpaceForMap === s.id ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-lg flex items-center justify-center transition-all ${selectedSpaceForMap === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      <span className="material-symbols-outlined !text-lg">
                        {s.type === 'desk' ? 'deck' : s.type === 'meeting' ? 'groups' : 'corporate_fare'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-xs uppercase tracking-tight ${selectedSpaceForMap === s.id ? 'text-indigo-900' : 'text-slate-700'}`}>{s.name}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {s.map_top ? 'Geoposicionado' : 'Sin ubicar'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-100 shadow-sm relative flex items-center justify-center overflow-hidden !p-0">
            <div
              className={`relative w-full h-full bg-slate-50 ${selectedSpaceForMap ? 'cursor-crosshair' : 'cursor-default'}`}
              onClick={async (e) => {
                if (!selectedSpaceForMap) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                try {
                  const { error } = await supabase.from('spaces').update({ map_top: y, map_left: x }).eq('id', selectedSpaceForMap);
                  if (error) throw error;
                  toast.success('POSICIÓN ACTUALIZADA');
                  setSpaces(prev => prev.map(s => s.id === selectedSpaceForMap ? { ...s, map_top: y, map_left: x } : s));
                } catch (err: any) {
                  toast.error(err.message);
                }
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(var(--on-surface)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]"></div>
              
              <img
                src="/assets/floorplan.png"
                className="w-full h-full object-contain opacity-20 grayscale scale-90"
                alt=""
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=2000" }}
              />

              {spaces.map(s => s.map_top && (
                <div
                  key={s.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-all duration-700 ${selectedSpaceForMap === s.id ? 'z-20 scale-125' : 'z-10 opacity-40 grayscale'}`}
                  style={{ top: `${s.map_top}%`, left: `${s.map_left}%` }}
                >
                  <div className={`size-10 rounded-xl border border-white shadow-2xl transition-all ${selectedSpaceForMap === s.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900'}`}>
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined !text-lg">
                        {s.type === 'desk' ? 'deck' : s.type === 'meeting' ? 'groups' : 'corporate_fare'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {!selectedSpaceForMap && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/80 backdrop-blur-md py-4 px-8 rounded-2xl flex items-center gap-4 shadow-xl border border-slate-100">
                    <span className="material-symbols-outlined text-indigo-600 animate-bounce">touch_app</span>
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Selecciona un activo para ubicar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spaces.map((space, index) => (
            <div 
              key={space.id} 
              className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] relative overflow-hidden bg-slate-50">
                <SpaceGallery images={space.images} />
                <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
                  {space.popular && (
                    <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg">
                      Popu
                    </span>
                  )}
                  <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-slate-900 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-white/20 shadow-sm">
                    {space.type}
                  </span>
                </div>
              </div>

              <div className="p-8 space-y-6 flex-1 flex flex-col">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{space.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined !text-sm text-slate-300">person</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{space.capacity} PAX</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-0.5">
                        <span className="text-sm font-bold text-slate-400">$</span>
                        <span className="text-3xl font-bold text-slate-900 tracking-tighter">{space.price}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">/ HORA</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 font-medium leading-relaxed opacity-80 border-l-2 border-slate-100 pl-4 line-clamp-2">
                    {space.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {space.features?.slice(0, 5).map(feature => (
                      <div key={feature} className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all" title={feature}>
                        <span className="material-symbols-outlined !text-xl">{getFeatureIcon(feature)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-50 flex flex-col gap-3">
                  <button
                    onClick={() => navigate('/admin/reservations', { state: { selectedId: space.id } })}
                    className="w-full h-12 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3"
                  >
                    Ver Agenda
                    <span className="material-symbols-outlined !text-lg">event_available</span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleOpenForm(space)}
                      className="h-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined !text-lg">settings</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Configurar</span>
                    </button>
                    <button
                      onClick={() => setSpaceToDelete(space)}
                      className="h-12 rounded-xl bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined !text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {spaceToDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-container max-w-md !rounded-[3rem] shadow-2xl p-12 text-center space-y-10">
            <div className="size-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined !text-4xl">delete_sweep</span>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                ¿Retirar <span className="text-rose-500">Recurso?</span>
              </h3>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto opacity-60">
                Eliminación permanente del activo <span className="text-slate-900 underline decoration-rose-500/30">"{spaceToDelete.name}"</span>
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                disabled={isDeleting} 
                onClick={handleConfirmDelete} 
                className="w-full h-16 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-4"
              >
                {isDeleting ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="material-symbols-outlined !text-xl">priority_high</span>}
                {isDeleting ? "PROCESANDO..." : "CONFIRMAR RETIRADA"}
              </button>
              <button 
                onClick={() => setSpaceToDelete(null)} 
                className="w-full h-16 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-slate-100 transition-all"
              >
                Conservar en Inventario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Form Modal */}
      {isFormOpen && editingSpace && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          {isNewSpace ? (
            /* ==================== CREATE MODAL ==================== */
            <div className="modal-container max-w-5xl rounded-3xl overflow-hidden flex flex-col md:flex-row bg-white border border-[var(--outline-variant)] shadow-2xl">
              
              {/* Left Pane - Main Config */}
              <div className="w-full md:w-[60%] p-6 md:p-8 space-y-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Add New Space</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Configure your workspace details to start accepting bookings.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* Space Gallery Drop Zone */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Space Gallery</label>
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) processFiles(e.dataTransfer.files); }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative aspect-[3/1] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-700 bg-slate-50 cursor-pointer ${isDragging ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-slate-200 hover:border-[var(--primary)]/40 hover:bg-white'}`}
                      >
                        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                        {imageProcessing ? (
                          <div className="size-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                        ) : editingSpace.images && editingSpace.images.length > 0 ? (
                          <div className="absolute inset-0 flex gap-2 p-2 overflow-x-auto">
                            {editingSpace.images.map((img, idx) => (
                              <div key={idx} className="h-full aspect-video rounded-lg overflow-hidden relative shadow-sm">
                                <img src={img} className="w-full h-full object-cover" alt="" />
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                  className="absolute top-1.5 right-1.5 size-6 bg-black/50 text-white rounded-md flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                  <span className="material-symbols-outlined !text-xs">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[var(--primary)] !text-3xl font-light">add_a_photo</span>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wider">Upload space photos</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">PNG, JPG up to 10MB</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Name & Category Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Space Name</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Skyline Boardroom" 
                          value={editingSpace.name || ''} 
                          onChange={(e) => setEditingSpace({ ...editingSpace, name: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                        <select 
                          value={editingSpace.type || 'desk'} 
                          onChange={(e) => setEditingSpace({ ...editingSpace, type: e.target.value as any })} 
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold bg-white"
                        >
                          <option value="meeting">Meeting Room</option>
                          <option value="office">Private Office</option>
                          <option value="desk">Hot Desk</option>
                          <option value="studio">Creative Studio</option>
                        </select>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Location</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Floor 4, West Wing" 
                          value={(editingSpace.description || '').split(' | ')[1] || ''} 
                          onChange={(e) => {
                            const descParts = (editingSpace.description || '').split(' | ');
                            setEditingSpace({ ...editingSpace, description: `${descParts[0] || ''} | ${e.target.value}` });
                          }}
                          className="w-full border border-slate-200 rounded-xl p-3 pl-10 text-xs font-bold"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 !text-lg">location_on</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                      <textarea 
                        rows={3} 
                        placeholder="Describe the space, atmosphere, and ideal use cases..." 
                        value={(editingSpace.description || '').split(' | ')[0] || ''} 
                        onChange={(e) => {
                          const descParts = (editingSpace.description || '').split(' | ');
                          setEditingSpace({ ...editingSpace, description: `${e.target.value} | ${descParts[1] || ''}` });
                        }}
                        className="w-full border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-700 placeholder-slate-300 resize-none"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Pane - Availability, Pricing & Amenities */}
              <div className="w-full md:w-[40%] bg-[var(--surface)] border-l border-[var(--outline-variant)]/40 p-6 md:p-8 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Availability & Pricing</h3>
                  </div>

                  {/* Capacity & Price inputs */}
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[var(--primary)]">groups</span>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Max Capacity</p>
                          <input 
                            type="number" 
                            value={editingSpace.capacity || 1} 
                            onChange={(e) => setEditingSpace({ ...editingSpace, capacity: parseInt(e.target.value) || 1 })} 
                            className="w-16 border-none p-0 text-xl font-black text-slate-800 focus:ring-0 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400">people</span>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-slate-400">$</span>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Price per Hour</p>
                          <input 
                            type="number" 
                            step={0.5}
                            value={editingSpace.price || 0} 
                            onChange={(e) => setEditingSpace({ ...editingSpace, price: parseFloat(e.target.value) || 0 })} 
                            className="w-20 border-none p-0 text-xl font-black text-slate-800 focus:ring-0 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">USD</span>
                    </div>
                  </div>

                  {/* Amenities Checklist */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amenities</p>
                    <div className="space-y-2">
                      {[
                        { key: 'wifi', name: 'High-speed Wi-Fi', icon: 'wifi' },
                        { key: 'videocam', name: 'HD Projector', icon: 'tv' },
                        { key: 'coffee', name: 'Premium Coffee', icon: 'local_cafe' },
                        { key: 'ac', name: 'Climate Control', icon: 'ac_unit' }
                      ].map((amenity) => {
                        const isChecked = (editingSpace.features || []).includes(amenity.key);
                        return (
                          <div 
                            key={amenity.key} 
                            onClick={() => {
                              const current = editingSpace.features || [];
                              setEditingSpace({ 
                                ...editingSpace, 
                                features: isChecked ? current.filter(f => f !== amenity.key) : [...current, amenity.key] 
                              });
                            }}
                            className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:border-[var(--primary)]/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-slate-500 !text-lg">{amenity.icon}</span>
                              <span className="text-xs font-bold text-slate-800">{amenity.name}</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} // Click is handled by parent div
                              className="w-4 h-4 text-[var(--primary)] rounded border-slate-300 focus:ring-[var(--primary)] cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Save & Cancel Buttons */}
                <div className="space-y-3 pt-6">
                  <button 
                    onClick={handleSubmit}
                    type="button" 
                    disabled={formLoading} 
                    className="w-full py-4 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-colors border-none cursor-pointer flex items-center justify-center"
                  >
                    {formLoading ? 'Saving...' : 'Save Space'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCloseForm}
                    className="w-full py-3 bg-transparent text-slate-500 hover:text-slate-700 text-xs font-black uppercase tracking-wider transition-colors border-none cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* ==================== EDIT MODAL ==================== */
            <div className="modal-container max-w-5xl rounded-3xl overflow-hidden flex flex-col md:flex-row bg-white border border-[var(--outline-variant)] shadow-2xl">
              
              {/* Left Pane - Main Config */}
              <div className="w-full md:w-[60%] p-6 md:p-8 space-y-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Editar Espacio - {editingSpace.name}</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Actualiza los detalles y la configuración de este espacio premium.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* Banner Image */}
                    <div className="relative rounded-2xl overflow-hidden h-48 shadow-md bg-slate-900">
                      <img 
                        alt={editingSpace.name} 
                        className="w-full h-full object-cover opacity-90"
                        src={editingSpace.images?.[0] || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"} 
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-4 right-4 bg-white/80 hover:bg-white text-slate-800 text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-md border border-white/20 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined !text-sm">edit</span> Cambiar Foto
                      </button>
                      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    {/* Name & Category Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Espacio</label>
                        <input 
                          type="text" 
                          required 
                          value={editingSpace.name || ''} 
                          onChange={(e) => setEditingSpace({ ...editingSpace, name: e.target.value })} 
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Categoría</label>
                        <select 
                          value={editingSpace.type || 'desk'} 
                          onChange={(e) => setEditingSpace({ ...editingSpace, type: e.target.value as any })} 
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold bg-white"
                        >
                          <option value="meeting">Boardroom</option>
                          <option value="office">Private Office</option>
                          <option value="desk">Hot Desk</option>
                          <option value="studio">Creative Studio</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descripción</label>
                      <textarea 
                        rows={4} 
                        value={editingSpace.description || ''} 
                        onChange={(e) => setEditingSpace({ ...editingSpace, description: e.target.value })} 
                        className="w-full border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-700 resize-none"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Pane - Technical Details, Amenities & Save */}
              <div className="w-full md:w-[40%] bg-[var(--surface)] border-l border-[var(--outline-variant)]/40 p-6 md:p-8 flex flex-col justify-between">
                
                {/* Header with Close */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Detalles Técnicos</h3>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleCloseForm} 
                    className="size-8 bg-slate-200/60 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors border-none cursor-pointer text-slate-600"
                  >
                    <span className="material-symbols-outlined !text-lg">close</span>
                  </button>
                </div>

                {/* Technical stats boxes */}
                <div className="space-y-4 flex-1">
                  {/* Capacity Box */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[var(--primary)]">groups</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Capacity</span>
                    </div>
                    <input 
                      type="number" 
                      value={editingSpace.capacity || 1} 
                      onChange={(e) => setEditingSpace({ ...editingSpace, capacity: parseInt(e.target.value) || 1 })} 
                      className="w-16 border-none p-0 text-right text-xl font-black text-[var(--primary)] focus:ring-0 focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Price Box */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-600">payments</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Price</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xl font-black text-emerald-600">$</span>
                      <input 
                        type="number" 
                        step={0.5}
                        value={editingSpace.price || 0} 
                        onChange={(e) => setEditingSpace({ ...editingSpace, price: parseFloat(e.target.value) || 0 })} 
                        className="w-16 border-none p-0 text-right text-xl font-black text-emerald-600 focus:ring-0 focus:outline-none bg-transparent"
                      />
                      <span className="text-[10px] font-black text-slate-400">/hr</span>
                    </div>
                  </div>

                  {/* Active Amenities Checklist or Pills */}
                  <div className="space-y-3 pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'wifi', name: 'Wi-Fi 6' },
                        { key: 'videocam', name: '4K Display' },
                        { key: 'coffee', name: 'Catering' },
                        { key: 'ac', name: 'VC System' }
                      ].map((amenity) => {
                        const isChecked = (editingSpace.features || []).includes(amenity.key);
                        return (
                          <button
                            key={amenity.key}
                            type="button"
                            onClick={() => {
                              const current = editingSpace.features || [];
                              setEditingSpace({ 
                                ...editingSpace, 
                                features: isChecked ? current.filter(f => f !== amenity.key) : [...current, amenity.key] 
                              });
                            }}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-2 border ${
                              isChecked 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                : 'bg-slate-100 text-slate-400 border-transparent hover:bg-slate-200/50'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            {amenity.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4 pt-6 border-t border-[var(--outline-variant)]/40 mt-6">
                  <button 
                    onClick={handleSubmit}
                    type="button" 
                    disabled={formLoading} 
                    className="w-full py-4 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined !text-base">save</span>
                    {formLoading ? 'Guardando...' : 'Update Changes'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSpaceToDelete(editingSpace as Space);
                      handleCloseForm();
                    }}
                    className="w-full py-3 bg-transparent hover:bg-rose-50 text-rose-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined !text-base">delete</span>
                    Delete Space
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageSpaces;
