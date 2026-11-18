import { CATS, fmtKm, haversine, type Place } from '@/lib/osm';
import { MapPin } from 'lucide-react';
export default function PlaceRow({ p, user, onOpen, onRoute }: { p: Place; user?: [number, number]; onOpen: () => void; onRoute?: () => void }) {
  const c = CATS.find((x) => x.key === p.cat); const I = c?.Icon ?? MapPin;
  return (
    <div className="card flex items-center gap-3 p-3">
      <button onClick={onOpen} className="flex flex-1 items-center gap-3 text-left"><span className="rounded-full p-2" style={{ background: (c?.color ?? '#0f766e') + '22' }}><I size={18} color={c?.color ?? '#0f766e'} /></span>
        <span className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><p className="truncate text-xs text-gray-500">{user && `${fmtKm(haversine(user, [p.lat, p.lon]))} • `}{p.address ?? p.kind ?? c?.label}</p></span></button>
      {onRoute && <button onClick={onRoute} className="rounded-xl border border-brand px-3 py-1 text-xs font-semibold text-brand">Rute</button>}
    </div>
  );
}
