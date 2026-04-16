'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import type { NewsArticle } from '@/lib/supabase';

export default function NewsPage() {
  const [items,   setItems]   = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false });
    setItems((data as NewsArticle[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(item: NewsArticle) {
    const published_at = item.published_at ? null : new Date().toISOString();
    await supabase.from('news_articles').update({ published_at }).eq('id', item.id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta noticia?')) return;
    await supabase.from('news_articles').delete().eq('id', id);
    load();
  }

  const drafts    = items.filter((a) => !a.published_at);
  const published = items.filter((a) => !!a.published_at);

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-forge-text tracking-tight">Noticias</h1>
            <p className="text-forge-muted text-sm mt-0.5">{items.length} artículo{items.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/news/new" className="bg-forge-accent hover:opacity-90 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-opacity">
            + Nueva noticia
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-forge-muted">
            <p className="text-4xl mb-3">📰</p>
            <p>No hay noticias todavía.</p>
            <Link href="/news/new" className="text-forge-accent hover:underline text-sm mt-2 inline-block">Crear la primera</Link>
          </div>
        ) : (
          <div className="space-y-8">
            {drafts.length > 0 && <NewsSection title="Borradores" items={drafts} onToggle={togglePublish} onDelete={handleDelete} />}
            {published.length > 0 && <NewsSection title="Publicadas" items={published} onToggle={togglePublish} onDelete={handleDelete} />}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function NewsSection({ title, items, onToggle, onDelete }: {
  title: string;
  items: NewsArticle[];
  onToggle: (a: NewsArticle) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-forge-muted uppercase tracking-widest mb-3">{title}</h2>
      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 bg-forge-surface border border-forge-border rounded-xl p-4 hover:border-forge-muted transition-colors">
            {/* Cover thumb */}
            <div className="w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-forge-elevated border border-forge-border">
              {item.cover_url
                ? <img src={item.cover_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-forge-muted text-xl">📰</div>
              }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-forge-text font-semibold text-sm truncate">{item.title}</p>
              <p className="text-forge-muted text-xs mt-0.5">
                {item.published_at
                  ? `Publicado el ${new Date(item.published_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'Borrador'
                }
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onToggle(item)}
                className={`text-xs font-medium px-2.5 py-1 rounded border transition-colors ${
                  item.published_at
                    ? 'border-forge-border text-forge-muted hover:text-forge-text'
                    : 'border-green-600/40 text-green-400 hover:bg-green-400/10'
                }`}
              >
                {item.published_at ? 'Despublicar' : 'Publicar'}
              </button>
              <Link
                href={`/news/${item.id}`}
                className="text-xs text-forge-muted hover:text-forge-text px-2.5 py-1 rounded border border-forge-border hover:border-forge-muted transition-colors"
              >
                Editar
              </Link>
              <button onClick={() => onDelete(item.id)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
