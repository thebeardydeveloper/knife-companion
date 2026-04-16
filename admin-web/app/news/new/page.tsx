'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { NewsForm } from '@/components/NewsForm';

export default function NewNewsPage() {
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center gap-2 text-sm text-forge-muted mb-6">
          <Link href="/news" className="hover:text-forge-text transition-colors">Noticias</Link>
          <span>/</span>
          <span className="text-forge-text">Nueva noticia</span>
        </div>
        <h1 className="text-xl font-bold text-forge-text tracking-tight mb-8">Nueva noticia</h1>
        <NewsForm />
      </div>
    </AdminLayout>
  );
}
