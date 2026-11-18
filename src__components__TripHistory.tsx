'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fmtKm } from '@/lib/osm';
const MapView = dynamic(() => import('./MapView'), { ssr: false });
interface Trip { id: string; started_at: string; duration_s: number; distance_m: number; avg_speed: number; max_speed: number }
export default function TripHistory({ refresh }: { refresh: number }) {
  const [trips, setTrips] = useState<Trip[]>([]); const [ok, setOk] = useState(false); const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<Trip>(); const [track, setTrack] = useState<[number, number][]>([]);
  const load = useCallback(async () => { const { data, error } = await supabase.from('trips').select('*').order('started_at', { ascending: false }); if (error) setMsg(error.message); setTrips(data ?? []); setOk(true); }, []);
  useEffect(() => { load(); }, [load, refresh]);
  const show = async (t: Trip) => { setOpen(t); const { data } = await supabase.from('trip_points').select('lat,lon').eq('trip_id', t.id).order('ts'); setTrack((data ?? []).map((p) => [p.lat, p.lon])); };
  const [mode, setMode] = useState<'w' | 'm'>('w');
  const sum = (f: (d: Date) => boolean) => trips.filter((t) => f(new Date(t.started_at))).reduce((a, t) => a + t.distance_m, 0);
  const buckets = mode === 'w'
    ? Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return { label: d.toLocaleDateString('id-ID', { weekday: 'short' }), v: sum((x) => x.toDateString() === d.toDateString()) }; })
    : Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return { label: d.toLocaleDateString('id-ID', { month: 'short' }), v: sum((x) => x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear()) }; });
  const top = Math.max(1, ...buckets.map((b) => b.v)), totD = trips.reduce((s, t) => s + t.distance_m, 0), totT = trips.reduce((s, t) => s + t.duration_s, 0);
  return (<>
    <div className="card space-y-2 p-3"><p className="text-sm font-semibold">Statistik</p>
      <div className="grid grid-cols-3 gap-2 text-center text-sm"><div><b>{fmtKm(totD)}</b><p className="text-xs text-gray-500">Total jarak</p></div><div><b>{(totT / 3600).toFixed(1)} j</b><p className="text-xs text-gray-500">Total waktu</p></div><div><b>{Math.max(0, ...trips.map((t) => t.max_speed)).toFixed(0)} km/j</b><p className="text-xs text-gray-500">Kecepatan maks</p></div></div>
      <div className="flex gap-2 text-xs">{([['w', 'Mingguan'], ['m', 'Bulanan']] as const).map(([k, l]) => <button key={k} onClick={() => setMode(k)} className={`rounded-full border px-3 py-1 ${mode === k ? 'border-brand text-brand' : 'border-line'}`}>{l}</button>)}</div>
      <div className="flex h-20 items-end gap-1">{buckets.map((b, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded bg-brand" style={{ height: `${(b.v / top) * 100}%`, minHeight: 2 }} /><span className="text-[10px] text-gray-400">{b.label}</span></div>)}</div></div>
    <p className="text-sm font-semibold">Riwayat perjalanan</p>
    {msg && <p className="text-sm text-red-600">{msg}</p>}
    {!ok ? <p className="text-sm text-gray-500">Memuat…</p> : trips.length === 0 ? <p className="py-4 text-center text-sm text-gray-500">Belum ada perjalanan.</p> : trips.map((t) => (
      <button key={t.id} onClick={() => show(t)} className="card w-full p-3 text-left"><p className="text-sm font-medium">{fmtKm(t.distance_m)} • {Math.round(t.duration_s / 60)} mnt</p><p className="text-xs text-gray-500">{new Date(t.started_at).toLocaleString('id-ID')} • rata-rata {t.avg_speed.toFixed(1)} km/j</p></button>))}
    {open && track.length > 1 && <div className="card overflow-hidden"><div className="h-56"><MapView center={track[0]} places={[]} routes={[{ distance: open.distance_m, duration: open.duration_s, coords: track, steps: [] }]} active={0} onPick={() => {}} /></div></div>}
  </>);
}
