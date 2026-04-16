'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { AnnouncementForm } from '@/components/AnnouncementForm';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/supabase';

export default function EditAnnouncementPage() {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();

      if (!data) {
        setNotFound(true);
      } else {
        setAnnouncement(data as Announcement);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-forge-muted mb-6">
          <Link href="/announcements" className="hover:text-forge-text transition-colors">
            Novedades
          </Link>
          <span>/</span>
          <span className="text-forge-text">Editar</span>
        </div>

        <h1 className="text-xl font-bold text-forge-text tracking-tight mb-8">
          Editar anuncio
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notFound ? (
          <div className="text-forge-muted text-sm">
            Anuncio no encontrado.{' '}
            <Link href="/announcements" className="text-forge-accent hover:underline">
              Volver
            </Link>
          </div>
        ) : (
          <AnnouncementForm announcement={announcement!} />
        )}
      </div>
    </AdminLayout>
  );
}
