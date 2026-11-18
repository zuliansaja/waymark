'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { ArrowLeft, Navigation, Bookmark, Share2, MessageCircle, Copy, Clock, Phone, Globe, MapPin } from 'lucide-react';
import { CATS, type Place } from '@/lib/osm';
import { getPlace, showOnMap } from '@/lib/nav';
import { notify } from '@/lib/notify';
import { supabase } from '@/lib/supabase';
export default function PlaceDetail() {
  const go = useRouter();
  const [p, setP] = useState<Place | null>(null); const [qr, setQr] = useState(''); const [msg, setMsg] = useState('');
  useEffect(() => { const x = getPlace(); if (!x) { go.replace('/'); return; } setP(x); QRCode.toDataURL(`https://www.openstreetmap.org/?mlat=${x.lat}&mlon=${x.lon}#map=17/${x.lat}/${x.lon}`, { width: 180, margin: 1 }).then(setQr); }, [go]);
  if (!p) return null;
  const url = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=17/${p.lat}/${p.lon}`; const t = p.tags ?? {};
  const kind = CATS.find((c) => c.key === p.cat)?.label ?? p.kind ?? 'Tempat';
  const info: [typeof Clock, string | undefined][] = [[MapPin, p.address], [Clock, t.opening_hours], [Phone, t.phone ?? t['contact:phone']], [Globe, t.website ?? t['contact:website']]];
  const save = async () => { const { data } = await supabase.auth.getUser(); if (!data.user) return setMsg('Login dulu untuk menyimpan.'); const { error } = await supabase.from('saved_locations').insert({ name: p.name, lat: p.lat, lon: p.lon }); setMsg(error ? error.message : 'Lokasi disimpan.'); if (!error) notify('location', 'Lokasi disimpan', p.name); };
  const copy = () => navigator.clipboard.writeText(url).then(() => setMsg('Link disalin.'), () => setMsg('Gagal menyalin.'));
  return (
    <div className="h-full overflow-y-auto bg-surface">
      <header className="flex items-center gap-2 border-b border-line bg-white px-3 py-3"><button onClick={() => go.back()} aria-label="Kembali"><ArrowLeft size={20} /></button><span className="font-semibold text-teal">Detail Tempat</span></header>
      <div className="space-y-3 p-3">
        <div className="card p-4"><p className="text-lg font-semibold">{p.name}</p><p className="text-sm text-gray-500">{kind}</p><p className="mt-1 text-xs text-gray-400">{p.lat.toFixed(6)}, {p.lon.toFixed(6)}</p></div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <button onClick={() => { showOnMap(p, true); go.push('/'); }} className="btn flex flex-col items-center gap-1 !px-1"><Navigation size={18} />Rute</button>
          <button onClick={save} className="card flex flex-col items-center gap-1 p-2"><Bookmark size={18} />Simpan</button>
          <button onClick={() => (navigator.share ? navigator.share({ title: p.name, url }).catch(() => {}) : copy())} className="card flex flex-col items-center gap-1 p-2"><Share2 size={18} />Bagikan</button>
          <button onClick={() => { showOnMap(p); go.push('/'); }} className="card flex flex-col items-center gap-1 p-2"><MapPin size={18} />Peta</button></div>
        {msg && <p className="text-center text-xs text-gray-500">{msg}</p>}
        <div className="card divide-y divide-line">{info.filter(([, v]) => v).map(([I, v], i) => <p key={i} className="flex gap-3 p-3 text-sm"><I size={18} className="shrink-0 text-teal" /><span className="break-words">{v}</span></p>)}
          {info.every(([, v]) => !v) && <p className="p-3 text-sm text-gray-500">Belum ada informasi tambahan di OpenStreetMap.</p>}</div>
        <div className="card space-y-3 p-4"><p className="text-sm font-semibold">Bagikan lokasi</p>
          <div className="flex gap-2"><button onClick={copy} className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-line py-2 text-sm"><Copy size={16} />Salin link</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${p.name} ${url}`)}`} target="_blank" className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-line py-2 text-sm"><MessageCircle size={16} className="text-green-600" />WhatsApp</a></div>
          {qr && <img src={qr} alt="QR lokasi" className="mx-auto h-40 w-40" />}</div>
      </div>
    </div>
  );
}
