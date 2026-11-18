import { Landmark, Utensils, Fuel, Hospital, Pill, Banknote, Store, School, Hotel, ParkingCircle, Coffee, TrainFront, Bus, Wrench, type LucideIcon } from 'lucide-react';
export type Mode = 'driving' | 'cycling' | 'walking';
export interface Place { id: string; name: string; lat: number; lon: number; cat?: string; kind?: string; address?: string; tags?: Record<string, string> }
export interface Route { distance: number; duration: number; coords: [number, number][]; steps: { text: string; distance: number; loc?: [number, number]; type?: string }[] }
export const CATS: { key: string; label: string; tag: string; color: string; Icon: LucideIcon }[] = [
  { key: 'masjid', label: 'Masjid', tag: '"amenity"="place_of_worship"]["religion"="muslim"', color: '#0f766e', Icon: Landmark },
  { key: 'restoran', label: 'Restoran', tag: '"amenity"="restaurant"', color: '#ea580c', Icon: Utensils },
  { key: 'spbu', label: 'SPBU', tag: '"amenity"="fuel"', color: '#d97706', Icon: Fuel },
  { key: 'rs', label: 'Rumah sakit', tag: '"amenity"="hospital"', color: '#dc2626', Icon: Hospital },
  { key: 'apotek', label: 'Apotek', tag: '"amenity"="pharmacy"', color: '#16a34a', Icon: Pill },
  { key: 'atm', label: 'ATM', tag: '"amenity"="atm"', color: '#1d6fe8', Icon: Banknote },
  { key: 'minimarket', label: 'Minimarket', tag: '"shop"="convenience"', color: '#7c3aed', Icon: Store },
  { key: 'sekolah', label: 'Sekolah', tag: '"amenity"="school"', color: '#0891b2', Icon: School },
  { key: 'hotel', label: 'Hotel', tag: '"tourism"="hotel"', color: '#be185d', Icon: Hotel },
  { key: 'parkir', label: 'Parkiran', tag: '"amenity"="parking"', color: '#2563eb', Icon: ParkingCircle },
  { key: 'kafe', label: 'Kafe', tag: '"amenity"="cafe"', color: '#92400e', Icon: Coffee },
  { key: 'stasiun', label: 'Stasiun', tag: '"railway"="station"', color: '#475569', Icon: TrainFront },
  { key: 'terminal', label: 'Terminal', tag: '"amenity"="bus_station"', color: '#4f46e5', Icon: Bus },
  { key: 'bengkel', label: 'Bengkel', tag: '"shop"="car_repair"', color: '#57534e', Icon: Wrench },
];
export const fmtKm = (m: number) => (typeof localStorage !== 'undefined' && localStorage.getItem('units') === 'mi' ? `${(m / 1609.34).toFixed(1)} mi` : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
export const fmtMin = (s: number) => (s < 3600 ? `${Math.max(1, Math.round(s / 60))} mnt` : `${Math.floor(s / 3600)} j ${Math.round((s % 3600) / 60)} mnt`);
export const haversine = (a: [number, number], b: [number, number]) => {
  const r = (d: number) => (d * Math.PI) / 180, R = 6371000;
  const x = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
async function j(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`Layanan eksternal gagal (${r.status}). Coba lagi nanti.`);
  return r.json();
}
export async function geocode(q: string, near?: [number, number]): Promise<Place[]> {
  const v = near ? `&viewbox=${near[1] - 0.5},${near[0] + 0.5},${near[1] + 0.5},${near[0] - 0.5}` : '';
  const d = await j(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&extratags=1&q=${encodeURIComponent(q)}${v}`);
  return d.map((x: any) => ({ id: `n${x.place_id}`, name: x.name || x.display_name.split(',')[0], lat: +x.lat, lon: +x.lon, address: x.display_name, kind: x.type, tags: x.extratags }));
}
export async function nearby(cat: string, c: [number, number], radius = 2000): Promise<Place[]> {
  const t = CATS.find((x) => x.key === cat)!.tag;
  const q = `[out:json][timeout:20];nwr[${t}](around:${radius},${c[0]},${c[1]});out center 40;`;
  const d = await j('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  return d.elements.map((e: any) => ({ id: `o${e.id}`, name: e.tags?.name ?? CATS.find((x) => x.key === cat)!.label, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon, cat, tags: e.tags, address: [e.tags?.['addr:street'], e.tags?.['addr:housenumber']].filter(Boolean).join(' ') || undefined }))
    .filter((p: Place) => p.lat && p.lon).sort((a: Place, b: Place) => haversine(c, [a.lat, a.lon]) - haversine(c, [b.lat, b.lon]));
}
export async function getRoutes(stops: [number, number][], mode: Mode): Promise<Route[]> {
  const path = stops.map((s) => `${s[1]},${s[0]}`).join(';');
  const d = await j(`https://router.project-osrm.org/route/v1/${mode === 'driving' ? 'driving' : mode === 'cycling' ? 'bike' : 'foot'}/${path}?overview=full&geometries=geojson&alternatives=true&steps=true`);
  if (!d.routes?.length) throw new Error('Rute tidak ditemukan.');
  return d.routes.map((r: any) => ({ distance: r.distance, duration: r.duration, coords: r.geometry.coordinates.map((c: number[]) => [c[1], c[0]]),
    steps: r.legs.flatMap((l: any) => l.steps).map((s: any) => ({ text: idStep(s.maneuver.type, s.maneuver.modifier, s.name), distance: s.distance, loc: [s.maneuver.location[1], s.maneuver.location[0]], type: s.maneuver.type })) }));
}
export function idStep(type: string, mod?: string, name?: string) {
  const m: Record<string, string> = { left: 'Belok kiri', right: 'Belok kanan', 'slight left': 'Serong kiri', 'slight right': 'Serong kanan', 'sharp left': 'Belok tajam ke kiri', 'sharp right': 'Belok tajam ke kanan', straight: 'Lurus', uturn: 'Putar balik' };
  const base = type === 'arrive' ? 'Tiba di tujuan' : type === 'depart' ? 'Berangkat' : type === 'roundabout' || type === 'rotary' ? 'Masuk bundaran' : (mod && m[mod]) || 'Lanjutkan';
  return name && type !== 'arrive' ? `${base} ke ${name}` : base;
}
export const nearestIdx = (coords: [number, number][], p: [number, number]) => { let b = 0, d = Infinity; coords.forEach((c, i) => { const x = haversine(c, p); if (x < d) { d = x; b = i; } }); return { i: b, d }; };
export const alongDist = (coords: [number, number][], a: number, b: number) => { let t = 0; for (let i = a; i < b; i++) t += haversine(coords[i], coords[i + 1]); return t; };
