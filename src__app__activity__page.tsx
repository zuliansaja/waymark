'use client';
import { useState } from 'react';
import Shell from '@/components/Shell';
import TripTracker from '@/components/TripTracker';
import TripHistory from '@/components/TripHistory';
export default function Activity() {
  const [n, setN] = useState(0);
  return <Shell title="Aktivitas">{() => <><TripTracker onSaved={() => setN((x) => x + 1)} /><TripHistory refresh={n} /></>}</Shell>;
}
