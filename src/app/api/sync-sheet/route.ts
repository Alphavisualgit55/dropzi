import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function parseLines(text: string): string[] {
  return text.split('\n').filter((l) => l.trim())
}

function parseCols(line: string): string[] {
  return line.split(',').map((c) => c.replace(/"/g, '').trim())
}

function getIdx(headers: string[]) {
  return {
    name:    headers.findIndex((h) => h.includes('full name') || h.includes('name')),
    phone:   headers.findIndex((h) => h.includes('phone')),
    address: headers.findIndex((h) => h.includes('address')),
    product: headers.findIndex((h) => h.includes('product name')),
    price:   headers.findIndex((h) => h.includes('product price') || h.includes('price')),
    qty:     headers.findIndex((h) => h.includes('quantity') || h.includes('qty')),
    date:    headers.findIndex((h) => h.includes('date') || h.includes('time')) !== -1
      ? headers.findIndex((h) => h.includes('date') || h.includes('time'))
      : 6,
  }
}

async function fetchSheet(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) throw new Error('Sheet inaccessible: ' + res.status)
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

async function syncUser(config: any): Promise<number> {
  const userId = config.user_id
  const text = await fetchSheet(config.sheet_url)
  const lines = parseLines(text)
  if (lines.length < 2) return 0

  const headers = parseCols(lines[0]).map((h) => h.toLowerCase())
  const idx = getIdx(headers)

  const [{ data: produits }, { data: zones }, { data: existingFP }] = await Promise.all([
    supabase.from('produits').select('*').eq('user_id', userId).eq('actif', true),
    supabase.from('zones').select('*').eq('user_id', userId),
    supabase.from('sync_imported').select('fingerprint').eq('user_id', userId),
  ])

  const fpSet = new Set((existingFP || []).map((r: any) => r.fingerprint))
  const zoneId = config.zone_id || zones?.[0]?.id || null
  const zone = (zones || []).find((z: any) => z.id === zoneId)
  const coutLivraison = zone?.cout_livraison || 0

  const derniereDate = config.derniere_commande_date ? new Date(config.derniere_commande_date) : null
  let nouvelleMaxDate: Date | null = derniereDate
  const toImport: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCols(lines[i])
    const phone = cols[idx.phone] || ''
    const productName = cols[idx.product] || ''
    const dateStr = cols[idx.date] || ''
    const fullName = cols[idx.name] || ''
    if (!fullName && !phone) continue

    const rowDate = dateStr ? new Date(dateStr) : null
    const rowDateValid = rowDate !== null && !isNaN(rowDate.getTime())

    if (derniereDate && rowDateValid && (rowDate as Date) <= derniereDate) continue

    const fingerprint = 'Sync auto \u2014 ' + phone + '|' + productName + '|' + dateStr
    if (fpSet.has(fingerprint)) continue

    toImport.push({ fullName, phone, address: cols[idx.address] || '', productName, productPrice: parseFloat(cols[idx.price]) || 0, productQty: parseInt(cols[idx.qty]) || 1, dateStr, rowDate: rowDateValid ? rowDate : null, fingerprint })

    if (rowDateValid && (!nouvelleMaxDate || (rowDate as Date) > nouvelleMaxDate)) {
      nouvelleMaxDate = rowDate
    }
  }

  if (toImport.length === 0) {
    if (nouvelleMaxDate && (!derniereDate || nouvelleMaxDate > derniereDate)) {
      await supabase.from('sync_config').update({ derniere_commande_date: nouvelleMaxDate.toISOString(), derniere_sync: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', config.id)
    }
    return 0
  }

  try {
    const planOk = await supabase.rpc('check_plan_limit', { uid: userId, resource: 'commandes' })
    if (!planOk.data) {
      await supabase.from('notifications_user').insert({ user_id: userId, titre: 'Limite atteinte', message: 'Upgrade ton plan.', type: 'warning' })
      return 0
    }
  } catch (_) {}

  let imported = 0
  for (const row of toImport) {
    try {
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

      let produitId: string | null = null
      let coutAchat = 0
      let prixVente = row.productPrice
      const match = (produits || []).find((p: any) => {
        const pn = p.nom.toLowerCase()
        const qn = row.productName.toLowerCase()
        return pn === qn || pn.includes(qn.slice(0, 8)) || qn.includes(pn.slice(0, 8))
      })
      if (match) { produitId = match.id; coutAchat = match.cout_achat || 0; if (!prixVente) prixVente = match.prix_vente || 0 }

      const { data: commande } = await supabase.from('commandes').insert({ user_id: userId, client_id: clientId, zone_id: zoneId, statut: 'en_attente', cout_livraison: coutLivraison, notes: row.fingerprint }).select('id').single()

      if (commande) {
        await supabase.from('commande_items').insert({ commande_id: commande.id, produit_id: produitId, quantite: row.productQty, prix_unitaire: prixVente, cout_unitaire: coutAchat })
        await supabase.from('sync_imported').upsert({ user_id: userId, fingerprint: row.fingerprint }, { onConflict: 'user_id,fingerprint' })
        fpSet.add(row.fingerprint)
        imported++
      }
    } catch (e) { console.error('Erreur ligne:', e) }
  }

  await supabase.from('sync_config').update({ derniere_commande_date: nouvelleMaxDate?.toISOString() || config.derniere_commande_date, derniere_sync: new Date().toISOString(), nb_importees: (config.nb_importees || 0) + imported, updated_at: new Date().toISOString() }).eq('id', config.id)

  if (imported > 0) {
    await supabase.from('notifications_user').insert({ user_id: userId, titre: imported + ' nouvelle commande !', message: imported + ' commandes Shopify importees.', type: 'success' })
  }

  return imported
}

async function debugUser(config: any) {
  const text = await fetchSheet(config.sheet_url)
  const lines = parseLines(text)
  const headers = parseCols(lines[0] || '').map((h) => h.toLowerCase())
  const idx = getIdx(headers)
  const derniereDate = config.derniere_commande_date ? new Date(config.derniere_commande_date) : null
  const { data: fp } = await supabase.from('sync_imported').select('fingerprint').eq('user_id', config.user_id)
  const fpSet = new Set((fp || []).map((r: any) => r.fingerprint))

  let wouldImport = 0
  const last5: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCols(lines[i])
    const phone = cols[idx.phone] || ''
    const product = cols[idx.product] || ''
    const dateStr = cols[idx.date] || ''
    if (!phone && !product) continue
    const rowDate = dateStr ? new Date(dateStr) : null
    const rowDateValid = rowDate !== null && !isNaN(rowDate.getTime())
    const skippedByDate = derniereDate && rowDateValid && (rowDate as Date) <= derniereDate
    const fingerprint = 'Sync auto \u2014 ' + phone + '|' + product + '|' + dateStr
    const skippedByFP = fpSet.has(fingerprint)
    if (i >= lines.length - 5) last5.push({ phone, product, date: dateStr, skippedByDate, skippedByFP })
    if (!skippedByDate && !skippedByFP) wouldImport++
  }

  return { user_id: config.user_id.slice(0, 8), total_lines: lines.length - 1, headers, date_col_index: idx.date, derniere_commande_date: config.derniere_commande_date, fp_count: fp?.length || 0, would_import: wouldImport, last_5: last5 }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== (process.env.CRON_SECRET || 'dropzi2025syncKey!')) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  try {
    const { data: configs } = await supabase.from('sync_config').select('*').eq('actif', true)
    if (!configs?.length) return NextResponse.json({ message: 'Aucune config active', totalImported: 0 })

    if (searchParams.get('debug') === '1') {
      const results = []
      for (const config of configs) {
        try { results.push(await debugUser(config)) } catch (e: any) { results.push({ error: e.message }) }
      }
      return NextResponse.json({ debug: true, results })
    }

    let totalImported = 0
    for (const config of configs) {
      try { totalImported += await syncUser(config) } catch (e: any) { console.error('Erreur sync:', e.message) }
    }
    return NextResponse.json({ message: 'Sync terminee', totalImported, configs: configs.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user_id } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id requis' }, { status: 400 })
  const { data: config } = await supabase.from('sync_config').select('*').eq('user_id', user_id).eq('actif', true).single()
  if (!config) return NextResponse.json({ error: 'Aucune config' }, { status: 404 })
  const imported = await syncUser(config)
  return NextResponse.json({ imported })
}
