'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import type { Announcement, AnnouncementType } from '@/lib/supabase';

const TYPE_LABEL: Record<AnnouncementType, string> = {
  news:    'Noticia',
  update:  'Actualización',
  feature: 'Feature',
  event:   'Evento',
};

const TYPE_COLOR: Record<AnnouncementType, string> = {
  news:    '#E8571A',
  update:  '#5BB8F5',
  feature: '#A87FE8',
  event:   '#4CAF7D',
};

export default function AnnouncementsPage() {
  const [items,   setItems]   = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    setItems((data as Announcement[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(item: Announcement) {
    const published_at = item.published_at ? null : new Date().toISOString();
    await supabase
      .from('announcements')
      .update({ published_at })
      .eq('id', item.id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este anuncio?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    load();
  }

  const drafts    = items.filter((a) => !a.published_at);
  const published = items.filter((a) => !!a.published_at);

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-forge-text tracking-tight">Novedades</h1>
            <p className="text-forge-muted text-sm mt-0.5">
              {items.length} anuncio{items.length !== 1 ? 's' : ''} en total
            </p>
          </div>
          <Link
            href="/announcements/new"
            className="bg-forge-accent hover:opacity-90 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-opacity"
          >
            + Nuevo anuncio
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-forge-muted">
            <p className="text-4xl mb-3">🔔</p>
            <p>No hay anuncios todavía.</p>
            <Link href="/announcements/new" className="text-forge-accent hover:underline text-sm mt-2 inline-block">
              Crear el primero
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {drafts.length > 0 && (
              <Section
                title="Borradores"
                items={drafts}
                onTogglePublish={togglePublish}
                onDelete={handleDelete}
              />
            )}
            {published.length > 0 && (
              <Section
                title="Publicados"
                items={published}
                onTogglePublish={togglePublish}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ── Table section ─────────────────────────────────────────────────────────────

function Section({
  title, items, onTogglePublish, onDelete,
}: {
  title: string;
  items: Announcement[];
  onTogglePublish: (a: Announcement) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-forge-muted uppercase tracking-widest mb-3">
        {title}
      </h2>
      <div className="bg-forge-surface border border-forge-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-forge-border">
              <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider">Título</th>
              <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider hidden md:table-cell">Fecha</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={item.id}
                className={`border-b border-forge-border last:border-0 hover:bg-forge-elevated transition-colors ${i % 2 === 0 ? '' : 'bg-forge-bg/30'}`}
              >
                {/* Type */}
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border"
                    style={{
                      color: TYPE_COLOR[item.type],
                      borderColor: TYPE_COLOR[item.type] + '55',
                      backgroundColor: TYPE_COLOR[item.type] + '18',
                    }}
                  >
                    {TYPE_LABEL[item.type]}
                  </span>
                </td>

                {/* Title */}
                <td className="px-4 py-3">
                  <p className="text-forge-text font-medium truncate max-w-xs">{item.title}</p>
                  <p className="text-forge-muted text-xs truncate max-w-xs mt-0.5">{item.body}</p>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-forge-muted hidden md:table-cell whitespace-nowrap">
                  {item.published_at
                    ? new Date(item.published_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : <span className="text-forge-muted/50 italic">—</span>
                  }
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onTogglePublish(item)}
                      className={`text-xs font-medium px-2.5 py-1 rounded border transition-colors ${
                        item.published_at
                          ? 'border-forge-border text-forge-muted hover:text-forge-text hover:border-forge-muted'
                          : 'border-green-600/40 text-green-400 hover:bg-green-400/10'
                      }`}
                    >
                      {item.published_at ? 'Despublicar' : 'Publicar'}
                    </button>
                    <Link
                      href={`/announcements/${item.id}`}
                      className="text-xs text-forge-muted hover:text-forge-text transition-colors px-2 py-1 rounded border border-forge-border hover:border-forge-muted"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
