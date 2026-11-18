'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Clock } from 'lucide-react';
import { CATS, geocode, nearby, haversine, type Place } from '@/lib/osm';
import { addRecent, getRecent, setPlace, showOnMap } from '@/lib/nav';
import PlaceRow from '@/components/PlaceRow';
export default function SearchPage() {
  const go = useRouter();
  const [q, setQ] = useState(''); const [cat, setCat] = useState(''); const [res, setRes] = useState<Place[]>([]); const [recent, setRecent] = useState<string[]>([]);
  const [user, setUser] = useState<[number, number]>(); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [done, setDone] = useState(false);
  useEffect(() => { getRecent().then(setRecent); navigator.geolocation.getCurrentPosition((p) => setUser([p.coords.latitude, p.coords.longitude]), () => setMsg('GPS tidak tersedia; jarak tidak ditampilkan.')); }, []);
  const run = async (query = q, c = cat) => {
    if (!query.trim() && !c) return; setBusy(true); setMsg(''); setDone(false);
    try {
      let r: Place[];
      if (query.trim()) { r = await geocode(query.trim(), user); addRecent(query.trim()).then(() => getRecent().then(setRecent)); }
      else { if (!user) throw new Error('Aktifkan GPS untuk mencari berdasarkan kategori.'); r = await nearby(c, user); }
      if (user) r.sort((a, b) => haversine(user, [a.lat, a.lon]) - haversine(user, [b.lat, b.lon]));
      setRes(r); setDone(true);
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-line px-3 py-2"><button onClick={() => go.push('/')} aria-label="Kembali"><ArrowLeft size={20} /></button>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="Cari tempat atau alamat" className="flex-1 rounded-xl bg-surface px-3 py-2 text-sm outline-none" />
        <button onClick={() => run()} className="btn" aria-label="Cari"><Search size={16} /></button></header>
      <div className="flex gap-2 overflow-x-auto px-3 py-2">{CATS.map(({ key, label, Icon, color }) => (
        <button key={key} onClick={() => { const c = cat === key ? '' : key; setCat(c); if (c && !q.trim()) run('', c); }} className={`card flex shrink-0 items-center gap-1 px-3 py-1.5 text-xs ${cat === key ? 'border-brand text-brand' : ''}`}><Icon size={14} color={color} />{label}</button>))}</div>
      <main className="flex-1 space-y-2 overflow-y-auto bg-surface p-3">
        {busy && <p className="text-sm text-gray-500">Mencari…</p>}
        {msg && <p className="text-sm text-red-600">{msg}</p>}
        {!done && !busy && recent.length > 0 && <><p className="text-xs font-semibold text-gray-500">Pencarian terakhir</p>{recent.map((r) => <button key={r} onClick={() => { setQ(r); run(r); }} className="card flex w-full items-center gap-2 p-3 text-left text-sm"><Clock size={16} className="text-gray-400" />{r}</button>)}</>}
        {done && res.length === 0 && <p className="py-6 text-center text-sm text-gray-500">Tidak ada hasil.</p>}
        {res.map((p) => <PlaceRow key={p.id} p={p} user={user} onOpen={() => { setPlace(p); go.push('/place'); }} onRoute={() => { showOnMap(p, true); go.push('/'); }} />)}
      </main>
    </div>
  );
}
