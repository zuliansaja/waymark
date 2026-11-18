'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Play, X, AlertTriangle, CornerUpRight } from 'lucide-react';
import { notify } from '@/lib/notify';
import { getRoutes, fmtKm, fmtMin, nearestIdx, alongDist, type Route, type Mode, type Place } from '@/lib/osm';
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });
interface Nav { route: Route; dest: Place; mode: Mode }
export default function Navigate() {
  const go = useRouter();
  const [nav, setNav] = useState<Nav>(); const [pos, setPos] = useState<[number, number]>(); const [paused, setPaused] = useState(false); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { const s = sessionStorage.getItem('waymark_nav'); if (s) setNav(JSON.parse(s)); else go.replace('/'); }, [go]);
  useEffect(() => {
    if (paused) return;
    const id = navigator.geolocation.watchPosition((p) => setPos([p.coords.latitude, p.coords.longitude]), () => setMsg('Izin GPS ditolak atau sinyal hilang.'), { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, [paused]);
  const st = useMemo(() => {
    if (!nav || !pos) return null;
    const c = nav.route.coords, { i, d } = nearestIdx(c, pos), end = c.length - 1;
    const rem = alongDist(c, i, end) + d;
    const next = nav.route.steps.find((s) => s.loc && s.type !== 'depart' && nearestIdx(c, s.loc).i > i);
    const toNext = next?.loc ? alongDist(c, i, nearestIdx(c, next.loc).i) : rem;
    return { rem, off: d > 50, next, toNext, eta: (nav.route.duration * rem) / Math.max(1, nav.route.distance), arrived: rem < 20 };
  }, [nav, pos]);
  useEffect(() => { if (st?.off && nav) notify('route', 'Keluar dari rute', `Anda menyimpang dari rute menuju ${nav.dest.name}.`); }, [st?.off]);
  useEffect(() => { if (st?.arrived && nav) notify('trip', 'Tiba di tujuan', nav.dest.name); }, [st?.arrived]);
  const reroute = async () => { if (!nav || !pos) return; setBusy(true); setMsg(''); try { const r = (await getRoutes([pos, [nav.dest.lat, nav.dest.lon]], nav.mode))[0]; setNav({ ...nav, route: r }); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); } };
  if (!nav) return null;
  const clock = st ? new Date(Date.now() + st.eta * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  return (
    <div className="relative h-full">
      <MapView center={pos ?? nav.route.coords[0]} user={pos} places={[]} selected={nav.dest} routes={[nav.route]} active={0} onPick={() => {}} />
      <div className="absolute inset-x-3 top-3 z-[1000] space-y-2">
        <div className="flex items-center gap-3 rounded-card bg-gray-900 p-4 text-white shadow-soft"><CornerUpRight size={32} />
          <div><p className="text-2xl font-semibold">{st ? fmtKm(st.arrived ? 0 : st.toNext) : '…'}</p><p className="text-sm">{!pos ? 'Menunggu GPS…' : st?.arrived ? 'Anda telah tiba' : st?.next?.text ?? `Menuju ${nav.dest.name}`}</p></div></div>
        {st?.off && <div className="card flex items-center gap-2 border-amber-300 bg-amber-50 p-3 text-sm"><AlertTriangle size={18} className="text-amber-600" /><span className="flex-1">Anda keluar dari rute.</span><button className="btn" disabled={busy} onClick={reroute}>{busy ? '…' : 'Hitung ulang'}</button></div>}
        {msg && <p className="card p-2 text-sm text-red-600">{msg}</p>}
      </div>
      <div className="card absolute inset-x-3 bottom-3 z-[1000] flex items-center gap-3 p-3">
        <button onClick={() => { sessionStorage.removeItem('waymark_nav'); go.push('/'); }} className="rounded-full border border-line p-2.5" aria-label="Stop"><X size={20} /></button>
        <div className="flex-1 text-center"><p className="text-lg font-semibold">{st ? fmtMin(st.eta) : '…'}</p><p className="text-xs text-gray-500">{st ? fmtKm(st.rem) : '…'} • tiba {clock}</p></div>
        <button onClick={() => setPaused((p) => !p)} className="rounded-full border border-line p-2.5" aria-label={paused ? 'Lanjut' : 'Pause'}>{paused ? <Play size={20} /> : <Pause size={20} />}</button>
      </div>
    </div>
  );
}
