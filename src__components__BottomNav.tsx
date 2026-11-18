'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Bookmark, Activity, Settings } from 'lucide-react';
const items = [{ l: 'Map', I: Map, h: '/' }, { l: 'Saved', I: Bookmark, h: '/saved' }, { l: 'Activity', I: Activity, h: '/activity' }, { l: 'Settings', I: Settings, h: '/settings' }];
export default function BottomNav() {
  const p = usePathname();
  return <nav className="grid grid-cols-4 border-t border-line bg-white py-2">{items.map(({ l, I, h }) => (
    <Link key={l} href={h} className={`flex flex-col items-center gap-0.5 text-[11px] ${p === h ? 'text-brand' : 'text-gray-400'}`}><I size={20} />{l}</Link>))}</nav>;
}
