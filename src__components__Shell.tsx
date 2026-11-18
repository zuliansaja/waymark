'use client';
import type { User } from '@supabase/supabase-js';
import { useUser, login } from '@/lib/useUser';
import { supabaseReady } from '@/lib/supabase';
import BottomNav from './BottomNav';
export default function Shell({ title, children }: { title: string; children: (u: User) => React.ReactNode }) {
  const { user, ready } = useUser();
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line px-4 py-3 font-semibold text-teal">{title}</header>
      <main className="flex-1 space-y-3 overflow-y-auto bg-surface p-3">
        {!ready ? <p className="text-sm text-gray-500">Memuat…</p>
          : !supabaseReady ? <p className="card p-4 text-sm">Supabase belum dikonfigurasi. Isi .env.local.</p>
          : !user ? <div className="card space-y-2 p-4 text-center text-sm"><p>Masuk untuk menyinkronkan data Anda.</p><button className="btn" onClick={login}>Masuk dengan Google</button></div>
          : children(user)}
      </main>
      <BottomNav />
    </div>
  );
}
