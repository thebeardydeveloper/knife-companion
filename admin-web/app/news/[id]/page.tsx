'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { NewsForm } from '@/components/NewsForm';
import { supabase } from '@/lib/supabase';
import type { NewsArticle } from '@/lib/supabase';

export default function EditNewsPage() {
  const { id } = useParams<{ id: string }>();
  const [article,  setArticle]  = useState<NewsArticle | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.from('news_articles').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) setNotFound(true);
      else setArticle(data as NewsArticle);
      setLoading(false);
    });
  }, [id]);

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center gap-2 text-sm text-forge-muted mb-6">
          <Link href="/news" className="hover:text-forge-text transition-colors">Noticias</Link>
          <span>/</span>
          <span className="text-forge-text">Editar</span>
        </div>
        <h1 className="text-xl font-bold text-forge-text tracking-tight mb-8">Editar noticia</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notFound ? (
          <p className="text-forge-muted text-sm">
            Noticia no encontrada.{' '}
            <Link href="/news" className="text-forge-accent hover:underline">Volver</Link>
          </p>
        ) : (
          <NewsForm article={article!} />
        )}
      </div>
    </AdminLayout>
  );
}
