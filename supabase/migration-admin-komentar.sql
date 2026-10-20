-- Run on existing Supabase DB (if schema already applied without admin comment cols)
alter table public.monitoring add column if not exists admin_komentar text;
alter table public.monitoring add column if not exists admin_komentar_at timestamptz;
