-- ================================================
-- DROPZI ADMIN — SQL à coller dans Supabase
-- ================================================

-- Table admins (pour sécuriser l'accès)
create table if not exists public.admins (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;
create policy "admins only" on public.admins for all using (auth.uid() = id);

-- Ajouter colonne plan_expires et statut aux profiles
alter table public.profiles add column if not exists plan_expires date;
alter table public.profiles add column if not exists statut text default 'actif' check (statut in ('actif','suspendu','supprime'));
alter table public.profiles add column if not exists montant_mensuel numeric(10,0) default 0;

-- Table notifications globales
create table if not exists public.notifications_admin (
  id uuid default uuid_generate_v4() primary key,
  titre text not null,
  message text not null,
  type text default 'info' check (type in ('info','warning','success','error')),
  cible text default 'tous' check (cible in ('tous','basic','business','elite')),
  lu_par uuid[] default '{}',
  created_at timestamptz default now()
);
alter table public.notifications_admin enable row level security;
create policy "tous peuvent lire notifs" on public.notifications_admin for select using (true);
create policy "admins peuvent tout" on public.notifications_admin for all using (
  exists (select 1 from public.admins where id = auth.uid())
);

-- Vue stats globales
create or replace view public.admin_stats as
select
  (select count(*) from public.profiles where statut != 'supprime') as total_users,
  (select count(*) from public.profiles where plan = 'basic' and statut = 'actif') as users_basic,
  (select count(*) from public.profiles where plan = 'business' and statut = 'actif') as users_business,
  (select count(*) from public.profiles where plan = 'elite' and statut = 'actif') as users_elite,
  (select count(*) from public.profiles where created_at >= now() - interval '30 days') as nouveaux_ce_mois,
  (select count(*) from public.commandes where created_at >= now() - interval '30 days') as commandes_ce_mois,
  (select coalesce(sum(montant_mensuel),0) from public.profiles where statut = 'actif') as mrr;

-- Insérer ton compte admin (remplace TON_USER_ID par ton UUID Supabase)
-- insert into public.admins (id, email) values ('TON_USER_ID', 'ton@email.com');
