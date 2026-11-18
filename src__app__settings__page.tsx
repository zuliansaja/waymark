'use client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Shell from '@/components/Shell';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
function Body({ user }: { user: User }) {
  const [units, setUnits] = useState('km'); const [notif, setNotif] = useState(true); const [stats, setStats] = useState({ trips: 0, saved: 0 }); const [msg, setMsg] = useState(''); const [layer, setLayer] = useState('osm');
  useEffect(() => { (async () => {
    const { data } = await supabase.from('user_preferences').select('*').maybeSingle(); if (data) { setUnits(data.units); setNotif(data.notifications); setLayer(data.map_layer ?? 'osm'); localStorage.setItem('map_layer', data.map_layer ?? 'osm'); localStorage.setItem('waymark_notif_off', data.notifications ? '0' : '1'); }
    const t = await supabase.from('trips').select('id', { count: 'exact', head: true }); const s = await supabase.from('saved_locations').select('id', { count: 'exact', head: true });
    setStats({ trips: t.count ?? 0, saved: s.count ?? 0 });
  })(); }, []);
  const save = async (u: string, n: boolean) => {
    setUnits(u); setNotif(n); localStorage.setItem('units', u); localStorage.setItem('waymark_notif_off', n ? '0' : '1');
    if (n && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    const { error } = await supabase.from('user_preferences').upsert({ user_id: user.id, units: u, notifications: n }); setMsg(error ? error.message : 'Tersimpan.');
  };
  const wipe = async () => { if (!confirm('Hapus semua riwayat perjalanan?')) return; const { error } = await supabase.from('trips').delete().eq('user_id', user.id); setMsg(error ? error.message : 'Riwayat dihapus.'); setStats((s) => ({ ...s, trips: 0 })); };
  const m = user.user_metadata;
  return (<>
    <div className="card flex items-center gap-3 p-3">{m.avatar_url && <img src={m.avatar_url} alt="" className="h-12 w-12 rounded-full" />}<div><p className="font-semibold">{m.full_name ?? 'Pengguna'}</p><p className="text-xs text-gray-500">{user.email}</p></div></div>
    <div className="grid grid-cols-2 gap-2 text-center"><div className="card p-3"><b>{stats.trips}</b><p className="text-xs text-gray-500">Perjalanan</p></div><div className="card p-3"><b>{stats.saved}</b><p className="text-xs text-gray-500">Lokasi tersimpan</p></div></div>
    <div className="card divide-y divide-line text-sm">
      <label className="flex items-center justify-between p-3">Satuan jarak<select value={units} onChange={(e) => save(e.target.value, notif)} className="rounded-lg border border-line px-2 py-1"><option value="km">Kilometer</option><option value="mi">Mil</option></select></label>
      <label className="flex items-center justify-between p-3">Notifikasi<input type="checkbox" checked={notif} onChange={(e) => save(units, e.target.checked)} className="h-5 w-5" /></label>
      <label className="flex items-center justify-between p-3">Layer peta<select value={layer} onChange={async (e) => { setLayer(e.target.value); localStorage.setItem('map_layer', e.target.value); const { error } = await supabase.from('user_preferences').upsert({ user_id: user.id, map_layer: e.target.value }); setMsg(error ? error.message : 'Tersimpan.'); }} className="rounded-lg border border-line px-2 py-1"><option value="osm">Standar</option><option value="topo">Topografi</option><option value="cyclo">Sepeda</option></select></label>
      <Link href="/notifications" className="block p-3">Lihat notifikasi</Link>
      <button onClick={wipe} className="w-full p-3 text-left text-red-600">Hapus riwayat perjalanan</button>
      <button onClick={() => supabase.auth.signOut().then(() => location.assign('/'))} className="w-full p-3 text-left">Keluar</button>
    </div>
    {msg && <p className="text-center text-xs text-gray-500">{msg}</p>}
  </>);
}
export default function Settings() { return <Shell title="Pengaturan">{(u) => <Body user={u} />}</Shell>; }
