import { supabase } from './supabase';
import type { Place } from './osm';
export const setPlace = (p: Place) => sessionStorage.setItem('waymark_place', JSON.stringify(p));
export const getPlace = (): Place | null => { try { return JSON.parse(sessionStorage.getItem('waymark_place') ?? 'null'); } catch { return null; } };
export const showOnMap = (p: Place, route = false) => { setPlace(p); sessionStorage.setItem('waymark_show', '1'); if (route) sessionStorage.setItem('waymark_auto', '1'); };
export async function addRecent(q: string) {
  const l = [q, ...JSON.parse(localStorage.getItem('waymark_recent') ?? '[]').filter((x: string) => x !== q)].slice(0, 10);
  localStorage.setItem('waymark_recent', JSON.stringify(l));
  const { data } = await supabase.auth.getUser(); if (data.user) await supabase.from('recent_searches').insert({ query: q });
}
export async function getRecent(): Promise<string[]> {
  const local: string[] = JSON.parse(localStorage.getItem('waymark_recent') ?? '[]');
  const { data } = await supabase.from('recent_searches').select('query').order('created_at', { ascending: false }).limit(10);
  return Array.from(new Set([...(data ?? []).map((r) => r.query as string), ...local])).slice(0, 10);
}
