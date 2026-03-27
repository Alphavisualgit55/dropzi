# Dropzi 🚀
**Le SaaS e-commerce pensé pour l'Afrique — Gérez. Livrez. Encaissez.**

---

## Installation en 5 étapes

### 1. Installer Node.js
Télécharge et installe Node.js : https://nodejs.org (version 18 ou plus)

### 2. Installer les dépendances
Ouvre un terminal dans le dossier dropzi, puis :
```bash
npm install
```

### 3. Créer ton projet Supabase
1. Va sur https://supabase.com et crée un compte gratuit
2. Clique "New Project", nomme-le "dropzi"
3. Va dans Settings → API
4. Copie : Project URL et anon public key

### 4. Configurer les variables d'environnement
Crée un fichier `.env.local` à la racine du projet :
```
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Créer la base de données
1. Dans Supabase, va dans SQL Editor
2. Clique "New query"
3. Copie-colle tout le contenu du fichier `supabase/migrations/001_schema.sql`
4. Clique "Run"

### 6. Lancer en local
```bash
npm run dev
```
Ouvre http://localhost:3000 — tu verras la page de connexion Dropzi.

---

## Déployer sur Netlify

1. Crée un repo GitHub et pousse le code :
```bash
git init
git add .
git commit -m "Initial Dropzi"
git remote add origin https://github.com/TON_COMPTE/dropzi.git
git push -u origin main
```

2. Va sur https://netlify.com
3. Clique "Add new site" → "Import from Git"
4. Connecte GitHub et sélectionne ton repo
5. Dans "Environment variables", ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Clique "Deploy site" — ton site sera live en 2 minutes !

---

## Structure du projet

```
dropzi/
├── src/
│   ├── app/
│   │   ├── login/          → Page de connexion
│   │   └── dashboard/
│   │       ├── page.tsx        → Dashboard + bénéfice temps réel
│   │       ├── commandes/      → Gestion des commandes
│   │       ├── produits/       → Catalogue produits
│   │       ├── stock/          → Gestion du stock
│   │       ├── livraisons/     → Zones et livreurs
│   │       └── rapports/       → Rapports et graphiques
│   ├── lib/supabase.ts     → Client Supabase
│   └── types/index.ts      → Types TypeScript
├── supabase/
│   └── migrations/
│       └── 001_schema.sql  → Schéma complet à coller dans Supabase
├── .env.example            → Modèle de variables d'environnement
└── netlify.toml            → Config déploiement Netlify
```

## Fonctionnalités MVP incluses

- Authentification (inscription / connexion)
- Dashboard avec bénéfice en temps réel
- Gestion des commandes (création rapide < 10 sec)
- Gestion des produits avec calcul de marge automatique
- Gestion du stock avec alertes
- Gestion des zones et livreurs
- Rapports journalier / hebdo / mensuel
- Mise à jour des statuts en temps réel (Supabase Realtime)
