'use client';
import { useCallback, useEffect, useState } from 'react';
import { Home, School, Briefcase, MapPin, Pencil, Trash2, Plus } from 'lucide-react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';
interface Loc { id: string; name: string; label: string; lat: number; lon: number }
const ICON: Record<string, typeof Home> = { home: Home, school: School, work: Briefcase, custom: MapPin };
function List() {
  const [rows, setRows] = useState<Loc[]>([]); const [state, setState] = useState<'load' | 'ok'>('load'); const [msg, setMsg] = useState('');
  const [name, setName] = useState(''); const [label, setLabel] = useState('custom');
  const load = useCallback(async () => { const { data, error } = await supabase.from('saved_locations').select('*').order('created_at', { ascending: false }); if (error) setMsg(error.message); setRows(data ?? []); setState('ok'); }, []);
  useEffect(() => { load(); }, [load]);
  const add = () => {
    if (!name.trim()) return setMsg('Isi nama lokasi.');
    navigator.geolocation.getCurrentPosition(async (p) => {
      const { error } = await supabase.from('saved_locations').insert({ name: name.trim(), label, lat: p.coords.latitude, lon: p.coords.longitude });
      setMsg(error ? error.message : ''); setName(''); load();
    }, () => setMsg('GPS tidak tersedia atau izin ditolak.'));
  };
  const edit = async (r: Loc) => { const n = prompt('Nama baru', r.name); if (!n) return; const { error } = await supabase.from('saved_locations').update({ name: n }).eq('id', r.id); if (error) setMsg(error.message); load(); };
  const del = async (r: Loc) => { if (!confirm(`Hapus ${r.name}?`)) return; const { error } = await supabase.from('saved_locations').delete().eq('id', r.id); if (error) setMsg(error.message); load(); };
  return (<>
    <div className="card space-y-2 p-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lokasi (dari posisi GPS saat ini)" className="w-full rounded-xl border border-line px-3 py-2 text-sm" />
      <div className="flex gap-2"><select value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-xl border border-line px-2 text-sm">
        <option value="home">Home</option><option value="school">School</option><option value="work">Work</option><option value="custom">Custom</option></select>
        <button className="btn flex flex-1 items-center justify-center gap-1" onClick={add}><Plus size={16} />Tambah lokasi</button></div>
    </div>
    {msg && <p className="text-sm text-red-600">{msg}</p>}
    {state === 'load' ? <p className="text-sm text-gray-500">Memuat…</p> : rows.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">Belum ada lokasi tersimpan.</p> :
      rows.map((r) => { const I = ICON[r.label] ?? MapPin; return (
        <div key={r.id} className="card flex items-center gap-3 p-3"><I size={20} className="text-teal" />
          <a href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lon}#map=17/${r.lat}/${r.lon}`} target="_blank" className="flex-1"><p className="text-sm font-medium">{r.name}</p><p className="text-xs text-gray-500">{r.lat.toFixed(5)}, {r.lon.toFixed(5)}</p></a>
          <button onClick={() => edit(r)} aria-label="Edit"><Pencil size={18} className="text-gray-500" /></button>
          <button onClick={() => del(r)} aria-label="Hapus"><Trash2 size={18} className="text-red-500" /></button></div>); })}
  </>);
}
export default function Saved() { return <Shell title="Lokasi Tersimpan">{() => <List />}</Shell>; }
