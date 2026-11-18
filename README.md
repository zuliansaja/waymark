# WAYMARK
Next.js + TypeScript + Tailwind + Leaflet/OpenStreetMap + Supabase.
## Instalasi
1. `npm install`
2. Salin `.env.example` ke `.env.local`, isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key saja).
3. Supabase → SQL Editor: jalankan `supabase/schema.sql`.
4. Supabase → Authentication → Providers: aktifkan Google; tambahkan `http://localhost:3000` ke Redirect URLs.
5. `npm run dev`
## Layanan
Nominatim (pencarian), Overpass (tempat), OSRM demo (rute; untuk produksi pakai server sendiri), Geolocation API (GPS).
