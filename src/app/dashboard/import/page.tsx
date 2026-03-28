'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

interface SheetRow {
  full_name: string
  phone: string
  address: string
  product_name: string
  product_price: number
  product_quantity: number
  date_time: string
  status: 'pending' | 'imported' | 'error' | 'duplicate'
  error?: string
}

export default function ImportPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [sheetUrl, setSheetUrl] = useState('')
  const [rows, setRows] = useState<SheetRow[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [step, setStep] = useState<'url' | 'preview' | 'done'>('url')
  const [produits, setProduits] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [defaultZoneId, setDefaultZoneId] = useState('')
  const [lastImport, setLastImport] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('produits').select('*').eq('user_id', user.id).eq('actif', true)
        .then(({ data }) => setProduits(data || []))
      supabase.from('zones').select('*').eq('user_id', user.id)
        .then(({ data }) => {
          setZones(data || [])
          if (data && data.length > 0) setDefaultZoneId(data[0].id)
        })
      // Dernière date importée
      supabase.from('commandes').select('created_at').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1)
        .then(({ data }) => { if (data?.[0]) setLastImport(data[0].created_at) })
    })
  }, [])

  function extractSheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  async function fetchSheet() {
    setLoading(true)
    const sheetId = extractSheetId(sheetUrl)
    if (!sheetId) { alert('URL Google Sheet invalide'); setLoading(false); return }

    try {
      const csvUrl = `/api/sheets?id=${sheetId}&gid=0`
      const res = await fetch(csvUrl)
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Impossible de lire le fichier.')
      const text = json.csv
      const lines = (text as string).split('\n').filter((l: string) => l.trim())
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())

      // Détecter les colonnes
      const idx = {
        name: headers.findIndex(h => h.includes('full name') || h.includes('name')),
        phone: headers.findIndex(h => h.includes('phone')),
        address: headers.findIndex(h => h.includes('address')),
        product: headers.findIndex(h => h.includes('product name')),
        price: headers.findIndex(h => h.includes('product price') || h.includes('price')),
        qty: headers.findIndex(h => h.includes('quantity') || h.includes('qty')),
        date: headers.findIndex(h => h.includes('date')),
      }

      const parsed: SheetRow[] = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.replace(/"/g, '').trim())
        return {
          full_name: cols[idx.name] || '',
          phone: cols[idx.phone] || '',
          address: cols[idx.address] || '',
          product_name: cols[idx.product] || '',
          product_price: parseFloat(cols[idx.price]) || 0,
          product_quantity: parseInt(cols[idx.qty]) || 1,
          date_time: cols[idx.date] || '',
          status: 'pending' as const,
        }
      }).filter(r => r.full_name || r.phone)

      setRows(parsed)
      setStep('preview')
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la lecture du fichier')
    }
    setLoading(false)
  }

  async function importerTout() {
    if (!userId) return
    setImporting(true)
    setTotal(rows.length)
    setDone(0)

    const updated = [...rows]

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row.status === 'imported') { setDone(i + 1); continue }

      try {
        // Créer ou trouver le client
        let clientId: string | null = null
        if (row.phone) {
          const { data: existing } = await supabase.from('clients')
            .select('id').eq('user_id', userId).eq('telephone', row.phone).single()
          if (existing) {
            clientId = existing.id
          } else {
            const { data: newClient } = await supabase.from('clients').insert({
              user_id: userId,
              nom: row.full_name,
              telephone: row.phone,
              adresse: row.address,
            }).select().single()
            clientId = newClient?.id || null
          }
        }

        // Trouver le produit correspondant
        let produitId: string | null = null
        let coutAchat = 0
        const produitMatch = produits.find(p =>
          p.nom.toLowerCase().includes(row.product_name.toLowerCase().slice(0, 6)) ||
          row.product_name.toLowerCase().includes(p.nom.toLowerCase().slice(0, 6))
        )
        if (produitMatch) { produitId = produitMatch.id; coutAchat = produitMatch.cout_achat }

        // Trouver le coût de livraison
        const zone = zones.find(z => z.id === defaultZoneId)
        const coutLivraison = zone?.cout_livraison || 0

        // Créer la commande
        const { data: commande, error: cmdError } = await supabase.from('commandes').insert({
          user_id: userId,
          client_id: clientId,
          zone_id: defaultZoneId || null,
          statut: 'en_attente',
          cout_livraison: coutLivraison,
          notes: `Importé depuis Google Sheet (Easy Sell) — ${row.date_time}`,
        }).select().single()

        if (cmdError || !commande) throw new Error(cmdError?.message || 'Erreur création commande')

        // Créer l'item
        await supabase.from('commande_items').insert({
          commande_id: commande.id,
          produit_id: produitId,
          quantite: row.product_quantity,
          prix_unitaire: row.product_price,
          cout_unitaire: coutAchat,
        })

        updated[i] = { ...row, status: 'imported' }
      } catch (e: any) {
        updated[i] = { ...row, status: 'error', error: e.message }
      }

      setRows([...updated])
      setDone(i + 1)
      await new Promise(r => setTimeout(r, 150))
    }

    setImporting(false)
    setStep('done')
  }

  const nbImported = rows.filter(r => r.status === 'imported').length
  const nbErrors = rows.filter(r => r.status === 'error').length

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-medium">Import Google Sheet</h1>
        <p className="text-sm text-gray-400 mt-1">Importe tes commandes Easy Sell / Shopify automatiquement</p>
      </div>

      {/* ÉTAPE 1 — URL */}
      {step === 'url' && (
        <div className="card space-y-4">
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 16px' }}>
            <p className="text-sm font-medium text-green-800 mb-1">📋 Comment ça marche ?</p>
            <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
              <li>Ouvre ton Google Sheet Easy Sell</li>
              <li>Clique <strong>Partager</strong> → <strong>Toute personne ayant le lien</strong> → Lecteur</li>
              <li>Colle le lien ci-dessous</li>
              <li>Dropzi importe toutes les commandes automatiquement</li>
            </ol>
          </div>

          {/* Zone par défaut */}
          {zones.length > 0 && (
            <div>
              <label className="label">Zone de livraison par défaut</label>
              <select className="input" value={defaultZoneId} onChange={e => setDefaultZoneId(e.target.value)}>
                <option value="">Sans zone</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.nom} — {fmt(z.cout_livraison)} F</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Tu pourras modifier la zone commande par commande ensuite</p>
            </div>
          )}

          <div>
            <label className="label">Lien Google Sheet *</label>
            <input className="input" value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..." />
          </div>

          {lastImport && (
            <p className="text-xs text-gray-400">
              ℹ️ Dernière commande importée le {new Date(lastImport).toLocaleString('fr-FR')}
            </p>
          )}

          <button onClick={fetchSheet} disabled={loading || !sheetUrl} className="btn-primary w-full">
            {loading ? '⏳ Lecture du fichier...' : '📥 Lire le Google Sheet'}
          </button>
        </div>
      )}

      {/* ÉTAPE 2 — PREVIEW */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Résumé */}
          <div style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', borderRadius: 18, padding: 20, color: '#fff' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 6 }}>Commandes trouvées</p>
            <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>{rows.length}</p>
            <div style={{ marginTop: 10, display: 'flex', gap: 20, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
              <span>📦 {rows.length} à importer</span>
              {produits.length === 0 && <span style={{ color: '#FAC775' }}>⚠️ Aucun produit trouvé dans Dropzi</span>}
            </div>
          </div>

          {/* Avertissement produits */}
          {produits.length === 0 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px' }}>
              <p className="text-sm text-amber-800 font-medium">⚠️ Aucun produit dans Dropzi</p>
              <p className="text-xs text-amber-700 mt-1">Les commandes seront importées sans produit lié. Tu pourras les modifier ensuite dans Commandes.</p>
            </div>
          )}

          {/* Barre de progression import */}
          {importing && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Import en cours...</span>
                <span className="text-sm text-gray-500">{done}/{total}</span>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${total > 0 ? (done / total) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg,#7F77DD,#534AB7)', borderRadius: 8, transition: 'width .3s ease' }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">{Math.round(total > 0 ? (done / total) * 100 : 0)}% terminé</p>
            </div>
          )}

          {/* Liste preview */}
          <div className="space-y-2" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
            {rows.map((row, i) => (
              <div key={i} className="card" style={{
                borderColor: row.status === 'imported' ? '#BBF7D0' : row.status === 'error' ? '#FECACA' : '#e8e8f0',
                background: row.status === 'imported' ? '#F0FDF4' : row.status === 'error' ? '#FEF2F2' : '#fff'
              }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {(row.full_name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{row.full_name || 'Client inconnu'}</p>
                      {row.status === 'imported' && <span className="text-xs text-green-600 font-medium">✓ Importé</span>}
                      {row.status === 'error' && <span className="text-xs text-red-500 font-medium">✗ Erreur</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      📞 {row.phone} · 📍 {row.address || '—'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      📦 {row.product_name} × {row.product_quantity} — {fmt(row.product_price)} F
                    </p>
                    {row.error && <p className="text-xs text-red-500 mt-0.5">{row.error}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-[#7F77DD]">{fmt(row.product_price * row.product_quantity)} F</p>
                    <p className="text-xs text-gray-400">{row.date_time ? new Date(row.date_time).toLocaleDateString('fr-FR') : '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setStep('url'); setRows([]) }} className="btn-secondary text-sm flex-1">
              ← Retour
            </button>
            <button onClick={importerTout} disabled={importing || rows.length === 0} className="btn-primary text-sm flex-1">
              {importing ? `⏳ Import ${done}/${total}...` : `⚡ Importer ${rows.length} commandes`}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — DONE */}
      {step === 'done' && (
        <div className="card text-center py-10 space-y-4">
          <div style={{ fontSize: 56 }}>{nbErrors === 0 ? '🎉' : '⚠️'}</div>
          <div>
            <p className="text-xl font-bold text-gray-900">{nbImported} commandes importées</p>
            {nbErrors > 0 && <p className="text-sm text-red-500 mt-1">{nbErrors} erreurs</p>}
          </div>
          <div style={{ background: '#EEEDFE', borderRadius: 14, padding: '14px 20px', display: 'inline-block' }}>
            <p className="text-sm text-[#534AB7]">
              Total importé : <strong>{fmt(rows.filter(r => r.status === 'imported').reduce((s, r) => s + r.product_price * r.product_quantity, 0))} FCFA</strong>
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setStep('url'); setRows([]) }} className="btn-secondary text-sm">
              Nouvel import
            </button>
            <a href="/dashboard/commandes" className="btn-primary text-sm">
              Voir les commandes →
            </a>
          </div>
        </div>
      )}

      {/* INFOS */}
      <div className="card" style={{ background: '#F8F8FC' }}>
        <p className="text-xs font-medium text-gray-500 mb-2">📋 Colonnes reconnues automatiquement</p>
        <div className="grid grid-cols-2 gap-1">
          {[
            ['Full Name', 'Nom du client'],
            ['Phone', 'Téléphone'],
            ['Address 1', 'Adresse livraison'],
            ['Product Name', 'Nom du produit'],
            ['Product Price', 'Prix unitaire'],
            ['Product Quantity', 'Quantité'],
            ['Date & Time', 'Date de commande'],
          ].map(([col, desc]) => (
            <div key={col} className="flex gap-1 text-xs">
              <span className="text-[#7F77DD] font-medium">{col}</span>
              <span className="text-gray-400">→ {desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
