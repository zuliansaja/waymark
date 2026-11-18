'use client';
import { useEffect, useRef, createElement } from 'react';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { CATS, type Place, type Route } from '@/lib/osm';
type Layer = 'osm' | 'topo' | 'cyclo';
const TILES: Record<Layer, string> = { osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', topo: 'https://tile.opentopomap.org/{z}/{x}/{y}.png', cyclo: 'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png' };
interface Props { layer?: Layer; center: [number, number]; user?: [number, number]; places: Place[]; selected?: Place; routes: Route[]; active: number; onPick: (p: Place) => void }
export default function MapView({ layer = 'osm', center, user, places, selected, routes, active, onPick }: Props) {
  const el = useRef<HTMLDivElement>(null), map = useRef<L.Map>(), grp = useRef<L.LayerGroup>(), tile = useRef<L.TileLayer>();
  useEffect(() => {
    if (map.current || !el.current) return;
    map.current = L.map(el.current, { zoomControl: false }).setView(center, 14);
    tile.current = L.tileLayer(TILES[layer], { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map.current);
    grp.current = L.layerGroup().addTo(map.current);
  }, [center]);
  useEffect(() => { map.current?.setView(center); }, [center]);
  useEffect(() => { tile.current?.setUrl(TILES[layer]); }, [layer]);
  useEffect(() => {
    const g = grp.current; if (!g) return; g.clearLayers();
    if (user) L.circleMarker(user, { radius: 8, color: '#fff', weight: 3, fillColor: '#1d6fe8', fillOpacity: 1 }).addTo(g);
    [...places, ...(selected ? [selected] : [])].forEach((p) => {
      const c = CATS.find((x) => x.key === p.cat);
      const html = `<div style="background:${c?.color ?? '#0f766e'};width:30px;height:30px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.3)">${c ? renderToStaticMarkup(createElement(c.Icon, { size: 16, color: '#fff' })) : ''}</div>`;
      L.marker([p.lat, p.lon], { icon: L.divIcon({ html, className: '', iconSize: [30, 30], iconAnchor: [15, 15] }) }).on('click', () => onPick(p)).addTo(g);
    });
    routes.forEach((r, i) => L.polyline(r.coords, { color: i === active ? '#1d6fe8' : '#94a3b8', weight: i === active ? 6 : 4 }).addTo(g));
    if (routes[active]) map.current?.fitBounds(L.latLngBounds(routes[active].coords), { padding: [40, 40] });
  }, [user, places, selected, routes, active, onPick]);
  return <div ref={el} className="h-full w-full" />;
}
