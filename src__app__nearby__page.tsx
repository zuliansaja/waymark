'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CATS, nearby, type Place } from '@/lib/osm';
import { setPlace, showOnMap } from '@/lib/nav';
import PlaceRow from '@/components/PlaceRow';
export default function Nearby() {
  const go = useRouter();
  const [user, setUser] = useState<[number, number]>(); const [cat, setCat] = useState('masjid'); const [radius, setRadius] = useState(2000);
  const [res, setRes] = useState<Place[]>([]); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  useEffect(() => { navigator.geolocation.getCurrentPosition((p) => setUser([p.coords.latitude, p.coords.longitude]), () => setMsg('GPS tidak tersedia atau izin ditolak.'), { enableHighAccuracy: true }); }, []);
  useEffect(() => { if (!user) return; setBusy(true); setMsg(''); nearby(cat, user, radius).then(setRes).catch((e) => setMsg(e.message)).finally(() => setBusy(false)); }, [user, cat, radius]);
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-line px-3 py-3"><button onClick={() => go.push('/')} aria-label="Kembali"><ArrowLeft size={20} /></button><span className="flex-1 font-semibold text-teal">Tempat Terdekat</span>
        <select value={radius} onChange={(e) => setRadius(+e.target.value)} className="rounded-lg border border-line px-2 py-1 text-sm">{[500, 1000, 2000, 5000].map((r) => <option key={r} value={r}>{r < 1000 ? `${r} m` : `${r / 1000} km`}</option>)}</select></header>
      <div className="flex gap-2 overflow-x-auto px-3 py-2">{CATS.map(({ key, label, Icon, color }) => (
        <button key={key} onClick={() => setCat(key)} className={`card flex shrink-0 items-center gap-1 px-3 py-1.5 text-xs ${cat === key ? 'border-brand text-brand' : ''}`}><Icon size={14} color={color} />{label}</button>))}</div>
      <main className="flex-1 space-y-2 overflow-y-auto bg-surface p-3">
        {!user && !msg && <p className="text-sm text-gray-500">Menunggu GPS…</p>}{busy && <p className="text-sm text-gray-500">Memuat…</p>}{msg && <p className="text-sm text-red-600">{msg}</p>}
        {user && !busy && !msg && res.length === 0 && <p className="py-6 text-center text-sm text-gray-500">Tidak ada tempat dalam radius ini.</p>}
        {res.map((p) => <PlaceRow key={p.id} p={p} user={user} onOpen={() => { setPlace(p); go.push('/place'); }} onRoute={() => { showOnMap(p, true); go.push('/'); }} />)}
      </main>
    </div>
  );
}
