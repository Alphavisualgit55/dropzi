-- ================================================
-- DROPZI — SQL COMPLET FINAL
-- Colle tout dans Supabase SQL Editor → Run
-- ================================================

create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nom_boutique text default 'Ma Boutique',
  telephone text,
  plan text default 'business',
  plan_expires date,
  statut text default 'actif',
  montant_mensuel numeric(10,0) default 0,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profil owner" on public.profiles;
create policy "profil owner" on public.profiles for all using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ZONES
create table if not exists public.zones (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  cout_livraison numeric(10,0) not null default 0,
  created_at timestamptz default now()
);
alter table public.zones enable row level security;
drop policy if exists "zones owner" on public.zones;
create policy "zones owner" on public.zones for all using (auth.uid() = user_id);

-- LIVREURS
create table if not exists public.livreurs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  telephone text,
  zone_id uuid references public.zones(id),
  actif boolean default true,
  created_at timestamptz default now()
);
alter table public.livreurs enable row level security;
drop policy if exists "livreurs owner" on public.livreurs;
create policy "livreurs owner" on public.livreurs for all using (auth.uid() = user_id);

-- CATEGORIES
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null
);
alter table public.categories enable row level security;
drop policy if exists "categories owner" on public.categories;
create policy "categories owner" on public.categories for all using (auth.uid() = user_id);

-- PRODUITS
create table if not exists public.produits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  prix_vente numeric(10,0) not null,
  cout_achat numeric(10,0) not null default 0,
  stock_total integer not null default 0,
  image_url text,
  categorie_id uuid references public.categories(id),
  actif boolean default true,
  created_at timestamptz default now()
);
alter table public.produits enable row level security;
drop policy if exists "produits owner" on public.produits;
create policy "produits owner" on public.produits for all using (auth.uid() = user_id);

drop view if exists public.produits_avec_marge;
create view public.produits_avec_marge as
  select *, (prix_vente - cout_achat) as marge,
    case when prix_vente > 0 then round((prix_vente - cout_achat) * 100.0 / prix_vente) else 0 end as marge_pct
  from public.produits;

-- CLIENTS
create table if not exists public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text,
  telephone text,
  adresse text,
  created_at timestamptz default now()
);
alter table public.clients enable row level security;
drop policy if exists "clients owner" on public.clients;
create policy "clients owner" on public.clients for all using (auth.uid() = user_id);

-- COMMANDES
create table if not exists public.commandes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id),
  zone_id uuid references public.zones(id),
  livreur_id uuid references public.livreurs(id),
  statut text default 'en_attente' check (statut in ('en_attente','en_livraison','livre','annule','echec')),
  cout_livraison numeric(10,0) default 0,
  notes text,
  numero_commande text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.commandes enable row level security;
drop policy if exists "commandes owner" on public.commandes;
create policy "commandes owner" on public.commandes for all using (auth.uid() = user_id);

create or replace function set_numero_commande()
returns trigger as $$
declare cnt integer;
begin
  select count(*) + 1 into cnt from public.commandes where user_id = new.user_id;
  new.numero_commande := 'CMD-' || lpad(cnt::text, 4, '0');
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_numero_commande on public.commandes;
create trigger trg_numero_commande
  before insert on public.commandes
  for each row execute procedure set_numero_commande();

-- COMMANDE ITEMS
create table if not exists public.commande_items (
  id uuid default uuid_generate_v4() primary key,
  commande_id uuid references public.commandes(id) on delete cascade,
  produit_id uuid references public.produits(id),
  quantite integer not null default 1,
  prix_unitaire numeric(10,0) not null,
  cout_unitaire numeric(10,0) not null default 0
);
alter table public.commande_items enable row level security;
drop policy if exists "items via commande" on public.commande_items;
create policy "items via commande" on public.commande_items for all
  using (exists (select 1 from public.commandes c where c.id = commande_id and c.user_id = auth.uid()));

-- STOCK AUTO QUAND LIVRÉ
create or replace function public.update_stock_on_delivery()
returns trigger as $$
begin
  if new.statut = 'livre' and old.statut != 'livre' then
    update public.produits p
    set stock_total = greatest(0, stock_total - ci.quantite)
    from public.commande_items ci
    where ci.commande_id = new.id and ci.produit_id = p.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists trg_stock_on_delivery on public.commandes;
create trigger trg_stock_on_delivery
  after update on public.commandes
  for each row execute procedure public.update_stock_on_delivery();

-- DEPENSES
create table if not exists public.depenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('pub','achat','autre')),
  description text,
  montant numeric(10,0) not null,
  date date not null default current_date,
  created_at timestamptz default now()
);
alter table public.depenses enable row level security;
drop policy if exists "depenses owner" on public.depenses;
create policy "depenses owner" on public.depenses for all using (auth.uid() = user_id);

-- RAPPORTS SAUVEGARDÉS
create table if not exists public.rapports_sauvegardes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  date_debut date not null,
  date_fin date not null,
  periode text not null default 'jour',
  ca numeric(10,0) default 0,
  benefice_brut numeric(10,0) default 0,
  benefice_net numeric(10,0) default 0,
  cout_livraisons numeric(10,0) default 0,
  cout_produits numeric(10,0) default 0,
  total_depenses numeric(10,0) default 0,
  dep_pub numeric(10,0) default 0,
  dep_achat numeric(10,0) default 0,
  dep_autre numeric(10,0) default 0,
  nb_commandes integer default 0,
  nb_livrees integer default 0,
  nb_annulees integer default 0,
  panier_moyen numeric(10,0) default 0,
  notes text,
  data_json jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.rapports_sauvegardes enable row level security;
drop policy if exists "rapports_sv owner" on public.rapports_sauvegardes;
create policy "rapports_sv owner" on public.rapports_sauvegardes for all using (auth.uid() = user_id);

-- FACTURES
create table if not exists public.factures (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  commande_id uuid references public.commandes(id) on delete set null,
  numero text default 'FAC-0000',
  client_nom text,
  client_tel text,
  client_adresse text,
  montant_ht numeric(10,0) default 0,
  frais_livraison numeric(10,0) default 0,
  montant_total numeric(10,0) default 0,
  notes text,
  statut text default 'emise',
  created_at timestamptz default now()
);
alter table public.factures enable row level security;
drop policy if exists "factures owner" on public.factures;
create policy "factures owner" on public.factures for all using (auth.uid() = user_id);

-- VUE COMMANDES ENRICHIE
drop view if exists public.commandes_detail;
create view public.commandes_detail as
  select
    c.*,
    cl.nom as client_nom, cl.telephone as client_tel, cl.adresse as client_adresse,
    z.nom as zone_nom, z.cout_livraison as zone_cout_livraison,
    l.nom as livreur_nom,
    coalesce(sum(ci.quantite * ci.prix_unitaire), 0) as total_vente,
    coalesce(sum(ci.quantite * ci.cout_unitaire), 0) as total_cout_produits,
    case when c.statut = 'livre' then
      coalesce(sum(ci.quantite * ci.prix_unitaire), 0)
      - coalesce(sum(ci.quantite * ci.cout_unitaire), 0)
      - c.cout_livraison
    else 0 end as benefice
  from public.commandes c
  left join public.clients cl on cl.id = c.client_id
  left join public.zones z on z.id = c.zone_id
  left join public.livreurs l on l.id = c.livreur_id
  left join public.commande_items ci on ci.commande_id = c.id
  group by c.id, cl.nom, cl.telephone, cl.adresse, z.nom, z.cout_livraison, l.nom;

-- ADMINS
create table if not exists public.admins (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;
drop policy if exists "admins only" on public.admins;
create policy "admins only" on public.admins for all using (auth.uid() = id);

-- NOTIFICATIONS ADMIN
create table if not exists public.notifications_admin (
  id uuid default uuid_generate_v4() primary key,
  titre text not null,
  message text not null,
  type text default 'info',
  cible text default 'tous',
  lu_par uuid[] default '{}',
  created_at timestamptz default now()
);
alter table public.notifications_admin enable row level security;
drop policy if exists "tous peuvent lire notifs" on public.notifications_admin;
drop policy if exists "admins peuvent tout" on public.notifications_admin;
create policy "tous peuvent lire notifs" on public.notifications_admin for select using (true);
create policy "admins peuvent tout" on public.notifications_admin for all
  using (exists (select 1 from public.admins where id = auth.uid()));

-- VUE STATS ADMIN
drop view if exists public.admin_stats;
create view public.admin_stats as
select
  (select count(*) from public.profiles) as total_users,
  (select count(*) from public.profiles where plan = 'basic') as users_basic,
  (select count(*) from public.profiles where plan = 'business') as users_business,
  (select count(*) from public.profiles where plan = 'elite') as users_elite,
  (select count(*) from public.profiles where created_at >= now() - interval '30 days') as nouveaux_ce_mois,
  (select count(*) from public.commandes where created_at >= now() - interval '30 days') as commandes_ce_mois,
  (select coalesce(sum(montant_mensuel),0) from public.profiles) as mrr;

-- ADMIN : alphadiagne902@gmail.com
insert into public.admins (id, email)
values ('48a705e3-b06c-4417-89d4-7c27d0fea31b', 'alphadiagne902@gmail.com')
on conflict (id) do nothing;
