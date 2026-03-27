-- ============================================
-- DROPZI v2 — Schéma complet amélioré
-- ============================================

create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nom_boutique text default 'Ma Boutique',
  telephone text,
  plan text default 'business',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profil owner" on public.profiles for all using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ZONES (avec coût de livraison intégré)
create table public.zones (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  cout_livraison numeric(10,0) not null default 0,
  created_at timestamptz default now()
);
alter table public.zones enable row level security;
create policy "zones owner" on public.zones for all using (auth.uid() = user_id);

-- LIVREURS
create table public.livreurs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  telephone text,
  zone_id uuid references public.zones(id),
  actif boolean default true,
  created_at timestamptz default now()
);
alter table public.livreurs enable row level security;
create policy "livreurs owner" on public.livreurs for all using (auth.uid() = user_id);

-- CATÉGORIES
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null
);
alter table public.categories enable row level security;
create policy "categories owner" on public.categories for all using (auth.uid() = user_id);

-- PRODUITS
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
  created_at timestamptz default now()
);
alter table public.produits enable row level security;
create policy "produits owner" on public.produits for all using (auth.uid() = user_id);

-- STOCK PAR ZONE
create table public.stock_zones (
  id uuid default uuid_generate_v4() primary key,
  produit_id uuid references public.produits(id) on delete cascade,
  zone_id uuid references public.zones(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  quantite integer not null default 0,
  unique(produit_id, zone_id)
);
alter table public.stock_zones enable row level security;
create policy "stock_zones owner" on public.stock_zones for all using (auth.uid() = user_id);

-- CLIENTS
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text,
  telephone text,
  adresse text,
  created_at timestamptz default now()
);
alter table public.clients enable row level security;
create policy "clients owner" on public.clients for all using (auth.uid() = user_id);

-- COMMANDES
create table public.commandes (
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
create policy "commandes owner" on public.commandes for all using (auth.uid() = user_id);

-- Auto-numéro commande
create or replace function set_numero_commande()
returns trigger as $$
declare
  cnt integer;
begin
  select count(*) + 1 into cnt from public.commandes where user_id = new.user_id;
  new.numero_commande := 'CMD-' || lpad(cnt::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_numero_commande
  before insert on public.commandes
  for each row execute procedure set_numero_commande();

-- LIGNES DE COMMANDE
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

-- DÉDUCTIONS STOCK AUTO quand commande livrée
create or replace function public.update_stock_on_delivery()
returns trigger as $$
begin
  if new.statut = 'livre' and old.statut != 'livre' then
    update public.produits p
    set stock_total = stock_total - ci.quantite
    from public.commande_items ci
    where ci.commande_id = new.id and ci.produit_id = p.id;

    if new.zone_id is not null then
      update public.stock_zones sz
      set quantite = greatest(0, quantite - ci.quantite)
      from public.commande_items ci
      where ci.commande_id = new.id
        and ci.produit_id = sz.produit_id
        and sz.zone_id = new.zone_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_stock_on_delivery
  after update on public.commandes
  for each row execute procedure public.update_stock_on_delivery();

-- DÉPENSES (pub, achat, autre)
create table public.depenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('pub','achat','autre')),
  description text,
  montant numeric(10,0) not null,
  date date not null default current_date,
  created_at timestamptz default now()
);
alter table public.depenses enable row level security;
create policy "depenses owner" on public.depenses for all using (auth.uid() = user_id);

-- VUE COMMANDES ENRICHIE (bénéfice uniquement sur commandes livrées)
create or replace view public.commandes_detail as
  select
    c.*,
    cl.nom as client_nom,
    cl.telephone as client_tel,
    cl.adresse as client_adresse,
    z.nom as zone_nom,
    z.cout_livraison as zone_cout_livraison,
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

-- FACTURES
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
