create extension if not exists postgis;
create table profiles (id uuid primary key references auth.users on delete cascade, name text, avatar_url text, created_at timestamptz default now());
create table saved_locations (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, name text not null, label text default 'custom', lat double precision not null, lon double precision not null, created_at timestamptz default now());
create table custom_places (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, name text not null, category text, lat double precision not null, lon double precision not null);
create table trips (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, started_at timestamptz not null, duration_s int, distance_m double precision, avg_speed double precision, max_speed double precision);
create table trip_points (id bigserial primary key, trip_id uuid not null references trips on delete cascade, user_id uuid not null default auth.uid() references auth.users on delete cascade, lat double precision not null, lon double precision not null, speed double precision, ts timestamptz not null);
create table recent_searches (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, query text not null, created_at timestamptz default now());
create table saved_routes (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, name text, stops jsonb not null, mode text default 'driving');
create table user_preferences (user_id uuid primary key default auth.uid() references auth.users on delete cascade, units text default 'km', map_layer text default 'osm', notifications boolean default true);
do $$ declare t text; begin
  foreach t in array array['saved_locations','custom_places','trips','trip_points','recent_searches','saved_routes','user_preferences'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop; end $$;
alter table profiles enable row level security;
create policy "own" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
