'use client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseReady } from './supabase';
export function useUser() {
  const [user, setUser] = useState<User | null>(null); const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!supabaseReady) { setReady(true); return; }
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setReady(true); });
    const { data: s } = supabase.auth.onAuthStateChange((_, se) => setUser(se?.user ?? null));
    return () => s.subscription.unsubscribe();
  }, []);
  return { user, ready };
}
export const login = () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin } });
