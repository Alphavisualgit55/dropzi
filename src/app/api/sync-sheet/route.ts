import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function syncUser(config: any): Promise<number> {
  const userId = config.user_id
  const sheetUrl = config.sheet_url

  // Lire le CSV avec timeout
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  let res: Response
  try {
    res = await fetch(sheetUrl, { signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(timeout)
  }
  if (!res.ok) throw new Error('Impossible de lire le sheet')
  const text = await res.text()

  const lines = text.split('\n').filter((l: string) => l.trim())
  if (lines.length < 2) return 0

  const headers = lines[0].split(',').map((h: string) => h.replace(/"/g, '').trim().toLowerCase())

  // A=Full Name, B=Phone, C=Address, D=Product Name, E=Product Price, F=Product Quantity, G=Date & Time
  const idx = {
    name:    headers.findIndex((h: string) => h.includes('full name') || h.includes('name')),
    phone:   headers.findIndex((h: string) => h.includes('phone')),
    address: headers.findIndex((h: string) => h.includes('address')),
    product: headers.findIndex((h: string) => h.includes('product name')),
    price:   headers.findIndex((h: string) => h.includes('product price') || h.includes('price')),
    qty:     headers.findIndex((h: string) => h.includes('quantity') || h.includes('qty')),
    date:    headers.findIndex((h: string) => h.includes('date') || h.includes('time')) !== -1
      ? headers.findIndex((h: string) => h.includes('date') || h.includes('time'))
      : 6,
  }

  // Récupérer produits, zones ET toutes les empreintes déjà importées EN UNE SEULE requête
  const [{ data: produits }, { data: zones }, { data: existingFP }] = await Promise.all([
    supabase.from('produits').select('*').eq('user_id', userId).eq('actif', true),
    supabase.from('zones').select('*').eq('user_id', userId),
    supabase.from('sync_imported').select('fingerprint').eq('user_id', userId),
  ])

  // Set en mémoire — O(1) pour chaque check
  const fpSet = new Set((existingFP || []).map((r: any) => r.fingerprint))

  const zoneId = config.zone_id || zones?.[0]?.id || null
  const zone = zones?.find((z: any) => z.id === zoneId)
  const coutLivraison = zone?.cout_livraison || 0

  // Parser toutes les lignes et filtrer les non-importées
  const toImport: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c: string) => c.replace(/"/g, '').trim())
    const phone = cols[idx.phone] || ''
    const productName = cols[idx.product] || ''
    const dateStr = cols[idx.date] || ''
    const fullName = cols[idx.name] || ''
    if (!fullName && !phone) continue

    const fingerprint = `Sync auto — ${phone}|${productName}|${dateStr}`
    if (fpSet.has(fingerprint)) continue // Déjà importée → skip

    toImport.push({
      fullName, phone,
      address: cols[idx.address] || '',
      productName,
      productPrice: parseFloat(cols[idx.price]) || 0,
      productQty: parseInt(cols[idx.qty]) || 1,
      dateStr,
      fingerprint,
    })
  }

  if (toImport.length === 0) return 0

  // Si c'est la première sync (sync_imported vide pour cet user)
  // → enregistrer toutes les empreintes SANS importer (évite d'importer l'historique)
  const isFirstSync = (existingFP || []).length === 0 && config.nb_importees === 0

  if (isFirstSync && toImport.length > 0) {
    console.log(`Première sync pour ${userId} — enregistrement de ${toImport.length} empreintes sans import`)
    // Sauvegarder toutes les empreintes par batch
    const batchSize = 100
    for (let b = 0; b < toImport.length; b += batchSize) {
      const batch = toImport.slice(b, b + batchSize).map((r: any) => ({
        user_id: userId,
        fingerprint: r.fingerprint,
      }))
      await supabase.from('sync_imported').upsert(batch, { onConflict: 'user_id,fingerprint' })
    }
    await supabase.from('sync_config').update({
      derniere_sync: new Date().toISOString(),
      nb_importees: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', config.id)
    return 0
  }

  // Filtrer uniquement les commandes récentes (dernière heure max)
  const uneHeure = new Date(Date.now() - 60 * 60 * 1000)
  const recent = toImport.filter((row: any) => {
    if (!row.dateStr) return true // Pas de date → importer quand même
    const d = new Date(row.dateStr)
    return isNaN(d.getTime()) || d >= uneHeure
  })

  if (recent.length === 0) return 0

  let imported = 0

  for (const row of recent) {
    try {
      // Vérifier limite plan
      try {
        const planOk = await supabase.rpc('check_plan_limit', { uid: userId, resource: 'commandes' })
        if (!planOk.data) {
          await supabase.from('notifications_user').insert({
            user_id: userId,
            titre: '🚫 Limite de commandes atteinte',
            message: 'Tu as atteint la limite de commandes de ton plan. Upgrade pour continuer.',
            type: 'warning',
          })
          break
        }
      } catch (_) {}

      // Créer ou trouver client
      let clientId: string | null = null
      if (row.phone) {
        const { data: ex } = await supabase.from('clients').select('id').eq('user_id', userId).eq('telephone', row.phone).maybeSingle()
        if (ex) {
          clientId = ex.id
        } else {
          const { data: nc } = await supabase.from('clients').insert({ user_id: userId, nom: row.fullName, telephone: row.phone, adresse: row.address }).select('id').single()
          clientId = nc?.id || null
        }
      }

      // Trouver produit Dropzi correspondant
      let produitId: string | null = null
      let coutAchat = 0
      let prixVente = row.productPrice
      const match = produits?.find((p: any) => {
        const pn = p.nom.toLowerCase()
        const qn = row.productName.toLowerCase()
        return pn === qn || pn.includes(qn.slice(0, 8)) || qn.includes(pn.slice(0, 8))
      })
      if (match) {
        produitId = match.id
        coutAchat = match.cout_achat || 0
        if (!prixVente) prixVente = match.prix_vente || 0
      }

      // Créer commande
      const { data: commande } = await supabase.from('commandes').insert({
        user_id: userId,
        client_id: clientId,
        zone_id: zoneId,
        statut: 'en_attente',
        cout_livraison: coutLivraison,
        notes: row.fingerprint,
      }).select('id').single()

      if (commande) {
        await supabase.from('commande_items').insert({
          commande_id: commande.id,
          produit_id: produitId,
          quantite: row.productQty,
          prix_unitaire: prixVente,
          cout_unitaire: coutAchat,
        })

        // Sauvegarder empreinte
        await supabase.from('sync_imported').upsert(
          { user_id: userId, fingerprint: row.fingerprint },
          { onConflict: 'user_id,fingerprint' }
        )
        fpSet.add(row.fingerprint)
        imported++
      }
    } catch (e) {
      console.error('Erreur import ligne:', e)
    }
  }

  // Mettre à jour config
  await supabase.from('sync_config').update({
    derniere_sync: new Date().toISOString(),
    nb_importees: (config.nb_importees || 0) + imported,
    updated_at: new Date().toISOString(),
  }).eq('id', config.id)

  if (imported > 0) {
    await supabase.from('notifications_user').insert({
      user_id: userId,
      titre: `${imported} nouvelle${imported > 1 ? 's' : ''} commande${imported > 1 ? 's' : ''} importée${imported > 1 ? 's' : ''}`,
      message: `${imported} commande${imported > 1 ? 's' : ''} Shopify synchronisée${imported > 1 ? 's' : ''} automatiquement.`,
      type: 'success',
      data: { imported },
    })
  }

  return imported
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== (process.env.CRON_SECRET || 'dropzi2025syncKey!')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { data: configs } = await supabase
      .from('sync_config')
      .select('*')
      .eq('actif', true)

    if (!configs?.length) {
      return NextResponse.json({ message: 'Aucune config active', totalImported: 0 })
    }

    let totalImported = 0
    for (const config of configs) {
      try {
        const n = await syncUser(config)
        totalImported += n
      } catch (e: any) {
        console.error('Erreur sync user:', e.message)
      }
    }

    return NextResponse.json({ message: 'Sync terminée', totalImported, configs: configs.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user_id } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id requis' }, { status: 400 })

  const { data: config } = await supabase
    .from('sync_config').select('*').eq('user_id', user_id).eq('actif', true).single()

  if (!config) return NextResponse.json({ error: 'Aucune config' }, { status: 404 })

  const imported = await syncUser(config)
  return NextResponse.json({ imported })
}
