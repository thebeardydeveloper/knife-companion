'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { supabase } from '@/lib/supabase';
import type { NewsArticle } from '@/lib/supabase';

interface Props {
  article?: NewsArticle;
}

async function uploadCover(file: File): Promise<string> {
  const ext  = file.name.split('.').pop() ?? 'jpg';
  const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('news-covers')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('news-covers').getPublicUrl(path);
  return data.publicUrl;
}

export function NewsForm({ article }: Props) {
  const router  = useRouter();
  const isEdit  = !!article;

  const [title,        setTitle]        = useState(article?.title     ?? '');
  const [bodyHtml,     setBodyHtml]     = useState(article?.body_html ?? '');
  const [coverUrl,     setCoverUrl]     = useState(article?.cover_url ?? '');
  const [coverPreview, setCoverPreview] = useState(article?.cover_url ?? '');
  const [publish,      setPublish]      = useState(!!article?.published_at);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  const coverInputRef = useRef<HTMLInputElement>(null);

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately
    setCoverPreview(URL.createObjectURL(file));
    setUploadingCover(true);
    try {
      const url = await uploadCover(file);
      setCoverUrl(url);
    } catch (err: any) {
      setError('Error subiendo portada: ' + err.message);
      setCoverPreview(coverUrl);
    } finally {
      setUploadingCover(false);
    }
    e.target.value = '';
  }

  function removeCover() {
    setCoverUrl('');
    setCoverPreview('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!bodyHtml || bodyHtml === '<p></p>') {
      setError('El contenido no puede estar vacío.');
      return;
    }
    setError('');
    setSaving(true);

    const payload = {
      title:        title.trim(),
      body_html:    bodyHtml,
      cover_url:    coverUrl || null,
      published_at: publish
        ? (article?.published_at ?? new Date().toISOString())
        : null,
    };

    let err;
    if (isEdit) {
      ({ error: err } = await supabase
        .from('news_articles')
        .update(payload)
        .eq('id', article!.id));
    } else {
      ({ error: err } = await supabase
        .from('news_articles')
        .insert(payload));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    router.push('/news');
    router.refresh();
  }

  async function handleDelete() {
    if (!article) return;
    if (!confirm('¿Eliminar esta noticia?')) return;
    await supabase.from('news_articles').delete().eq('id', article.id);
    router.push('/news');
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted uppercase tracking-wider">Título *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={160}
          placeholder="Título de la noticia..."
          className="w-full bg-forge-elevated border border-forge-border rounded-lg px-4 py-2.5 text-forge-text text-sm placeholder-forge-muted focus:border-forge-accent transition-colors"
        />
      </div>

      {/* Cover image */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted uppercase tracking-wider">
          Imagen de portada <span className="normal-case">(opcional)</span>
        </label>

        {coverPreview ? (
          <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-forge-border bg-forge-elevated">
            <img
              src={coverPreview}
              alt="Portada"
              className="w-full h-full object-cover"
            />
            {uploadingCover && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!uploadingCover && (
              <button
                type="button"
                onClick={removeCover}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="w-full border-2 border-dashed border-forge-border hover:border-forge-accent rounded-xl py-8 flex flex-col items-center gap-2 text-forge-muted hover:text-forge-text transition-colors"
          >
            <ImagePlus size={28} />
            <span className="text-sm">Subir imagen de portada</span>
            <span className="text-xs opacity-60">JPG, PNG, WebP — recomendado 1200×600px</span>
          </button>
        )}

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
      </div>

      {/* Body — WYSIWYG */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted uppercase tracking-wider">Contenido *</label>
        <RichTextEditor
          content={bodyHtml}
          onChange={setBodyHtml}
          placeholder="Escribí el contenido de la noticia..."
        />
      </div>

      {/* Publish toggle */}
      <div className="flex items-center gap-3 py-3 px-4 bg-forge-elevated border border-forge-border rounded-lg">
        <button
          type="button"
          onClick={() => setPublish(!publish)}
          className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${publish ? 'bg-forge-accent' : 'bg-forge-border'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${publish ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        <div>
          <p className="text-sm text-forge-text font-medium">{publish ? 'Publicado' : 'Borrador'}</p>
          <p className="text-xs text-forge-muted">
            {publish
              ? isEdit && article?.published_at
                ? `Publicado el ${new Date(article.published_at).toLocaleString('es-AR')}`
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
          <button
            type="submit"
            disabled={saving || uploadingCover}
            className="bg-forge-accent hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-opacity"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear noticia'}
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
          <button type="button" onClick={handleDelete} className="text-red-400 hover:text-red-300 text-sm transition-colors">
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
