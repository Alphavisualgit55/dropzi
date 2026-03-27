-- ============================================
-- DROPZI — Schéma complet Supabase PostgreSQL
-- Colle tout ce fichier dans SQL Editor > Run
-- ============================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============ USERS (géré par Supabase Auth) ============
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nom_boutique text,
  telephone text,
  plan text default 'basic' check (plan in ('basic','business','elite')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "users voir leur profil" on public.profiles
  for all using (auth.uid() = id);

-- Trigger: créer profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ ZONES ============
create table public.zones (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  created_at timestamptz default now()
);
alter table public.zones enable row level security;
create policy "zones owner" on public.zones for all using (auth.uid() = user_id);

-- ============ LIVREURS ============
create table public.livreurs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  telephone text,
  actif boolean default true,
  created_at timestamptz default now()
);
alter table public.livreurs enable row level security;
create policy "livreurs owner" on public.livreurs for all using (auth.uid() = user_id);

-- ============ PRIX LIVRAISON PAR ZONE ============
create table public.tarifs_livraison (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  zone_id uuid references public.zones(id) on delete cascade,
  prix numeric(10,0) not null default 0,
  created_at timestamptz default now()
);
alter table public.tarifs_livraison enable row level security;
create policy "tarifs owner" on public.tarifs_livraison for all using (auth.uid() = user_id);

-- ============ CATÉGORIES ============
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null
);
alter table public.categories enable row level security;
create policy "categories owner" on public.categories for all using (auth.uid() = user_id);

-- ============ PRODUITS ============
create table public.produits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  prix_vente numeric(10,0) not null,
  cout_achat numeric(10,0) not null default 0,
  stock_total integer not null default 0,
  image_url text,
  categorie_id uuid references public.categories(id),
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.produits enable row level security;
create policy "produits owner" on public.produits for all using (auth.uid() = user_id);

-- Marge calculée (view)
create or replace view public.produits_avec_marge as
  select *, (prix_vente - cout_achat) as marge,
    case when prix_vente > 0 then round((prix_vente - cout_achat) * 100.0 / prix_vente) else 0 end as marge_pct
  from public.produits;

-- ============ STOCK PAR ZONE ============
create table public.stock_zones (
  id uuid default uuid_generate_v4() primary key,
  produit_id uuid references public.produits(id) on delete cascade,
  zone_id uuid references public.zones(id) on delete cascade,
  quantite integer not null default 0,
  unique(produit_id, zone_id)
);
alter table public.stock_zones enable row level security;
create policy "stock_zones via produit" on public.stock_zones for all
  using (exists (select 1 from public.produits p where p.id = produit_id and p.user_id = auth.uid()));

-- ============ CLIENTS ============
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  telephone text,
  adresse text,
  created_at timestamptz default now()
);
alter table public.clients enable row level security;
create policy "clients owner" on public.clients for all using (auth.uid() = user_id);

-- ============ COMMANDES ============
create table public.commandes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id),
  zone_id uuid references public.zones(id),
  livreur_id uuid references public.livreurs(id),
  statut text default 'en_attente' check (statut in ('en_attente','en_livraison','livre','annule','echec')),
  cout_livraison numeric(10,0) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.commandes enable row level security;
create policy "commandes owner" on public.commandes for all using (auth.uid() = user_id);

-- ============ LIGNES DE COMMANDE ============
create table public.commande_items (
  id uuid default uuid_generate_v4() primary key,
  commande_id uuid references public.commandes(id) on delete cascade,
  produit_id uuid references public.produits(id),
  quantite integer not null default 1,
  prix_unitaire numeric(10,0) not null,
  cout_unitaire numeric(10,0) not null default 0
);
alter table public.commande_items enable row level security;
create policy "items via commande" on public.commande_items for all
  using (exists (select 1 from public.commandes c where c.id = commande_id and c.user_id = auth.uid()));

-- ============ VUE COMMANDES ENRICHIE ============
create or replace view public.commandes_detail as
  select
    c.*,
    cl.nom as client_nom,
    cl.telephone as client_tel,
    cl.adresse as client_adresse,
    z.nom as zone_nom,
    l.nom as livreur_nom,
    coalesce(sum(ci.quantite * ci.prix_unitaire), 0) as total_vente,
    coalesce(sum(ci.quantite * ci.cout_unitaire), 0) as total_cout,
    coalesce(sum(ci.quantite * ci.prix_unitaire), 0)
      - coalesce(sum(ci.quantite * ci.cout_unitaire), 0)
      - c.cout_livraison as benefice
  from public.commandes c
  left join public.clients cl on cl.id = c.client_id
  left join public.zones z on z.id = c.zone_id
  left join public.livreurs l on l.id = c.livreur_id
  left join public.commande_items ci on ci.commande_id = c.id
  group by c.id, cl.nom, cl.telephone, cl.adresse, z.nom, l.nom;

-- ============ FACTURES ============
create table public.factures (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  commande_id uuid references public.commandes(id),
  numero text not null,
  montant_total numeric(10,0),
  created_at timestamptz default now()
);
alter table public.factures enable row level security;
create policy "factures owner" on public.factures for all using (auth.uid() = user_id);

-- ============ DONNÉES DEMO (optionnel) ============
-- Décommente pour insérer des données de test après inscription
-- insert into public.zones (user_id, nom) values (auth.uid(), 'Dakar Centre');
-- insert into public.zones (user_id, nom) values (auth.uid(), 'Plateau');
-- insert into public.zones (user_id, nom) values (auth.uid(), 'Pikine');
