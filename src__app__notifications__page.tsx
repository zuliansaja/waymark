'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Route, AlertTriangle, Trash2, BellRing } from 'lucide-react';
import { getNotifs, type Notif, type NType } from '@/lib/notify';
const META: Record<NType, { l: string; I: typeof MapPin }> = { location: { l: 'Lokasi', I: MapPin }, trip: { l: 'Perjalanan', I: Route }, route: { l: 'Peringatan rute', I: AlertTriangle } };
export default function Notifications() {
  const go = useRouter();
  const [list, setList] = useState<Notif[]>([]); const [f, setF] = useState<NType | ''>(''); const [perm, setPerm] = useState('');
  useEffect(() => { setList(getNotifs()); if ('Notification' in window) setPerm(Notification.permission); }, []);
  const shown = list.filter((n) => !f || n.type === f);
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-line px-3 py-3"><button onClick={() => go.back()} aria-label="Kembali"><ArrowLeft size={20} /></button><span className="flex-1 font-semibold text-teal">Notifikasi</span>
        <button onClick={() => { localStorage.removeItem('waymark_notifs'); setList([]); }} aria-label="Hapus semua"><Trash2 size={18} className="text-gray-500" /></button></header>
      <div className="flex gap-2 overflow-x-auto px-3 py-2">{(['', 'location', 'trip', 'route'] as const).map((k) => <button key={k} onClick={() => setF(k)} className={`card shrink-0 px-3 py-1.5 text-xs ${f === k ? 'border-brand text-brand' : ''}`}>{k ? META[k].l : 'Semua'}</button>)}</div>
      <main className="flex-1 space-y-2 overflow-y-auto bg-surface p-3">
        {perm === 'default' && <button className="btn flex w-full items-center justify-center gap-2" onClick={() => Notification.requestPermission().then(setPerm)}><BellRing size={16} />Izinkan notifikasi browser</button>}
        {perm === 'denied' && <p className="card p-3 text-xs text-gray-500">Notifikasi browser diblokir. Aktifkan lewat pengaturan situs; pesan tetap tercatat di sini.</p>}
        {shown.length === 0 && <p className="py-8 text-center text-sm text-gray-500">Belum ada notifikasi.</p>}
        {shown.map((n) => { const I = META[n.type].I; return <div key={n.id} className="card flex gap-3 p-3"><I size={18} className={n.type === 'route' ? 'text-amber-600' : 'text-teal'} /><div className="flex-1"><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-gray-500">{n.body}</p></div><span className="text-[10px] text-gray-400">{new Date(n.ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>; })}
      </main>
    </div>
  );
}
