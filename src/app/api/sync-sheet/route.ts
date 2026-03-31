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

    for (const config of configs) {
      try {
        const imported = await syncUser(config)
        totalImported += imported
      } catch (e: any) {
        console.error(`Erreur sync user ${config.user_id}:`, e.message)
      }
    }

    return NextResponse.json({ message: 'Sync terminée', totalImported })
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
    date: headers.findIndex((h: string) => h.includes('date')),
  }

  // Récupérer produits, zones ET commandes existantes pour anti-doublon
  const [{ data: produits }, { data: zones }, { data: existingCmds }] = await Promise.all([
    supabase.from('produits').select('*').eq('user_id', userId).eq('actif', true),
    supabase.from('zones').select('*').eq('user_id', userId),
    supabase.from('commandes').select('notes').eq('user_id', userId).like('notes', 'Sync auto Easy Sell%').limit(1000),
  ])

  // Set des empreintes déjà importées
  const existingNotes: Set<string> = new Set((existingCmds || []).map((c: any) => c.notes || ''))

  const zoneId = config.zone_id || zones?.[0]?.id || null
  const zone = zones?.find((z: any) => z.id === zoneId)
  const coutLivraison = zone?.cout_livraison || 0

  let imported = 0

  const maxRows = Math.min(lines.length, 21)
  for (let i = 1; i < maxRows; i++) {
    const cols = lines[i].split(',').map((c: string) => c.replace(/"/g, '').trim())
    const dateStr = cols[idx.date] || ''

    if (!cols[idx.name] && !cols[idx.phone]) continue

    const fullName = cols[idx.name] || ''
    const phone = cols[idx.phone] || ''
    const address = cols[idx.address] || ''
    const productName = cols[idx.product] || ''
    const productPrice = parseFloat(cols[idx.price]) || 0
    const productQty = parseInt(cols[idx.qty]) || 1

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

      // Trouver produit
      let produitId: string | null = null
      let coutAchat = 0
      const match = produits?.find((p: any) =>
        p.nom.toLowerCase().includes(productName.toLowerCase().slice(0, 6)) ||
        productName.toLowerCase().includes(p.nom.toLowerCase().slice(0, 6))
      )
      if (match) { produitId = match.id; coutAchat = match.cout_achat }

      // Anti-doublon : vérifier si cette commande a déjà été importée
      const fingerprint = `Sync auto Easy Sell — ${dateStr} — ${phone} — ${productName}`
      if (existingNotes.has(fingerprint)) continue
      existingNotes.add(fingerprint)

      // Vérifier limite commandes avant insertion
      const planOk = await supabase.rpc('check_plan_limit', { uid: userId, resource: 'commandes' })
      if (!planOk.data) {
        console.log(`Limite commandes atteinte pour user ${userId}`)
        // Notifier une seule fois
        try {
          await supabase.from('notifications_user').insert({
            user_id: userId,
            titre: '🚫 Limite de commandes atteinte',
            message: 'Tu as atteint la limite de commandes de ton plan. Upgrade pour continuer.',
            type: 'warning',
          })
        } catch (_) {}
        break
      }

      // Créer commande
      // Empreinte unique pour éviter les doublons
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
          prix_unitaire: productPrice,
          cout_unitaire: coutAchat,
        })
        imported++

      }
    } catch (e) {
      console.error('Erreur import ligne:', e)
    }
  }

  // Mettre à jour config
  if (imported > 0 || true) {
    await supabase.from('sync_config').update({
      derniere_sync: new Date().toISOString(),
      derniere_date_commande: new Date().toISOString(),
      nb_importees: (config.nb_importees || 0) + imported,
      updated_at: new Date().toISOString(),
    }).eq('id', config.id)

    // Créer notification si nouvelles commandes
    if (imported > 0) {
      await supabase.from('notifications_user').insert({
        user_id: userId,
        titre: `${imported} nouvelle${imported > 1 ? 's' : ''} commande${imported > 1 ? 's' : ''} importée${imported > 1 ? 's' : ''}`,
        message: `${imported} commande${imported > 1 ? 's' : ''} Easy Sell synchronisée${imported > 1 ? 's' : ''} automatiquement depuis Google Sheet.`,
        type: 'success',
        data: { imported, source: 'google_sheet' }
      })
    }
  }

  return imported
}
