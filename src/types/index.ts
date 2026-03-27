export type Statut = 'en_attente' | 'en_livraison' | 'livre' | 'annule' | 'echec'
export type Plan = 'basic' | 'business' | 'elite'

export interface Profile {
  id: string
  email: string
  nom_boutique: string | null
  telephone: string | null
  plan: Plan
  created_at: string
}

export interface Zone {
  id: string
  user_id: string
  nom: string
}

export interface Livreur {
  id: string
  user_id: string
  nom: string
  telephone: string | null
  actif: boolean
}

export interface Produit {
  id: string
  user_id: string
  nom: string
  prix_vente: number
  cout_achat: number
  stock_total: number
  image_url: string | null
  categorie_id: string | null
  actif: boolean
  created_at: string
  marge?: number
  marge_pct?: number
}

export interface Client {
  id: string
  user_id: string
  nom: string
  telephone: string | null
  adresse: string | null
}

export interface CommandeItem {
  id: string
  commande_id: string
  produit_id: string
  quantite: number
  prix_unitaire: number
  cout_unitaire: number
  produit?: Produit
}

export interface Commande {
  id: string
  user_id: string
  client_id: string | null
  zone_id: string | null
  livreur_id: string | null
  statut: Statut
  cout_livraison: number
  notes: string | null
  created_at: string
  updated_at: string
  client_nom?: string
  client_tel?: string
  client_adresse?: string
  zone_nom?: string
  livreur_nom?: string
  total_vente?: number
  total_cout?: number
  benefice?: number
  items?: CommandeItem[]
}

export interface StatsDashboard {
  ca_jour: number
  benefice_jour: number
  nb_commandes: number
  nb_livrees: number
  nb_en_cours: number
  nb_annulees: number
}
