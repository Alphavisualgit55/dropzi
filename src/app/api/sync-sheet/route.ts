import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const secretParam = searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET || 'dropzi2025syncKey!'

  // Accepter via header OU via paramètre URL
  const isAuthorized = authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    // Récupérer toutes les configs actives
    const { data: configs, error: configErr } = await supabase
      .from('sync_config')
      .select('*, profiles(id, email)')
      .eq('actif', true)

    if (configErr || !configs?.length) {
      return NextResponse.json({ message: 'Aucune config active', synced: 0 })
    }

    let totalImported = 0
    console.log(`🔄 Sync démarrée - ${configs.length} config(s) active(s)`)

    for (const config of configs) {
      try {
        console.log(`Sync user ${config.user_id} - sheet: ${config.sheet_url?.slice(0, 50)}`)
        const imported = await syncUser(config)
        totalImported += imported
        console.log(`✅ User ${config.user_id}: ${imported} commandes importées`)
      } catch (e: any) {
        console.error(`❌ Erreur sync user ${config.user_id}:`, e.message)
      }
    }

    console.log(`✅ Sync terminée - total: ${totalImported} commandes`)
    return NextResponse.json({ message: 'Sync terminée', totalImported, configs: configs.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Appelé aussi manuellement depuis l'app
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user_id } = body
  if (!user_id) return NextResponse.json({ error: 'user_id manquant' }, { status: 400 })

  const { data: config } = await supabase
    .from('sync_config')
    .select('*')
    .eq('user_id', user_id)
    .eq('actif', true)
    .single()

  if (!config) return NextResponse.json({ error: 'Aucune config trouvée' }, { status: 404 })

  const imported = await syncUser(config)
  return NextResponse.json({ imported })
}

async function syncUser(config: any): Promise<number> {
  const userId = config.user_id
  const sheetUrl = config.sheet_url

  // Lire le CSV
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  let res: Response
  try {
    res = await fetch(sheetUrl, { signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(timeout)
  }
  if (!res.ok) throw new Error('Impossible de lire le Google Sheet')
  const text = await res.text()

  const lines = text.split('\n').filter((l: string) => l.trim())
  if (lines.length < 2) return 0

  const headers = lines[0].split(',').map((h: string) => h.replace(/"/g, '').trim().toLowerCase())

  const idx = {
    name: headers.findIndex((h: string) => h.includes('full name') || h.includes('name')),
    phone: headers.findIndex((h: string) => h.includes('phone')),
    address: headers.findIndex((h: string) => h.includes('address')),
    product: headers.findIndex((h: string) => h.includes('product name')),
    price: headers.findIndex((h: string) => h.includes('product price') || h.includes('price')),
    qty: headers.findIndex((h: string) => h.includes('quantity') || h.includes('qty')),
    date: headers.findIndex((h: string) => h.includes('date') || h.includes('time') || h.includes('heure') || h.includes('created')) !== -1 
      ? headers.findIndex((h: string) => h.includes('date') || h.includes('time') || h.includes('heure') || h.includes('created'))
      : 5, // Fallback: colonne F (index 5)
  }

  // Récupérer produits et zones
  const [{ data: produits }, { data: zones }] = await Promise.all([
    supabase.from('produits').select('*').eq('user_id', userId).eq('actif', true),
    supabase.from('zones').select('*').eq('user_id', userId),
  ])

  const zoneId = config.zone_id || zones?.[0]?.id || null
  const zone = zones?.find((z: any) => z.id === zoneId)
  const coutLivraison = zone?.cout_livraison || 0

  // Charger les empreintes depuis la table dédiée (persiste même après suppression des commandes)
  const { data: existingFingerprints } = await supabase
    .from('sync_imported')
    .select('fingerprint')
    .eq('user_id', userId)
  const notesSet = new Set((existingFingerprints || []).map((c: any) => c.fingerprint || ''))

  let imported = 0

  const maxRows = Math.min(lines.length, 21)
  for (let i = 1; i < maxRows; i++) {
    const cols = lines[i].split(',').map((c: string) => c.replace(/"/g, '').trim())

    const fullName = cols[idx.name] || ''
    const phone = cols[idx.phone] || ''
    if (!fullName && !phone) continue

    const address = cols[idx.address] || ''
    const productName = cols[idx.product] || ''
    const productPrice = parseFloat(cols[idx.price]) || 0
    const productQty = parseInt(cols[idx.qty]) || 1
    const dateStr = cols[idx.date] || ''

    // ANTI-DOUBLON : empreinte unique basée sur téléphone + produit + date
    const fingerprint = `Sync auto — ${phone}|${productName}|${dateStr}`
    if (notesSet.has(fingerprint)) continue

    // Vérifier limite plan (non bloquant si erreur RPC)
    try {
      const planOk = await supabase.rpc('check_plan_limit', { uid: userId, resource: 'commandes' })
      if (planOk.data === false) {
        await supabase.from('notifications_user').insert({
          user_id: userId,
          titre: '🚫 Limite de commandes atteinte',
          message: 'Tu as atteint la limite de commandes de ton plan. Upgrade pour continuer.',
          type: 'warning',
        })
        break
      }
    } catch (_) {
      // Si check_plan_limit échoue, on continue quand même
      console.log('check_plan_limit non disponible, on continue')
    }

    try {
      // Créer ou trouver client
      let clientId: string | null = null
      if (phone) {
        const { data: existing } = await supabase
          .from('clients').select('id').eq('user_id', userId).eq('telephone', phone).single()
        if (existing) {
          clientId = existing.id
        } else {
          const { data: newClient } = await supabase.from('clients').insert({
            user_id: userId, nom: fullName, telephone: phone, adresse: address
          }).select().single()
          clientId = newClient?.id || null
        }
      }

      // Trouver produit Dropzi correspondant
      let produitId: string | null = null
      let coutAchat = 0
      let prixVente = productPrice // Prix du sheet par défaut
      const match = produits?.find((p: any) => {
        const pn = p.nom.toLowerCase()
        const qn = productName.toLowerCase()
        return pn === qn || pn.includes(qn.slice(0, 8)) || qn.includes(pn.slice(0, 8))
      })
      if (match) {
        produitId = match.id
        coutAchat = match.cout_achat || 0
        // Utiliser prix du sheet s'il est non nul, sinon prix du produit Dropzi
        if (!prixVente || prixVente === 0) prixVente = match.prix_vente || 0
      }

      // Créer commande avec empreinte unique dans les notes
      const { data: commande } = await supabase.from('commandes').insert({
        user_id: userId,
        client_id: clientId,
        zone_id: zoneId,
        statut: 'en_attente',
        cout_livraison: coutLivraison,
        notes: fingerprint,
      }).select().single()

      if (commande) {
        await supabase.from('commande_items').insert({
          commande_id: commande.id,
          produit_id: produitId,
          quantite: productQty,
          prix_unitaire: prixVente,
          cout_unitaire: coutAchat,
        })
        // Sauvegarder l'empreinte dans la table dédiée
        try { await supabase.from('sync_imported').upsert({ user_id: userId, fingerprint }, { onConflict: 'user_id,fingerprint' }) } catch (_) {}
        notesSet.add(fingerprint)
        imported++
      }
    } catch (e) {
      console.error('Erreur import ligne:', e)
    }
  }

  // Mettre à jour config après sync
  await supabase.from('sync_config').update({
    derniere_sync: new Date().toISOString(),
    derniere_date_commande: new Date().toISOString(),
    nb_importees: (config.nb_importees || 0) + imported,
    updated_at: new Date().toISOString(),
  }).eq('id', config.id)

  // Notification si nouvelles commandes
  if (imported > 0) {
    await supabase.from('notifications_user').insert({
      user_id: userId,
      titre: `${imported} nouvelle${imported > 1 ? 's' : ''} commande${imported > 1 ? 's' : ''} importée${imported > 1 ? 's' : ''}`,
      message: `${imported} commande${imported > 1 ? 's' : ''} Shopify synchronisée${imported > 1 ? 's' : ''} automatiquement.`,
      type: 'success',
      data: { imported, source: 'shopify' }
    })
  }

  return imported
}
