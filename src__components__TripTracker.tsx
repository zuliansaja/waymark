'use client';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { notify } from '@/lib/notify';
import { supabase } from '@/lib/supabase';
import { haversine, fmtKm } from '@/lib/osm';
interface P { lat: number; lon: number; speed: number; ts: number }
const clock = (ms: number) => { const s = Math.floor(ms / 1000); return [s / 3600, (s % 3600) / 60, s % 60].map((v) => String(Math.floor(v)).padStart(2, '0')).join(':'); };
export default function TripTracker({ onSaved }: { onSaved: () => void }) {
  const [st, setSt] = useState<'idle' | 'run' | 'pause'>('idle'); const [ms, setMs] = useState(0); const [dist, setDist] = useState(0); const [max, setMax] = useState(0); const [msg, setMsg] = useState('');
  const pts = useRef<P[]>([]), watch = useRef<number | null>(null), acc = useRef(0), t0 = useRef(0), stRef = useRef(st); stRef.current = st;
  useEffect(() => { if (st !== 'run') return; const i = setInterval(() => setMs(acc.current + Date.now() - t0.current), 500); return () => clearInterval(i); }, [st]);
  useEffect(() => () => { if (watch.current !== null) navigator.geolocation.clearWatch(watch.current); }, []);
  const stopWatch = () => { if (watch.current !== null) navigator.geolocation.clearWatch(watch.current); watch.current = null; };
  const start = () => {
    if (!navigator.geolocation) return setMsg('GPS tidak didukung.');
    if (st === 'idle') { pts.current = []; acc.current = 0; setDist(0); setMax(0); setMs(0); }
    setMsg(''); t0.current = Date.now(); setSt('run');
    watch.current = navigator.geolocation.watchPosition((p) => {
      if (stRef.current !== 'run' || p.coords.accuracy > 50) return;
      const l = pts.current[pts.current.length - 1]; let sp = (p.coords.speed ?? -1) * 3.6;
      if (l) { const d = haversine([l.lat, l.lon], [p.coords.latitude, p.coords.longitude]); if (d < 3) return; setDist((x) => x + d); if (sp < 0) sp = (d / Math.max(1, (p.timestamp - l.ts) / 1000)) * 3.6; }
      const n = { lat: p.coords.latitude, lon: p.coords.longitude, speed: Math.max(0, sp), ts: p.timestamp };
      pts.current.push(n); setMax((m) => Math.max(m, n.speed));
    }, () => setMsg('Izin GPS ditolak.'), { enableHighAccuracy: true });
  };
  const pause = () => { acc.current += Date.now() - t0.current; stopWatch(); setSt('pause'); };
  const stop = async () => {
    const total = st === 'run' ? acc.current + Date.now() - t0.current : acc.current; stopWatch(); setSt('idle'); setMs(total);
    if (pts.current.length < 2) return setMsg('Perjalanan terlalu singkat, tidak disimpan.');
    const { data: u } = await supabase.auth.getUser(); if (!u.user) return setMsg('Login untuk menyimpan.');
    const { data, error } = await supabase.from('trips').insert({ started_at: new Date(pts.current[0].ts).toISOString(), duration_s: Math.round(total / 1000), distance_m: dist, avg_speed: (dist / Math.max(1, total / 1000)) * 3.6, max_speed: max }).select('id').single();
    if (error || !data) return setMsg(error?.message ?? 'Gagal menyimpan.');
    const { error: e2 } = await supabase.from('trip_points').insert(pts.current.map((p) => ({ trip_id: data.id, lat: p.lat, lon: p.lon, speed: p.speed, ts: new Date(p.ts).toISOString() })));
    setMsg(e2 ? e2.message : 'Perjalanan disimpan.'); if (!e2) notify('trip', 'Perjalanan disimpan', `${fmtKm(dist)} dalam ${clock(total)}`); onSaved();
  };
  const avg = ms > 0 ? (dist / (ms / 1000)) * 3.6 : 0;
  return (
    <div className="rounded-card bg-teal p-4 text-white">
      <p className="text-center text-sm opacity-80">{st === 'idle' ? 'Siap mulai' : st === 'run' ? 'Perjalanan aktif' : 'Dijeda'}</p>
      <p className="my-1 text-center text-4xl font-semibold tabular-nums">{clock(ms)}</p>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">{[['Jarak', fmtKm(dist)], ['Rata-rata', `${avg.toFixed(1)} km/j`], ['Maks', `${max.toFixed(1)} km/j`]].map(([a, b]) => <div key={a} className="rounded-xl bg-white/15 p-2"><p className="font-semibold">{b}</p><p className="text-xs opacity-80">{a}</p></div>)}</div>
      <div className="mt-3 flex gap-2">
        {st !== 'run' ? <button onClick={start} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white py-2 text-sm font-semibold text-teal"><Play size={16} />{st === 'pause' ? 'Resume' : 'Start'}</button>
          : <button onClick={pause} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white py-2 text-sm font-semibold text-teal"><Pause size={16} />Pause</button>}
        <button onClick={stop} disabled={st === 'idle'} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white py-2 text-sm font-semibold text-red-600 disabled:opacity-50"><Square size={16} />Stop</button>
      </div>
      {msg && <p className="mt-2 text-center text-xs">{msg}</p>}
    </div>
  );
}
