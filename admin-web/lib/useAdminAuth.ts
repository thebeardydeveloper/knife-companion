'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'forbidden';

export function useAdminAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState('unauthenticated');
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_admin) {
        setState('forbidden');
        return;
      }

      setUser(session.user);
      setState('authenticated');
    }

    check();
  }, [router]);

  return { state, user };
}
