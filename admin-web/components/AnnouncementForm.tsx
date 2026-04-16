'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Announcement, AnnouncementType } from '@/lib/supabase';

const TYPE_OPTIONS: { value: AnnouncementType; label: string; color: string }[] = [
  { value: 'news',    label: 'Noticia',       color: '#E8571A' },
  { value: 'update',  label: 'Actualización', color: '#5BB8F5' },
  { value: 'feature', label: 'Nuevo feature', color: '#A87FE8' },
  { value: 'event',   label: 'Evento',        color: '#4CAF7D' },
];

interface Props {
  announcement?: Announcement; // Si viene → modo edición
}

export function AnnouncementForm({ announcement }: Props) {
  const router  = useRouter();
  const isEdit  = !!announcement;

  const [title,    setTitle]    = useState(announcement?.title    ?? '');
  const [body,     setBody]     = useState(announcement?.body     ?? '');
  const [type,     setType]     = useState<AnnouncementType>(announcement?.type ?? 'news');
  const [postId,   setPostId]   = useState(announcement?.post_id  ?? '');
  const [publish,  setPublish]  = useState(!!announcement?.published_at);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      title:        title.trim(),
      body:         body.trim(),
      type,
      post_id:      postId.trim() || null,
      published_at: publish ? (announcement?.published_at ?? new Date().toISOString()) : null,
    };

    let err;
    if (isEdit) {
      ({ error: err } = await supabase
        .from('announcements')
        .update(payload)
        .eq('id', announcement!.id));
    } else {
      ({ error: err } = await supabase
        .from('announcements')
        .insert(payload));
    }

    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }

    router.push('/announcements');
    router.refresh();
  }

  async function handleDelete() {
    if (!announcement) return;
    if (!confirm('¿Eliminar este anuncio? Esta acción no se puede deshacer.')) return;
    await supabase.from('announcements').delete().eq('id', announcement.id);
    router.push('/announcements');
    router.refresh();
  }

  const selectedType = TYPE_OPTIONS.find((t) => t.value === type)!;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted uppercase tracking-wider">Título *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
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
          required
          rows={5}
          placeholder="Escribí el contenido del anuncio..."
          className="w-full bg-forge-elevated border border-forge-border rounded-lg px-4 py-2.5 text-forge-text text-sm placeholder-forge-muted focus:border-forge-accent transition-colors resize-y min-h-[100px]"
        />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted uppercase tracking-wider">Tipo</label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border transition-all"
              style={
                type === opt.value
                  ? { backgroundColor: opt.color + '22', borderColor: opt.color, color: opt.color }
                  : { backgroundColor: 'transparent', borderColor: '#2C2A27', color: '#8A837A' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post ID */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted uppercase tracking-wider">
          Link a post <span className="normal-case text-forge-muted">(opcional — UUID del post)</span>
        </label>
        <input
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="w-full bg-forge-elevated border border-forge-border rounded-lg px-4 py-2.5 text-forge-text text-sm placeholder-forge-muted focus:border-forge-accent transition-colors font-mono"
        />
      </div>

      {/* Publish toggle */}
      <div className="flex items-center gap-3 py-3 px-4 bg-forge-elevated border border-forge-border rounded-lg">
        <button
          type="button"
          onClick={() => setPublish(!publish)}
          className={`
            relative w-10 h-5 rounded-full transition-colors flex-shrink-0
            ${publish ? 'bg-forge-accent' : 'bg-forge-border'}
          `}
        >
          <span
            className={`
              absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
              ${publish ? 'translate-x-5' : 'translate-x-0.5'}
            `}
          />
        </button>
        <div>
          <p className="text-sm text-forge-text font-medium">
            {publish ? 'Publicado' : 'Borrador'}
          </p>
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
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-forge-accent hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-opacity"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear anuncio'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-forge-muted hover:text-forge-text text-sm transition-colors px-3 py-2"
          >
            Cancelar
          </button>
        </div>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
