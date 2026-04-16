'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { AnnouncementForm } from '@/components/AnnouncementForm';

export default function NewAnnouncementPage() {
  return (
    <AdminLayout>
      <div className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-forge-muted mb-6">
          <Link href="/announcements" className="hover:text-forge-text transition-colors">
            Novedades
          </Link>
          <span>/</span>
          <span className="text-forge-text">Nuevo anuncio</span>
        </div>

        <h1 className="text-xl font-bold text-forge-text tracking-tight mb-8">
          Nuevo anuncio
        </h1>

        <AnnouncementForm />
      </div>
    </AdminLayout>
  );
}
