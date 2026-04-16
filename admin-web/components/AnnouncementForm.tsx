'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Announcement, AnnouncementType, NewsArticle } from '@/lib/supabase';

const TYPE_OPTIONS: { value: AnnouncementType; label: string; color: string }[] = [
  { value: 'news',    label: 'Noticia',       color: '#E8571A' },
  { value: 'update',  label: 'Actualización', color: '#5BB8F5' },
  { value: 'feature', label: 'Nuevo feature', color: '#A87FE8' },
  { value: 'event',   label: 'Evento',        color: '#4CAF7D' },
];

type LinkTarget = 'none' | 'post' | 'news';

interface PostOption {
  id: string;
  content: string | null;
  images: string[];
  profiles: { username: string } | null;
  created_at: string;
}

interface Props {
  announcement?: Announcement;
}

export function AnnouncementForm({ announcement }: Props) {
  const router  = useRouter();
  const isEdit  = !!announcement;

  const [title,       setTitle]       = useState(announcement?.title ?? '');
  const [body,        setBody]        = useState(announcement?.body  ?? '');
  const [type,        setType]        = useState<AnnouncementType>(announcement?.type ?? 'news');
  const [publish,     setPublish]     = useState(!!announcement?.published_at);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  // Link target
  const initialTarget: LinkTarget = announcement?.post_id ? 'post' : announcement?.news_id ? 'news' : 'none';
  const [linkTarget,  setLinkTarget]  = useState<LinkTarget>(initialTarget);
  const [selectedPostId, setSelectedPostId] = useState(announcement?.post_id ?? '');
  const [selectedNewsId, setSelectedNewsId] = useState(announcement?.news_id ?? '');

  // Options for pickers
  const [postOptions, setPostOptions] = useState<PostOption[]>([]);
  const [newsOptions, setNewsOptions] = useState<NewsArticle[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingNews,  setLoadingNews]  = useState(false);

  useEffect(() => {
    if (linkTarget === 'post' && postOptions.length === 0) {
      setLoadingPosts(true);
      supabase
        .from('posts')
        .select('id, content, images, created_at, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(30)
        .then(({ data }) => {
          setPostOptions((data as unknown as PostOption[]) ?? []);
          setLoadingPosts(false);
        });
    }
    if (linkTarget === 'news' && newsOptions.length === 0) {
      setLoadingNews(true);
      supabase
        .from('news_articles')
        .select('*')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .then(({ data }) => {
          setNewsOptions((data as NewsArticle[]) ?? []);
          setLoadingNews(false);
        });
    }
  }, [linkTarget]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      title:        title.trim(),
      body:         body.trim(),
      type,
      post_id:      linkTarget === 'post' ? (selectedPostId || null) : null,
      news_id:      linkTarget === 'news' ? (selectedNewsId || null) : null,
      published_at: publish
        ? (announcement?.published_at ?? new Date().toISOString())
        : null,
    };

    let err;
    if (isEdit) {
      ({ error: err } = await supabase.from('announcements').update(payload).eq('id', announcement!.id));
    } else {
      ({ error: err } = await supabase.from('announcements').insert(payload));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    router.push('/announcements');
    router.refresh();
  }

  async function handleDelete() {
    if (!announcement) return;
    if (!confirm('¿Eliminar este anuncio?')) return;
    await supabase.from('announcements').delete().eq('id', announcement.id);
    router.push('/announcements');
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted uppercase tracking-wider">Título *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required maxLength={120}
          placeholder="Título del anuncio..."
          className="w-full bg-forge-elevated border border-forge-border rounded-lg px-4 py-2.5 text-forge-text text-sm placeholder-forge-muted focus:border-forge-accent transition-colors"
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted uppercase tracking-wider">Mensaje *</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required rows={4}
          placeholder="Escribí el contenido del anuncio..."
          className="w-full bg-forge-elevated border border-forge-border rounded-lg px-4 py-2.5 text-forge-text text-sm placeholder-forge-muted focus:border-forge-accent transition-colors resize-y min-h-[80px]"
        />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted uppercase tracking-wider">Tipo</label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value} type="button" onClick={() => setType(opt.value)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border transition-all"
              style={type === opt.value
                ? { backgroundColor: opt.color + '22', borderColor: opt.color, color: opt.color }
                : { backgroundColor: 'transparent', borderColor: '#2C2A27', color: '#8A837A' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Link picker */}
      <div className="space-y-3">
        <label className="text-xs text-forge-muted uppercase tracking-wider">Vincular a...</label>

        {/* Radio options */}
        <div className="flex gap-3">
          {(['none', 'post', 'news'] as LinkTarget[]).map((opt) => (
            <button
              key={opt} type="button"
              onClick={() => setLinkTarget(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                linkTarget === opt
                  ? 'bg-forge-accent/15 border-forge-accent text-forge-accent'
                  : 'bg-transparent border-forge-border text-forge-muted hover:text-forge-text'
              }`}
            >
              {opt === 'none' ? 'Sin link' : opt === 'post' ? '🖼️ Post de artesano' : '📰 Noticia'}
            </button>
          ))}
        </div>

        {/* Post picker */}
        {linkTarget === 'post' && (
          <div className="border border-forge-border rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-forge-elevated">
            {loadingPosts ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : postOptions.length === 0 ? (
              <p className="text-forge-muted text-sm text-center py-6">No hay posts disponibles.</p>
            ) : (
              postOptions.map((post) => (
                <button
                  key={post.id} type="button"
                  onClick={() => setSelectedPostId(post.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-forge-border last:border-0 ${
                    selectedPostId === post.id
                      ? 'bg-forge-accent/10 border-l-2 border-l-forge-accent'
                      : 'hover:bg-forge-surface'
                  }`}
                >
                  <div className="w-12 h-10 rounded-md overflow-hidden flex-shrink-0 bg-forge-surface border border-forge-border">
                    {post.images?.[0]
                      ? <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-forge-muted text-xs">—</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-forge-text text-xs font-medium">@{post.profiles?.username ?? 'desconocido'}</p>
                    <p className="text-forge-muted text-xs truncate">{post.content || 'Sin descripción'}</p>
                  </div>
                  <p className="text-forge-muted text-xs flex-shrink-0">
                    {new Date(post.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {/* News picker */}
        {linkTarget === 'news' && (
          <div className="border border-forge-border rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-forge-elevated">
            {loadingNews ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : newsOptions.length === 0 ? (
              <p className="text-forge-muted text-sm text-center py-6">No hay noticias publicadas.</p>
            ) : (
              newsOptions.map((article) => (
                <button
                  key={article.id} type="button"
                  onClick={() => setSelectedNewsId(article.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-forge-border last:border-0 ${
                    selectedNewsId === article.id
                      ? 'bg-forge-accent/10 border-l-2 border-l-forge-accent'
                      : 'hover:bg-forge-surface'
                  }`}
                >
                  <div className="w-12 h-10 rounded-md overflow-hidden flex-shrink-0 bg-forge-surface border border-forge-border">
                    {article.cover_url
                      ? <img src={article.cover_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">📰</div>
                    }
                  </div>
                  <p className="flex-1 text-forge-text text-xs font-medium truncate">{article.title}</p>
                  <p className="text-forge-muted text-xs flex-shrink-0">
                    {new Date(article.published_at!).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Publish toggle */}
      <div className="flex items-center gap-3 py-3 px-4 bg-forge-elevated border border-forge-border rounded-lg">
        <button type="button" onClick={() => setPublish(!publish)}
          className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${publish ? 'bg-forge-accent' : 'bg-forge-border'}`}>
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${publish ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        <div>
          <p className="text-sm text-forge-text font-medium">{publish ? 'Publicado' : 'Borrador'}</p>
          <p className="text-xs text-forge-muted">
            {publish
              ? isEdit && announcement?.published_at
                ? `Publicado el ${new Date(announcement.published_at).toLocaleString('es-AR')}`
                : 'Se publicará al guardar'
              : 'No visible para los usuarios'
            }
          </p>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-forge-accent hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-opacity">
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear anuncio'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="text-forge-muted hover:text-forge-text text-sm transition-colors px-3 py-2">
            Cancelar
          </button>
        </div>
        {isEdit && (
          <button type="button" onClick={handleDelete} className="text-red-400 hover:text-red-300 text-sm transition-colors">
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
