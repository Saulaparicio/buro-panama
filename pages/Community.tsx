import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Member, Post } from '../types';
import { toast } from 'react-hot-toast';
import { Icon } from '../components/ui/Icon';
import { LabeledProgressIndicator } from '../components/ui/LabeledProgressIndicator';

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wall' | 'directory'>('wall');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // New post state
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const categories = ['Todos', 'Tecnología', 'Diseño', 'Finanzas', 'Marketing', 'Legal'];

  useEffect(() => {
    fetchMembers();
    fetchPosts();
    fetchCurrentUser();

    const channel = supabase
      .channel('community-wall')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => {
          fetchPosts(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUserProfile(data);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) {
        const mappedMembers = data.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role || 'Miembro',
          company: p.company || 'Independiente',
          image: p.avatar_url,
          status: p.status,
          email: p.email,
          credits: p.credits || 0
        }));
        setMembers(mappedMembers as Member[]);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*, profile:profiles(name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newPostContent.trim() && !newPostImage) return;

    try {
      setPosting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let imageUrl = null;
      if (newPostImage) {
        const fileExt = newPostImage.name.split('.').pop();
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, newPostImage);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('posts').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase.from('posts').insert([{
        profile_id: user.id,
        content: newPostContent,
        image_url: imageUrl
      }]);

      if (error) throw error;
      setNewPostContent('');
      setNewPostImage(null);
      setImagePreview(null);
      toast.success('Publicado');
      fetchPosts();
    } catch (err: any) {
      console.error('Error posting:', err);
      toast.error('Error al publicar');
    } finally {
      setPosting(false);
    }
  };

  const filteredMembers = members.filter(m =>
    (m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.company?.toLowerCase().includes(search.toLowerCase())) &&
    (category === 'Todos' || m.role?.includes(category))
  );

  return (
    <div className="py-6 space-y-8 animate-fade bg-white min-h-screen">
      {/* Editorial Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--outline-variant)]">
        <div className="flex items-center gap-4">
            <div className="size-10 bg-[var(--secondary)] text-[var(--primary-container)] rounded-lg flex items-center justify-center">
                <Icon name="hub" className="!text-xl" />
            </div>
            <div>
                <p className="label-md !text-[9px] tracking-[0.3em] mb-0.5">Comunidad</p>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">Directorio B</h1>
            </div>
        </div>

        <div className="flex bg-[var(--surface-container)] p-1 rounded-lg border border-[var(--outline-variant)]">
          <button
            onClick={() => setActiveTab('wall')}
            className={`px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${activeTab === 'wall' ? 'bg-[var(--secondary)] text-white shadow-sm' : 'text-[var(--on-surface-subtle)] hover:text-[var(--secondary)]'}`}
          >
            Muro
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${activeTab === 'directory' ? 'bg-[var(--secondary)] text-white shadow-sm' : 'text-[var(--on-surface-subtle)] hover:text-[var(--secondary)]'}`}
          >
            Directorio
          </button>
        </div>
      </section>

      {activeTab === 'wall' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Create Post */}
            <div className="bg-white border border-[var(--outline-variant)] rounded-lg p-6 shadow-sm">
                <div className="flex gap-4 mb-4">
                    <img src={currentUserProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserProfile?.name || 'User')}`} className="size-10 bg-stone-100 rounded-lg object-cover" alt="User" />
                    <textarea 
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Comparte algo con el ecosistema..."
                        className="flex-1 bg-transparent border-none outline-none resize-none text-sm min-h-[80px]"
                    />
                </div>
                {imagePreview && (
                    <div className="mb-4 relative rounded-lg overflow-hidden border border-[var(--outline-variant)]">
                        <img src={imagePreview} className="w-full max-h-[300px] object-cover" alt="Preview" />
                        <button onClick={() => {setNewPostImage(null); setImagePreview(null);}} className="absolute top-2 right-2 size-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md">
                            <Icon name="close" className="!text-sm" />
                        </button>
                    </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--outline-variant)]/50">
                    <label className="flex items-center gap-2 text-[var(--on-surface-subtle)] hover:text-[var(--secondary)] cursor-pointer transition-colors">
                        <Icon name="image" className="!text-lg" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Imagen</span>
                        <input type="file" accept="image/*" onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setNewPostImage(e.target.files[0]);
                                setImagePreview(URL.createObjectURL(e.target.files[0]));
                            }
                        }} className="hidden" />
                    </label>
                    <button 
                        onClick={handlePost}
                        disabled={posting || (!newPostContent.trim() && !newPostImage)}
                        className="px-6 py-2 bg-[var(--secondary)] text-white rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-30"
                    >
                        {posting ? 'PUBLICANDO...' : 'PUBLICAR'}
                    </button>
                </div>
            </div>

            {/* Posts List */}
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center p-12">
                   <LabeledProgressIndicator labels={['Buscando publicaciones...']} intervalMs={1500} />
                </div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <article key={post.id} className="bg-white border border-[var(--outline-variant)] rounded-lg overflow-hidden shadow-sm animate-fade">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <img src={post.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profile?.name || 'User')}`} className="size-10 bg-stone-100 rounded-lg object-cover" alt="Author" />
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-tight">{post.profile?.name}</h3>
                                    <p className="text-[9px] text-[var(--on-surface-subtle)] uppercase tracking-wider">{new Date(post.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--on-surface)] leading-relaxed mb-4">{post.content}</p>
                        {post.image_url && (
                            <div className="rounded-lg overflow-hidden border border-[var(--outline-variant)]/10">
                                <img src={post.image_url} className="w-full object-cover max-h-[500px]" alt="Post" />
                            </div>
                        )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="text-center p-20 bg-stone-50 rounded-lg">
                   <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em]">No hay publicaciones aún</p>
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-8">
             <div className="bg-[var(--secondary)] text-white p-8 rounded-lg">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-4 text-[var(--primary-container)]">Protocolo Buro</h3>
                <p className="text-sm opacity-60 leading-relaxed">"La arquitectura de la colaboración comienza con el respeto y la visión compartida."</p>
             </div>
          </aside>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Members filters */}
          <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                  <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] opacity-30" />
                  <input 
                    type="text" 
                    placeholder="Buscar miembros o empresas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-lg text-sm focus:border-[var(--secondary)] outline-none transition-all"
                  />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${category === cat ? 'bg-[var(--secondary)] text-white' : 'bg-[var(--surface-container)] text-[var(--on-surface-subtle)] border border-[var(--outline-variant)]'}`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMembers.map(member => (
              <div key={member.id} className="group bg-white border border-[var(--outline-variant)] rounded-lg overflow-hidden flex flex-col items-center p-8 text-center transition-all hover:shadow-xl hover:-translate-y-1">
                 <div className="size-24 rounded-lg overflow-hidden mb-6 border border-[var(--outline-variant)] p-1">
                    <img src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`} className="w-full h-full object-cover rounded-md grayscale group-hover:grayscale-0 transition-all duration-700" alt={member.name} />
                 </div>
                 <h3 className="text-sm font-bold uppercase tracking-tight mb-1">{member.name}</h3>
                 <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest mb-4">{member.role}</p>
                 <div className="w-8 h-px bg-[var(--outline-variant)] mb-4"></div>
                 <p className="text-[11px] font-medium text-[var(--on-surface-subtle)] uppercase mb-6">{member.company}</p>
                 <a href={`mailto:${member.email}`} className="text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-2 border border-[var(--secondary)] rounded-md hover:bg-[var(--secondary)] hover:text-white transition-all">Contactar</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
