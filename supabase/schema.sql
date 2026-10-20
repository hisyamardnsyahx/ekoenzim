-- E-KOMPAK schema for self-hosted Supabase / PostgREST
-- Apply via: psql or supabase db reset

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  hp text,
  nama_lengkap text not null default '',
  alamat text,
  umur int,
  role text not null default 'user' check (role in ('user', 'admin')),
  aktif boolean not null default true,
  foto_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.program_meta (
  id int primary key default 1 check (id = 1),
  nama text not null default 'Program Kompos Warga Sejahtera',
  mitra text not null default 'PKM PM UGM E-KOMPAK',
  lokasi text not null default 'Kelurahan Sukamaju',
  banner_url text
);

insert into public.program_meta (id, nama, mitra, lokasi, banner_url)
values (
  1,
  'Program Kompos Warga Sejahtera',
  'PKM PM UGM E-KOMPAK',
  'Kelurahan Sukamaju, Bandung',
  'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80'
)
on conflict (id) do nothing;

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tanggal date not null default current_date,
  berat_awal numeric(12, 2) not null default 0,
  penggunaan text not null default '',
  berat_penggunaan numeric(12, 2) not null default 0,
  berat_akhir numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists entries_user_id_idx on public.entries (user_id);
create index if not exists entries_tanggal_idx on public.entries (tanggal);

create table if not exists public.monitoring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tanggal date not null default current_date,
  foto_url text,
  deskripsi text not null default '',
  status text not null default 'Baik',
  volume_terolah numeric(12, 2) not null default 0,
  admin_komentar text,
  admin_komentar_at timestamptz,
  created_at timestamptz not null default now()
);

-- Existing DBs: add admin comment columns if missing
alter table public.monitoring add column if not exists admin_komentar text;
alter table public.monitoring add column if not exists admin_komentar_at timestamptz;

create index if not exists monitoring_user_id_idx on public.monitoring (user_id);
create index if not exists monitoring_status_idx on public.monitoring (status);

create table if not exists public.jadwal_prefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  jadwal_key text not null,
  judul text not null,
  frekuensi text not null,
  aktif boolean not null default true,
  unique (user_id, jadwal_key)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_id_idx on public.chat_messages (user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, hp, nama_lengkap, alamat, umur, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'hp', null),
    coalesce(new.raw_user_meta_data->>'nama_lengkap', ''),
    coalesce(new.raw_user_meta_data->>'alamat', null),
    case
      when (new.raw_user_meta_data->>'umur') ~ '^[0-9]+$'
      then (new.raw_user_meta_data->>'umur')::int
      else null
    end,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do update set
    email = excluded.email,
    hp = coalesce(excluded.hp, public.profiles.hp),
    nama_lengkap = case when excluded.nama_lengkap <> '' then excluded.nama_lengkap else public.profiles.nama_lengkap end,
    alamat = coalesce(excluded.alamat, public.profiles.alamat),
    umur = coalesce(excluded.umur, public.profiles.umur);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.monitoring enable row level security;
alter table public.jadwal_prefs enable row level security;
alter table public.chat_messages enable row level security;
alter table public.program_meta enable row level security;

-- Helper: is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.aktif = true
  );
$$;

-- Profiles policies
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update
  using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles for delete
  using (public.is_admin());

-- Entries
drop policy if exists entries_select on public.entries;
create policy entries_select on public.entries for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists entries_insert on public.entries;
create policy entries_insert on public.entries for insert
  with check (auth.uid() = user_id);

drop policy if exists entries_update on public.entries;
create policy entries_update on public.entries for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists entries_delete on public.entries;
create policy entries_delete on public.entries for delete
  using (auth.uid() = user_id or public.is_admin());

-- Monitoring
drop policy if exists monitoring_select on public.monitoring;
create policy monitoring_select on public.monitoring for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists monitoring_insert on public.monitoring;
create policy monitoring_insert on public.monitoring for insert
  with check (auth.uid() = user_id);

drop policy if exists monitoring_update on public.monitoring;
create policy monitoring_update on public.monitoring for update
  using (auth.uid() = user_id or public.is_admin());

-- Jadwal
drop policy if exists jadwal_all on public.jadwal_prefs;
create policy jadwal_all on public.jadwal_prefs for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Chat
drop policy if exists chat_select on public.chat_messages;
create policy chat_select on public.chat_messages for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists chat_insert on public.chat_messages;
create policy chat_insert on public.chat_messages for insert
  with check (
    (auth.uid() = user_id and sender_role = 'user')
    or (public.is_admin() and sender_role = 'admin')
  );

drop policy if exists chat_update on public.chat_messages;
create policy chat_update on public.chat_messages for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Program meta readable by all authenticated
drop policy if exists program_select on public.program_meta;
create policy program_select on public.program_meta for select
  using (true);

drop policy if exists program_admin on public.program_meta;
create policy program_admin on public.program_meta for all
  using (public.is_admin())
  with check (public.is_admin());

-- Storage bucket for monitoring photos (run if storage available)
-- insert into storage.buckets (id, name, public) values ('monitoring', 'monitoring', true)
--   on conflict do nothing;
