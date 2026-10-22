-- UpgradeChess cloud sync schema. Run in the Neon SQL Editor after enabling Neon Auth and the Data API.
-- user_id is the Neon Auth user id (the JWT `sub` claim, returned as text by auth.user_id()).
create table if not exists public.user_data (
  user_id    text primary key default (auth.user_id()),
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.user_data to authenticated;

create policy "users read own data"   on public.user_data for select to authenticated using (auth.user_id() = user_id);
create policy "users insert own data" on public.user_data for insert to authenticated with check (auth.user_id() = user_id);
create policy "users update own data" on public.user_data for update to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "users delete own data" on public.user_data for delete to authenticated using (auth.user_id() = user_id);
