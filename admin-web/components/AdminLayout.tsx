'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/announcements', label: 'Novedades',  icon: '🔔' },
  { href: '/news',          label: 'Noticias',   icon: '📰' },
  { href: '/posts',         label: 'Posts',      icon: '🖼️' },
  { href: '/ranks',         label: 'Rangos',     icon: '🏆' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { state, user } = useAdminAuth();
  const pathname = usePathname();
  const router   = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forge-bg">
        <div className="w-8 h-8 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forge-bg">
        <div className="text-center space-y-3">
          <p className="text-4xl">🔒</p>
          <p className="text-forge-text text-lg font-semibold">Access denied</p>
          <p className="text-forge-muted text-sm">Your account doesn't have admin privileges.</p>
          <button
            onClick={handleSignOut}
            className="mt-4 text-sm text-forge-accent hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (state === 'unauthenticated') return null;

  return (
    <div className="min-h-screen flex bg-forge-bg">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-forge-border bg-forge-surface flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-forge-border">
          <span className="text-forge-accent font-bold tracking-widest text-sm uppercase">
            KC Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${active
                    ? 'bg-forge-accent-dim text-forge-accent border-l-2 border-forge-accent'
                    : 'text-forge-muted hover:text-forge-text hover:bg-forge-elevated'
                  }
                `}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-forge-border">
          <p className="text-forge-muted text-xs truncate mb-2">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="text-xs text-forge-muted hover:text-forge-text transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
