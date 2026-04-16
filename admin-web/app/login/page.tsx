'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    router.replace('/announcements');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge-bg px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="text-forge-accent font-bold tracking-widest text-lg uppercase">
            KC Admin
          </span>
          <p className="text-forge-muted text-sm mt-1">Panel de administración</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-forge-surface border border-forge-border rounded-xl p-6 space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs text-forge-muted uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full bg-forge-elevated border border-forge-border rounded-lg px-3 py-2 text-forge-text text-sm placeholder-forge-muted focus:border-forge-accent transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-forge-muted uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-forge-elevated border border-forge-border rounded-lg px-3 py-2 text-forge-text text-sm placeholder-forge-muted focus:border-forge-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forge-accent hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-opacity"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
