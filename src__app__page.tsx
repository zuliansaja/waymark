'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Navigation, Bookmark, LogIn, LocateFixed, Layers, Compass, Share2, Plus, ListOrdered, Car, Bike, Footprints } from 'lucide-react';
import { CATS, geocode, nearby, getRoutes, fmtKm, fmtMin, haversine, type Place, type Route, type Mode } from '@/lib/osm';
import { supabase, supabaseReady } from '@/lib/supabase';
import { getPlace, setPlace } from '@/lib/nav';
import { notify } from '@/lib/notify';
import BottomNav from '@/components/BottomNav';
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });
export default function Home() {
  const [center, setCenter] = useState<[number, number]>([-6.9175, 107.6191]);
  const [user, setUser] = useState<[number, number]>();
  const [q, setQ] = useState(''); const [places, setPlaces] = useState<Place[]>([]);
  const [sel, setSel] = useState<Place>(); const [routes, setRoutes] = useState<Route[]>([]); const [ai, setAi] = useState(0);
  const [mode, setMode] = useState<Mode>('driving'); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const nav = useRouter();
  const [layer, setLayer] = useState<'osm' | 'topo' | 'cyclo'>('osm'); const [heading, setHeading] = useState<number | null>(null);
  useEffect(() => { const l = localStorage.getItem('map_layer'); if (l === 'topo' || l === 'cyclo') setLayer(l); }, []);
  const run = async (f: () => Promise<void>) => { setBusy(true); setMsg(''); try { await f(); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); } };
  const locate = () => navigator.geolocation.getCurrentPosition((p) => { const c: [number, number] = [p.coords.latitude, p.coords.longitude]; setUser(c); setCenter(c); }, () => setMsg('GPS tidak tersedia atau izin ditolak.'), { enableHighAccuracy: true });
  useEffect(() => { locate(); const p = getPlace(); if (p && sessionStorage.getItem('waymark_show')) { sessionStorage.removeItem('waymark_show'); setSel(p); setPlaces([p]); setCenter([p.lat, p.lon]); } }, []);
  const pick = useCallback((p: Place) => { setSel(p); setRoutes([]); }, []);
  const search = () => q && run(async () => { const r = await geocode(q, center); if (!r.length) setMsg('Tidak ada hasil.'); setPlaces(r); setSel(undefined); setRoutes([]); if (r[0]) setCenter([r[0].lat, r[0].lon]); });
  const cat = (k: string) => run(async () => { const r = await nearby(k, user ?? center); if (!r.length) setMsg('Tidak ada tempat di sekitar.'); setPlaces(r); });
  const route = (m: Mode = mode) => { if (!sel || !user) return setMsg('Pilih tempat dan aktifkan GPS untuk membuat rute.'); setMode(m); run(async () => { setRoutes(await getRoutes([user, [sel.lat, sel.lon]], m)); setAi(0); }); };
  const save = () => run(async () => {
    const { data } = await supabase.auth.getUser(); if (!data.user) { setMsg('Login dulu untuk menyimpan lokasi.'); return; }
    const { error } = await supabase.from('saved_locations').insert({ name: sel!.name, lat: sel!.lat, lon: sel!.lon });
    setMsg(error ? error.message : 'Lokasi disimpan.'); if (!error) notify('location', 'Lokasi disimpan', sel!.name);
  });
  const login = () => { if (!supabaseReady) return setMsg('Supabase belum dikonfigurasi (.env.local).'); supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin } }); };
  const share = () => { const u = `https://www.openstreetmap.org/?mlat=${sel!.lat}&mlon=${sel!.lon}#map=17/${sel!.lat}/${sel!.lon}`; if (navigator.share) navigator.share({ title: sel!.name, url: u }).catch(() => {}); else navigator.clipboard.writeText(u).then(() => setMsg('Link disalin.')); };
  const startNav = () => { sessionStorage.setItem('waymark_nav', JSON.stringify({ route: routes[ai], dest: sel, mode })); nav.push('/navigate'); };
  const addStop = () => { const l = JSON.parse(localStorage.getItem('waymark_stops') ?? '[]'); localStorage.setItem('waymark_stops', JSON.stringify([...l, sel])); setMsg('Ditambahkan ke multi-stop.'); };
  useEffect(() => { if (user && sel && sessionStorage.getItem('waymark_auto')) { sessionStorage.removeItem('waymark_auto'); route(); } }, [user, sel]);
  const cycle = () => { const n = layer === 'osm' ? 'topo' : layer === 'topo' ? 'cyclo' : 'osm'; setLayer(n); localStorage.setItem('map_layer', n); setMsg(`Layer: ${n === 'osm' ? 'Standar' : n === 'topo' ? 'Topografi' : 'Sepeda'}`); };
  const compass = async () => {
    const D = DeviceOrientationEvent as any;
    if (typeof D?.requestPermission === 'function') { try { if ((await D.requestPermission()) !== 'granted') return; } catch { return; } }
    const h = (e: any) => { const v = e.webkitCompassHeading ?? (e.alpha != null ? 360 - e.alpha : null); if (v != null) setHeading(v); };
    window.addEventListener('deviceorientationabsolute' as any, h, true); window.addEventListener('deviceorientation', h, true); locate();
  };
  const r = routes[ai];
  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        <MapView layer={layer} center={center} user={user} places={places} selected={sel} routes={routes} active={ai} onPick={pick} />
        <div className="absolute inset-x-3 top-3 z-[1000] space-y-2">
          <div className="card flex items-center gap-2 px-3 py-2"><Link href="/search" aria-label="Cari"><Search size={18} className="text-gray-500" /></Link>
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Cari lokasi atau tempat..." className="flex-1 bg-transparent text-sm outline-none" />
            <Link href="/multistop" aria-label="Multi-stop"><ListOrdered size={18} className="text-gray-500" /></Link><button onClick={login} aria-label="Login Google"><LogIn size={18} className="text-teal" /></button></div>
          <div className="flex gap-2 overflow-x-auto pb-1"><Link href="/nearby" className="card flex shrink-0 items-center gap-1 bg-teal px-3 py-1.5 text-xs text-white">Terdekat</Link>{CATS.map(({ key, label, Icon, color }) => (
            <button key={key} onClick={() => cat(key)} className="card flex shrink-0 items-center gap-1 px-3 py-1.5 text-xs"><Icon size={14} color={color} />{label}</button>))}</div>
        </div>
        <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-2"><button onClick={cycle} className="card p-2.5" aria-label="Layer peta"><Layers size={20} /></button><button onClick={compass} className="card p-2.5" aria-label="Kompas"><Compass size={20} style={{ transform: `rotate(${-(heading ?? 0)}deg)` }} /></button><button onClick={locate} className="card p-2.5" aria-label="Lokasi saya"><LocateFixed size={20} /></button></div>
        {(msg || busy) && <div className="card absolute inset-x-3 bottom-16 z-[1000] px-3 py-2 text-sm">{busy ? 'Memuat…' : msg}</div>}
      </div>
      {sel && (
        <div className="card m-2 space-y-2 p-3">
          <div onClick={() => { setPlace(sel); nav.push('/place'); }} className="cursor-pointer"><p className="font-semibold">{sel.name} <span className="text-xs font-normal text-brand">Detail ›</span></p><p className="line-clamp-1 text-xs text-gray-500">{sel.address ?? `${sel.lat.toFixed(5)}, ${sel.lon.toFixed(5)}`}{user && ` • ${fmtKm(haversine(user, [sel.lat, sel.lon]))}`}</p></div>
          {r && <p className="text-sm"><b>{fmtMin(r.duration)}</b> • {fmtKm(r.distance)} {routes.length > 1 && routes.map((_, i) => <button key={i} onClick={() => setAi(i)} className={`ml-1 rounded-full border px-2 text-xs ${i === ai ? 'border-brand text-brand' : 'border-line'}`}>Rute {i + 1}</button>)}</p>}
          {r && <button className="btn w-full" onClick={startNav}>Mulai Navigasi</button>}
          <div className="flex items-center gap-2">
            {([['driving', Car], ['cycling', Bike], ['walking', Footprints]] as const).map(([m, I]) => (
              <button key={m} onClick={() => route(m)} className={`rounded-xl border p-2 ${mode === m && r ? 'border-brand text-brand' : 'border-line'}`}><I size={18} /></button>))}
            <button className="btn flex flex-1 items-center justify-center gap-1" onClick={() => route()}><Navigation size={16} />Rute</button>
            <button onClick={save} className="rounded-xl border border-line p-2" aria-label="Simpan"><Bookmark size={18} /></button>
            <button onClick={share} className="rounded-xl border border-line p-2" aria-label="Bagikan"><Share2 size={18} /></button>
            <button onClick={addStop} className="rounded-xl border border-line p-2" aria-label="Tambah ke multi-stop"><Plus size={18} /></button>
          </div>
        </div>)}
      <BottomNav />
    </div>
  );
}
