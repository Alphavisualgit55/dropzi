'use client'
import { useEffect, useState, useCallback } from 'react'
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
  matched_produit: any | null
  status: 'new' | 'duplicate' | 'selected' | 'imported' | 'error'
}

export default function ImportPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [sheetUrl, setSheetUrl] = useState('')
  const [rows, setRows] = useState<SheetRow[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [done, setDone] = useState(0)
  const [step, setStep] = useState<'config' | 'preview' | 'done'>('config')
  const [produits, setProduits] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [defaultZoneId, setDefaultZoneId] = useState('')
  const [syncConfig, setSyncConfig] = useState<any>(null)
  const [savingSync, setSavingSync] = useState(false)
  const [syncSaved, setSyncSaved] = useState(false)
  const [tab, setTab] = useState<'auto' | 'manuel'>('auto')
  const [importCount, setImportCount] = useState(0)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      charger(user.id)
    })
  }, [])

  async function charger(uid: string) {
    const [p, z, sc] = await Promise.all([
      supabase.from('produits').select('*').eq('user_id', uid).eq('actif', true),
      supabase.from('zones').select('*').eq('user_id', uid),
      supabase.from('sync_config').select('*').eq('user_id', uid).single(),
    ])
    setProduits(p.data || [])
    setZones(z.data || [])
    if (sc.data) {
      setSyncConfig(sc.data)
      setSheetUrl(sc.data.sheet_url || '')
      setDefaultZoneId(sc.data.zone_id || '')
      setLastSync(sc.data.derniere_sync || null)
      setImportCount(sc.data.nb_importees || 0)
    } else if (z.data?.length) {
      setDefaultZoneId(z.data[0].id)
    }
  }

  async function sauvegarderSync() {
    if (!userId || !sheetUrl) return
    setSavingSync(true)
    const payload = { user_id: userId, sheet_url: sheetUrl, zone_id: defaultZoneId || null, actif: true, updated_at: new Date().toISOString() }
    if (syncConfig) {
      await supabase.from('sync_config').update(payload).eq('user_id', userId)
    } else {
      await supabase.from('sync_config').insert(payload)
    }
    const { data } = await supabase.from('sync_config').select('*').eq('user_id', userId).single()
    if (data) setSyncConfig(data)
    setSavingSync(false); setSyncSaved(true)
    setTimeout(() => setSyncSaved(false), 3000)
  }

  async function syncMaintenant() {
    if (!userId) return
    setSyncing(true)
    try {
      const res = await fetch(`/api/sync-sheet?secret=dropzi2025syncKey!`)
      const data = await res.json()
      alert(data.totalImported > 0 ? `✅ ${data.totalImported} nouvelle(s) commande(s) importée(s) !` : '✅ Aucune nouvelle commande.')
      charger(userId)
    } catch { alert('Erreur de synchronisation') }
    setSyncing(false)
  }

  // Trouver le produit correspondant dans Dropzi
  function matchProduit(productName: string): any | null {
    if (!productName || produits.length === 0) return null
    const name = productName.toLowerCase().trim()
    // Correspondance exacte d'abord
    let match = produits.find((p: any) => p.nom.toLowerCase() === name)
    if (match) return match
    // Correspondance partielle
    match = produits.find((p: any) => {
      const pn = p.nom.toLowerCase()
      return pn.includes(name.slice(0, 8)) || name.includes(pn.slice(0, 8))
    })
    return match || null
  }

  async function fetchSheet() {
    if (!userId) return
    setLoading(true)

    // Récupérer la dernière sync pour anti-doublon
    const { data: sc } = await supabase.from('sync_config').select('derniere_sync, nb_importees').eq('user_id', userId).single()
    const derniereSync = sc?.derniere_sync ? new Date(sc.derniere_sync) : null

    let csvUrl = sheetUrl.trim()
    if (csvUrl.includes('spreadsheets/d/')) {
      const match = csvUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (match) csvUrl = `/api/sheets?id=${match[1]}&gid=0`
    }

    try {
      const res = await fetch(csvUrl.startsWith('http') ? `/api/sheets?url=${encodeURIComponent(csvUrl)}` : csvUrl)
      if (!res.ok) throw new Error('Impossible de lire le fichier.')
      const json = await res.json()
      const text = json.csv || await res.text()

      const lines = text.split('\n').filter((l: string) => l.trim())
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

      const parsed: SheetRow[] = lines.slice(1).map((line: string) => {
        const cols = line.split(',').map((c: string) => c.replace(/"/g, '').trim())
        const dateStr = cols[idx.date] || ''
        const rowDate = dateStr ? new Date(dateStr) : null
        const productName = cols[idx.product] || ''

        // Détecter doublon par date
        let status: SheetRow['status'] = 'new'
        if (derniereSync && rowDate && rowDate <= derniereSync) status = 'duplicate'
        else if (derniereSync && !rowDate && (sc?.nb_importees || 0) > 0) status = 'duplicate'

        return {
          full_name: cols[idx.name] || '',
          phone: cols[idx.phone] || '',
          address: cols[idx.address] || '',
          product_name: productName,
          product_price: parseFloat(cols[idx.price]) || 0,
          product_quantity: parseInt(cols[idx.qty]) || 1,
          date_time: dateStr,
          matched_produit: matchProduit(productName),
          status,
        }
      }).filter((r: SheetRow) => r.full_name || r.phone)

      setRows(parsed)
      setStep('preview')
    } catch (e: any) { alert(e.message) }
    setLoading(false)
  }

  function toggleRow(i: number) {
    setRows(prev => {
      const updated = [...prev]
      if (updated[i].status === 'new') updated[i] = { ...updated[i], status: 'selected' }
      else if (updated[i].status === 'selected') updated[i] = { ...updated[i], status: 'new' }
      return updated
    })
  }

  function selectAll() {
    setRows(prev => prev.map(r => r.status === 'duplicate' || r.status === 'imported' ? r : { ...r, status: 'selected' }))
  }

  function deselectAll() {
    setRows(prev => prev.map(r => r.status === 'duplicate' || r.status === 'imported' ? r : { ...r, status: 'new' }))
  }

  async function importerSelection() {
    if (!userId) return
    const toImport = rows.filter(r => r.status === 'selected' || r.status === 'new')
    if (toImport.length === 0) { alert('Sélectionne au moins une commande'); return }

    setImporting(true); setDone(0)
    const updated = [...rows]
    let count = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row.status !== 'selected' && row.status !== 'new') continue
      try {
        // Créer ou trouver client
        let clientId: string | null = null
        if (row.phone) {
          const { data: ex } = await supabase.from('clients').select('id').eq('user_id', userId).eq('telephone', row.phone).single()
          if (ex) { clientId = ex.id }
          else {
            const { data: nc } = await supabase.from('clients').insert({ user_id: userId, nom: row.full_name || row.phone, telephone: row.phone, adresse: row.address }).select('id').single()
            clientId = nc?.id || null
          }
        }

        // Zone
        const zoneId = defaultZoneId || zones[0]?.id || null
        const zone = zones.find((z: any) => z.id === zoneId)
        const coutLiv = zone?.cout_livraison || 0

        const { data: cmd } = await supabase.from('commandes').insert({
          user_id: userId,
          client_id: clientId,
          zone_id: zoneId,
          statut: 'en_attente',
          cout_livraison: coutLiv,
          notes: `Import manuel Shopify — ${row.date_time}`,
        }).select('id').single()

        if (cmd) {
          // Lier au produit Dropzi si trouvé
          const produit = row.matched_produit
          await supabase.from('commande_items').insert({
            commande_id: cmd.id,
            produit_id: produit?.id || null,
            quantite: row.product_quantity,
            prix_unitaire: row.product_price || produit?.prix_vente || 0,
            cout_unitaire: produit?.cout_achat || 0,
          })
          updated[i] = { ...row, status: 'imported' }
          count++
        }
      } catch {
        updated[i] = { ...row, status: 'error' }
      }
      setRows([...updated])
      setDone(count)
      await new Promise(r => setTimeout(r, 60))
    }

    // Mettre à jour derniere_sync
    await supabase.from('sync_config').update({ derniere_sync: new Date().toISOString(), nb_importees: (syncConfig?.nb_importees || 0) + count, updated_at: new Date().toISOString() }).eq('user_id', userId)

    setImporting(false); setStep('done'); setImportCount(c => c + count)
  }

  const newRows = rows.filter(r => r.status === 'new' || r.status === 'selected')
  const dupRows = rows.filter(r => r.status === 'duplicate')
  const selectedRows = rows.filter(r => r.status === 'selected')
  const F: React.CSSProperties = { width: '100%', border: '1.5px solid #EBEBEB', borderRadius: 12, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#FAFAFA', color: '#111', boxSizing: 'border-box' }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 48 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.sbt{transition:all .15s;cursor:pointer;font-family:inherit;}.row-card{transition:all .15s;cursor:pointer;}.row-card:hover{border-color:#CECBF6!important;}`}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.5, margin: 0 }}>Sync Shopify</h1>
        <p style={{ fontSize: 13, color: '#ABABAB', marginTop: 4 }}>Synchronise tes commandes Shopify automatiquement</p>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, background: '#F0F0F0', borderRadius: 14, padding: 4, marginBottom: 20 }}>
        {[['auto','⚡ Sync automatique'],['manuel','📥 Import manuel']].map(([id, label]) => (
          <button key={id} className="sbt" onClick={() => setTab(id as any)}
            style={{ flex: 1, padding: '9px', borderRadius: 11, border: 'none', background: tab === id ? '#fff' : 'transparent', color: tab === id ? '#0C0C1E' : '#888', fontWeight: 700, fontSize: 13, boxShadow: tab === id ? '0 2px 8px rgba(0,0,0,.08)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ONGLET AUTO */}
      {tab === 'auto' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Statut sync */}
          <div style={{ background: syncConfig?.actif ? 'linear-gradient(135deg,#0C0C1E,#1a1a3e)' : '#F8F8FC', borderRadius: 18, padding: '20px', border: syncConfig?.actif ? 'none' : '1px solid #EBEBEB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: syncConfig?.actif ? '#1D9E75' : '#E24B4A', animation: syncConfig?.actif ? 'pulse 2s infinite' : 'none' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: syncConfig?.actif ? '#fff' : '#0C0C1E' }}>
                  {syncConfig?.actif ? 'Sync active — toutes les 60 secondes' : 'Sync inactive'}
                </span>
              </div>
              {syncConfig?.actif && (
                <button className="sbt" onClick={() => supabase.from('sync_config').update({ actif: false }).eq('user_id', userId!).then(() => charger(userId!))}
                  style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.6)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  Désactiver
                </button>
              )}
            </div>
            {syncConfig?.actif && (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Dernière sync</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    {syncConfig.derniere_sync ? new Date(syncConfig.derniere_sync).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Total importé</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{fmt(syncConfig.nb_importees || 0)} commandes</p>
                </div>
              </div>
            )}
          </div>

          {/* Config */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '20px', border: '1px solid #F0F0F0', boxShadow: '0 1px 8px rgba(0,0,0,.04)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E', marginBottom: 14 }}>Configuration</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>URL Google Sheet publié (CSV)</label>
              <input style={F} value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." />
              <p style={{ fontSize: 11, color: '#ABABAB', marginTop: 5 }}>Google Sheet → Fichier → Partager → Publier sur le Web → CSV</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Zone de livraison par défaut</label>
              <select style={{ ...F, cursor: 'pointer' }} value={defaultZoneId} onChange={e => setDefaultZoneId(e.target.value)}>
                <option value="">Aucune zone</option>
                {zones.map((z: any) => <option key={z.id} value={z.id}>{z.nom} — {fmt(z.cout_livraison)} F</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="sbt" onClick={sauvegarderSync} disabled={savingSync || !sheetUrl}
                style={{ flex: 1, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, opacity: !sheetUrl ? .5 : 1 }}>
                {savingSync ? '⏳...' : syncSaved ? '✓ Sauvegardé !' : '💾 Sauvegarder & activer'}
              </button>
              {syncConfig && (
                <button className="sbt" onClick={syncMaintenant} disabled={syncing}
                  style={{ background: '#F0FFF4', color: '#16A34A', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 700 }}>
                  {syncing ? '⏳' : '▶ Sync maintenant'}
                </button>
              )}
            </div>
          </div>

          {/* Guide cron */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>⚡ Pour la sync automatique toutes les minutes</p>
            <p style={{ fontSize: 12, color: '#92400E', marginBottom: 8 }}>Configure cron-job.org avec cette URL :</p>
            <code style={{ display: 'block', background: '#FEF3C7', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#78350F', wordBreak: 'break-all' }}>
              https://dropzi.netlify.app/api/sync-sheet?secret=dropzi2025syncKey!
            </code>
          </div>
        </div>
      )}

      {/* ONGLET MANUEL */}
      {tab === 'manuel' && step === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: '20px', border: '1px solid #F0F0F0', boxShadow: '0 1px 8px rgba(0,0,0,.04)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E', marginBottom: 14 }}>Importer depuis Shopify</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>URL Google Sheet ou CSV Shopify</label>
              <input style={F} value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/..." />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Zone de livraison</label>
              <select style={{ ...F, cursor: 'pointer' }} value={defaultZoneId} onChange={e => setDefaultZoneId(e.target.value)}>
                <option value="">Aucune zone</option>
                {zones.map((z: any) => <option key={z.id} value={z.id}>{z.nom} — {fmt(z.cout_livraison)} F</option>)}
              </select>
            </div>
            <button className="sbt" onClick={fetchSheet} disabled={loading || !sheetUrl}
              style={{ width: '100%', background: loading ? '#ccc' : 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, opacity: !sheetUrl ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><span style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />Lecture...</> : '📥 Charger les commandes'}
            </button>
          </div>

          {/* Info produits */}
          {produits.length === 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>⚠️ Aucun produit importé</p>
              <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>Importe d'abord tes produits Shopify dans <a href="/dashboard/import-produits" style={{ color: '#DC2626', fontWeight: 700 }}>Import Produits</a> pour que les commandes soient bien liées.</p>
            </div>
          )}
        </div>
      )}

      {/* ÉTAPE PREVIEW */}
      {tab === 'manuel' && step === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Stats */}
          <div style={{ background: '#0C0C1E', borderRadius: 18, padding: '18px 20px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Commandes trouvées</p>
                <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>{rows.length}</p>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#9FE1CB' }}>{newRows.length}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Nouvelles</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#FAC775' }}>{dupRows.length}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Déjà importées</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#AFA9EC' }}>{selectedRows.length}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Sélectionnées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Barre progression import */}
          {importing && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #EBEBEB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Import en cours...</span>
                <span style={{ fontSize: 13, color: '#7F77DD', fontWeight: 700 }}>{done}/{newRows.length + selectedRows.length}</span>
              </div>
              <div style={{ background: '#F0F0F8', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${(done / Math.max(newRows.length + selectedRows.length, 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#7F77DD,#1D9E75)', borderRadius: 8, transition: 'width .3s' }} />
              </div>
            </div>
          )}

          {/* Actions sélection */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="sbt" onClick={selectAll}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #7F77DD', background: '#EEEDFE', color: '#534AB7', fontSize: 13, fontWeight: 700 }}>
              ✓ Tout sélectionner ({newRows.length})
            </button>
            <button className="sbt" onClick={deselectAll}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #EBEBEB', background: '#fff', color: '#888', fontSize: 13, fontWeight: 700 }}>
              ✕ Tout désélectionner
            </button>
            <button className="sbt" onClick={() => setStep('config')}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #EBEBEB', background: '#fff', color: '#666', fontSize: 13, fontWeight: 700 }}>
              ← Retour
            </button>
          </div>

          {/* Liste commandes */}
          <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((r, i) => {
              const isDup = r.status === 'duplicate'
              const isImported = r.status === 'imported'
              const isSelected = r.status === 'selected'
              const isNew = r.status === 'new'
              return (
                <div key={i} className="row-card"
                  onClick={() => !isDup && !isImported && toggleRow(i)}
                  style={{ background: isImported ? '#F0FFF4' : isDup ? '#FFFBEB' : isSelected ? '#EEEDFE' : '#fff', border: `1.5px solid ${isImported ? '#BBF7D0' : isDup ? '#FDE68A' : isSelected ? '#7F77DD' : '#EBEBEB'}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, opacity: isDup ? .6 : 1 }}>

                  {/* Checkbox */}
                  {!isDup && !isImported && (
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSelected ? '#7F77DD' : '#D0D0D0'}`, background: isSelected ? '#7F77DD' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelected && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
                    </div>
                  )}
                  {isImported && <span style={{ fontSize: 18, flexShrink: 0 }}>✅</span>}
                  {isDup && <span style={{ fontSize: 18, flexShrink: 0 }}>⏭️</span>}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E' }}>{r.full_name || 'Client'}</p>
                      {r.phone && <span style={{ fontSize: 11, color: '#534AB7', background: '#EEEDFE', padding: '1px 7px', borderRadius: 20 }}>{r.phone}</span>}
                    </div>
                    {r.product_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: r.matched_produit ? '#16A34A' : '#D97706', fontWeight: 600 }}>
                          🛍️ {r.product_name}
                        </span>
                        {r.matched_produit ? (
                          <span style={{ fontSize: 10, background: '#F0FFF4', color: '#16A34A', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>✓ Lié</span>
                        ) : (
                          <span style={{ fontSize: 10, background: '#FFFBEB', color: '#D97706', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>Pas de produit</span>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {r.date_time && <span style={{ fontSize: 10, color: '#ABABAB' }}>📅 {r.date_time}</span>}
                      {isDup && <span style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>Déjà importée</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#0C0C1E' }}>{fmt(r.product_price)} F</p>
                    {r.product_quantity > 1 && <p style={{ fontSize: 10, color: '#ABABAB' }}>×{r.product_quantity}</p>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* BOUTON IMPORTER */}
          <button className="sbt" onClick={importerSelection}
            disabled={importing || (selectedRows.length === 0 && newRows.length === 0)}
            style={{ width: '100%', background: importing ? '#ccc' : 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 16, padding: '15px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(127,119,221,.4)', opacity: (selectedRows.length === 0 && newRows.length === 0) ? .5 : 1 }}>
            {importing
              ? <><span style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />Import en cours...</>
              : `⚡ Importer ${selectedRows.length > 0 ? selectedRows.length : newRows.length} commande${(selectedRows.length || newRows.length) > 1 ? 's' : ''}`
            }
          </button>
        </div>
      )}

      {/* DONE */}
      {tab === 'manuel' && step === 'done' && (
        <div style={{ background: '#fff', borderRadius: 20, padding: '48px 24px', textAlign: 'center', border: '1px solid #EBEBEB' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.5, marginBottom: 8 }}>{done} commande{done > 1 ? 's' : ''} importée{done > 1 ? 's' : ''} !</p>
          <p style={{ fontSize: 14, color: '#ABABAB', marginBottom: 32 }}>Elles sont maintenant dans ta page Commandes.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="sbt" onClick={() => { setStep('config'); setRows([]) }}
              style={{ padding: '12px 24px', borderRadius: 14, border: '1.5px solid #EBEBEB', background: '#fff', color: '#666', fontSize: 14, fontWeight: 600 }}>
              Nouvel import
            </button>
            <a href="/dashboard/commandes" style={{ padding: '12px 24px', borderRadius: 14, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Voir les commandes →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
