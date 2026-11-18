'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, X, Search, Save } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { geocode, getRoutes, fmtKm, fmtMin, type Place, type Route } from '@/lib/osm';
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });
export default function Multi() {
  const go = useRouter();
  const [stops, setStops] = useState<Place[]>([]); const [user, setUser] = useState<[number, number]>(); const [q, setQ] = useState(''); const [res, setRes] = useState<Place[]>([]);
  const [route, setRoute] = useState<Route>(); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { setStops(JSON.parse(localStorage.getItem('waymark_stops') ?? '[]')); navigator.geolocation.getCurrentPosition((p) => setUser([p.coords.latitude, p.coords.longitude]), () => setMsg('GPS tidak tersedia; titik awal memakai lokasi GPS.')); }, []);
  const set = (s: Place[]) => { setStops(s); setRoute(undefined); localStorage.setItem('waymark_stops', JSON.stringify(s)); };
  const move = (i: number, d: number) => { const s = [...stops]; [s[i], s[i + d]] = [s[i + d], s[i]]; set(s); };
  const find = async () => { setBusy(true); setMsg(''); try { const r = await geocode(q, user); setRes(r); if (!r.length) setMsg('Tidak ada hasil.'); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); } };
  const calc = async () => { if (!user) return setMsg('Aktifkan GPS (titik awal).'); if (!stops.length) return setMsg('Tambahkan minimal 1 tujuan.'); setBusy(true); setMsg(''); try { setRoute((await getRoutes([user, ...stops.map((s) => [s.lat, s.lon] as [number, number])], 'driving'))[0]); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); } };
  const start = () => { sessionStorage.setItem('waymark_nav', JSON.stringify({ route, dest: stops[stops.length - 1], mode: 'driving' })); go.push('/navigate'); };
  const save = async () => { const { data: u } = await supabase.auth.getUser(); if (!u.user) return setMsg('Login dulu untuk menyimpan rute.'); const { error } = await supabase.from('saved_routes').insert({ name: stops.map((s) => s.name).join(' → ').slice(0, 80), stops, mode: 'driving' }); setMsg(error ? error.message : 'Rute disimpan.'); };
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line px-4 py-3 font-semibold text-teal">Rute Multi-Tujuan</header>
      <main className="flex-1 space-y-3 overflow-y-auto bg-surface p-3">
        <div className="card flex items-center gap-2 px-3 py-2"><Search size={18} className="text-gray-400" /><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && find()} placeholder="Cari tujuan untuk ditambahkan" className="flex-1 bg-transparent text-sm outline-none" /></div>
        {res.map((p) => <button key={p.id} onClick={() => { set([...stops, p]); setRes([]); setQ(''); }} className="card w-full p-2 text-left text-sm"><b>{p.name}</b><p className="line-clamp-1 text-xs text-gray-500">{p.address}</p></button>)}
        <div className="card divide-y divide-line">
          <p className="p-3 text-sm text-gray-500">Mulai: lokasi saya {user ? '' : '(menunggu GPS)'}</p>
          {stops.length === 0 && <p className="p-3 text-center text-sm text-gray-500">Belum ada tujuan.</p>}
          {stops.map((s, i) => <div key={s.id + i} className="flex items-center gap-2 p-3 text-sm"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs text-white">{i + 1}</span><span className="flex-1 truncate">{s.name}</span>
            <button disabled={i === 0} onClick={() => move(i, -1)} className="disabled:opacity-30" aria-label="Naik"><ArrowUp size={18} /></button>
            <button disabled={i === stops.length - 1} onClick={() => move(i, 1)} className="disabled:opacity-30" aria-label="Turun"><ArrowDown size={18} /></button>
            <button onClick={() => set(stops.filter((_, k) => k !== i))} aria-label="Hapus"><X size={18} className="text-red-500" /></button></div>)}
        </div>
        <button className="btn w-full" disabled={busy} onClick={calc}>{busy ? 'Memuat…' : 'Hitung rute'}</button>
        {msg && <p className="text-sm text-red-600">{msg}</p>}
        {route && <>
          <div className="card flex justify-between p-3 text-sm"><span>Total jarak <b>{fmtKm(route.distance)}</b></span><span>Estimasi <b>{fmtMin(route.duration)}</b></span></div>
          <div className="card h-56 overflow-hidden"><MapView center={user!} user={user} places={[]} selected={undefined} routes={[route]} active={0} onPick={() => {}} /></div>
          <div className="flex gap-2"><button className="btn flex-1" onClick={start}>Mulai Navigasi</button><button className="flex items-center gap-1 rounded-xl border border-line bg-white px-3 text-sm" onClick={save}><Save size={16} />Simpan</button></div>
          <p className="text-xs text-gray-500">Navigasi aktif mengarah ke tujuan terakhir mengikuti garis rute multi-tujuan.</p></>}
      </main>
      <BottomNav />
    </div>
  );
}
