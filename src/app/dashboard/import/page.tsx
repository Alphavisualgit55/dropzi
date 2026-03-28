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
  const [syncing, setSyncing] = useState(false)
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [step, setStep] = useState<'url' | 'preview' | 'done'>('url')
  const [produits, setProduits] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [defaultZoneId, setDefaultZoneId] = useState('')
  const [syncConfig, setSyncConfig] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [savingSync, setSavingSync] = useState(false)
  const [syncSaved, setSyncSaved] = useState(false)
  const [tab, setTab] = useState<'manuel' | 'auto'>('auto')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      charger(user.id)
    })
  }, [])

  async function charger(uid: string) {
    const [p, z, sc, n] = await Promise.all([
      supabase.from('produits').select('*').eq('user_id', uid).eq('actif', true),
      supabase.from('zones').select('*').eq('user_id', uid),
      supabase.from('sync_config').select('*').eq('user_id', uid).single(),
      supabase.from('notifications_user').select('*').eq('user_id', uid).eq('lu', false).order('created_at', { ascending: false }).limit(10),
    ])
    setProduits(p.data || [])
    setZones(z.data || [])
    if (sc.data) {
      setSyncConfig(sc.data)
      setSheetUrl(sc.data.sheet_url || '')
      setDefaultZoneId(sc.data.zone_id || '')
    } else if (z.data?.length) {
      setDefaultZoneId(z.data[0].id)
    }
    setNotifications(n.data || [])
  }

  async function sauvegarderSync() {
    if (!userId || !sheetUrl) return
    setSavingSync(true)
    const payload = {
      user_id: userId,
      sheet_url: sheetUrl,
      zone_id: defaultZoneId || null,
      actif: true,
      updated_at: new Date().toISOString(),
    }
    let error = null
    if (syncConfig) {
      const res = await supabase.from('sync_config').update(payload).eq('user_id', userId)
      error = res.error
    } else {
      const res = await supabase.from('sync_config').insert(payload)
      error = res.error
    }
    if (error) { alert('Erreur : ' + error.message); setSavingSync(false); return }
    // Recharger le syncConfig immédiatement
    const { data } = await supabase.from('sync_config').select('*').eq('user_id', userId).single()
    if (data) setSyncConfig(data)
    setSavingSync(false)
    setSyncSaved(true)
    setTimeout(() => setSyncSaved(false), 3000)
  }

  async function desactiverSync() {
    if (!userId || !syncConfig) return
    await supabase.from('sync_config').update({ actif: false }).eq('user_id', userId)
    setSyncConfig((c: any) => ({ ...c, actif: false }))
  }

  async function syncMaintenant() {
    if (!userId) return
    setSyncing(true)
    try {
      const res = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      const data = await res.json()
      if (data.imported > 0) {
        alert(`✅ ${data.imported} nouvelle${data.imported > 1 ? 's' : ''} commande${data.imported > 1 ? 's' : ''} importée${data.imported > 1 ? 's' : ''} !`)
      } else {
        alert('✅ Aucune nouvelle commande.')
      }
      charger(userId!)
    } catch (e) { alert('Erreur de synchronisation') }
    setSyncing(false)
  }

  async function marquerLu(id: string) {
    await supabase.from('notifications_user').update({ lu: true }).eq('id', id)
    setNotifications((n: any[]) => n.filter(x => x.id !== id))
  }

  function extractSheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  async function fetchSheet() {
    setLoading(true)
    let csvUrl = sheetUrl.trim()
    if (!csvUrl.includes('pub?') && !csvUrl.includes('output=csv')) {
      const sheetId = extractSheetId(csvUrl)
      if (!sheetId) { alert('URL invalide'); setLoading(false); return }
      csvUrl = `/api/sheets?id=${sheetId}&gid=0`
    }
    try {
      const res = await fetch(csvUrl)
      if (!res.ok) throw new Error('Impossible de lire le fichier.')
      const text: string = await res.text()
      const lines: string[] = text.split('\n').filter((l: string) => l.trim())
      const headers: string[] = lines[0].split(',').map((h: string) => h.replace(/"/g, '').trim().toLowerCase())
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
        const cols: string[] = line.split(',').map((c: string) => c.replace(/"/g, '').trim())
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
      }).filter((r: SheetRow) => r.full_name || r.phone)
      setRows(parsed)
      setStep('preview')
    } catch (e: any) { alert(e.message) }
    setLoading(false)
  }

  async function importerTout() {
    if (!userId) return
    setImporting(true); setTotal(rows.length); setDone(0)
    const updated = [...rows]
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row.status === 'imported') { setDone(i + 1); continue }
      try {
        let clientId: string | null = null
        if (row.phone) {
          const { data: ex } = await supabase.from('clients').select('id').eq('user_id', userId).eq('telephone', row.phone).single()
          if (ex) { clientId = ex.id } else {
            const { data: nc } = await supabase.from('clients').insert({ user_id: userId, nom: row.full_name, telephone: row.phone, adresse: row.address }).select().single()
            clientId = nc?.id || null
          }
        }
        const match = produits.find((p: any) => p.nom.toLowerCase().includes(row.product_name.toLowerCase().slice(0, 6)) || row.product_name.toLowerCase().includes(p.nom.toLowerCase().slice(0, 6)))
        const zone = zones.find((z: any) => z.id === defaultZoneId)
        const { data: commande } = await supabase.from('commandes').insert({
          user_id: userId, client_id: clientId, zone_id: defaultZoneId || null,
          statut: 'en_attente', cout_livraison: zone?.cout_livraison || 0,
          notes: `Import manuel Easy Sell — ${row.date_time}`,
        }).select().single()
        if (commande) {
          await supabase.from('commande_items').insert({
            commande_id: commande.id, produit_id: match?.id || null,
            quantite: row.product_quantity, prix_unitaire: row.product_price,
            cout_unitaire: match?.cout_achat || 0,
          })
          updated[i] = { ...row, status: 'imported' as const }
        }
      } catch (e: any) { updated[i] = { ...row, status: 'error' as const, error: e.message } }
      setRows([...updated]); setDone(i + 1)
      await new Promise(r => setTimeout(r, 150))
    }
    setImporting(false); setStep('done')
  }

  const nbImported = rows.filter((r: SheetRow) => r.status === 'imported').length
  const nbErrors = rows.filter((r: SheetRow) => r.status === 'error').length

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">Sync Google Sheet</h1>
          <p className="text-sm text-gray-400 mt-1">Easy Sell / Shopify → Dropzi automatiquement</p>
        </div>
        {notifications.length > 0 && (
          <div className="w-8 h-8 bg-[#7F77DD] rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer" onClick={() => notifications.forEach(n => marquerLu(n.id))}>
            {notifications.length}
          </div>
        )}
      </div>

      {notifications.map((n: any) => (
        <div key={n.id} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">✅ {n.titre}</p>
            <p className="text-xs text-green-600 mt-0.5">{n.message}</p>
            <p className="text-xs text-green-500 mt-1">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
          </div>
          <button onClick={() => marquerLu(n.id)} className="text-green-400 hover:text-green-600 text-sm">✕</button>
        </div>
      ))}

      <div className="flex gap-2">
        {(['auto', 'manuel'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-[#0C0C1E] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
            {t === 'auto' ? '🔄 Sync automatique' : '📥 Import manuel'}
          </button>
        ))}
      </div>

      {tab === 'auto' && (
        <div className="space-y-4">
          <div style={{ background: syncConfig?.actif ? 'linear-gradient(135deg,#1D9E75,#059669)' : 'linear-gradient(135deg,#555,#333)', borderRadius: 18, padding: 20, color: '#fff' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>Synchronisation automatique</p>
                <p style={{ fontSize: 22, fontWeight: 800 }}>{syncConfig?.actif ? '🟢 Active' : '⭕ Inactive'}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '8px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800 }}>1 min</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>fréquence</p>
              </div>
            </div>
            {syncConfig && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,.2)', paddingTop: 10, display: 'flex', gap: 20, fontSize: 12, color: 'rgba(255,255,255,.65)', flexWrap: 'wrap' }}>
                <span>📦 {syncConfig.nb_importees || 0} commandes importées au total</span>
                {syncConfig.derniere_sync && <span>🕐 {new Date(syncConfig.derniere_sync).toLocaleString('fr-FR')}</span>}
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <h2 className="font-medium text-sm">⚙️ Configuration</h2>
            <div>
              <label className="label">URL publication Google Sheet (CSV) *</label>
              <input className="input text-sm" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv" />
              <p className="text-xs text-gray-400 mt-1">Google Sheet → Fichier → Partager → Publier sur le Web → CSV → Publier</p>
            </div>
            <div>
              <label className="label">Zone de livraison par défaut</label>
              <select className="input text-sm" value={defaultZoneId} onChange={e => setDefaultZoneId(e.target.value)}>
                <option value="">Sans zone</option>
                {zones.map((z: any) => <option key={z.id} value={z.id}>{z.nom} — {fmt(z.cout_livraison)} F</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={sauvegarderSync} disabled={savingSync || !sheetUrl} className="btn-primary text-sm flex-1">
                {savingSync ? '⏳...' : syncSaved ? '✅ Sauvegardé !' : syncConfig?.actif ? '💾 Mettre à jour' : '🚀 Activer la sync'}
              </button>
              {syncConfig?.actif && (
                <button onClick={desactiverSync} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Désactiver
                </button>
              )}
            </div>
          </div>

          {syncConfig?.actif && (
            <div className="card" style={{ background: '#F8F8FC' }}>
              <p className="text-sm font-medium mb-1">⚡ Synchroniser maintenant</p>
              <p className="text-xs text-gray-400 mb-3">Force une sync immédiate sans attendre la prochaine minute.</p>
              <button onClick={syncMaintenant} disabled={syncing} className="btn-primary text-sm w-full">
                {syncing ? '⏳ Synchronisation...' : '🔄 Sync maintenant'}
              </button>
            </div>
          )}

          <div className="card" style={{ background: '#EEEDFE' }}>
            <p className="text-sm font-medium text-[#534AB7] mb-2">📋 Comment ça marche</p>
            {['Nouvelle commande Shopify → Google Sheet se met à jour', 'Dropzi vérifie le Sheet toutes les minutes', 'Nouvelles lignes détectées → commandes créées automatiquement', 'Tu reçois une notification dans l\'app', 'Zéro action manuelle nécessaire'].map((s, i) => (
              <div key={i} className="flex gap-2 text-xs text-[#534AB7] mb-1">
                <span className="font-bold">{i + 1}.</span><span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'manuel' && step === 'url' && (
        <div className="card space-y-4">
          <div>
            <label className="label">URL publication Google Sheet (CSV) *</label>
            <input className="input" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv" />
          </div>
          {zones.length > 0 && (
            <div>
              <label className="label">Zone par défaut</label>
              <select className="input" value={defaultZoneId} onChange={e => setDefaultZoneId(e.target.value)}>
                <option value="">Sans zone</option>
                {zones.map((z: any) => <option key={z.id} value={z.id}>{z.nom} — {fmt(z.cout_livraison)} F</option>)}
              </select>
            </div>
          )}
          <button onClick={fetchSheet} disabled={loading || !sheetUrl} className="btn-primary w-full">
            {loading ? '⏳ Lecture...' : '📥 Lire le Google Sheet'}
          </button>
        </div>
      )}

      {tab === 'manuel' && step === 'preview' && (
        <div className="space-y-4">
          <div style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', borderRadius: 18, padding: 20, color: '#fff' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>Commandes trouvées</p>
            <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>{rows.length}</p>
          </div>
          {importing && (
            <div className="card">
              <div className="flex justify-between mb-2"><span className="text-sm font-medium">Import en cours...</span><span className="text-sm text-gray-500">{done}/{total}</span></div>
              <div style={{ background: '#f0f0f0', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${total > 0 ? (done / total) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg,#7F77DD,#534AB7)', borderRadius: 8, transition: 'width .3s ease' }} />
              </div>
            </div>
          )}
          <div className="space-y-2" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
            {rows.map((row: SheetRow, i: number) => (
              <div key={i} className="card" style={{ borderColor: row.status === 'imported' ? '#BBF7D0' : row.status === 'error' ? '#FECACA' : '#e8e8f0', background: row.status === 'imported' ? '#F0FDF4' : row.status === 'error' ? '#FEF2F2' : '#fff' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {(row.full_name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{row.full_name} {row.status === 'imported' && <span className="text-green-600 text-xs">✓</span>}</p>
                    <p className="text-xs text-gray-400 truncate">📞 {row.phone} · 📦 {row.product_name} × {row.product_quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-[#7F77DD] flex-shrink-0">{fmt(row.product_price * row.product_quantity)} F</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setStep('url'); setRows([]) }} className="btn-secondary text-sm flex-1">← Retour</button>
            <button onClick={importerTout} disabled={importing} className="btn-primary text-sm flex-1">
              {importing ? `⏳ ${done}/${total}...` : `⚡ Importer ${rows.length} commandes`}
            </button>
          </div>
        </div>
      )}

      {tab === 'manuel' && step === 'done' && (
        <div className="card text-center py-10 space-y-4">
          <div style={{ fontSize: 56 }}>{nbErrors === 0 ? '🎉' : '⚠️'}</div>
          <p className="text-xl font-bold">{nbImported} commandes importées</p>
          {nbErrors > 0 && <p className="text-sm text-red-500">{nbErrors} erreurs</p>}
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setStep('url'); setRows([]) }} className="btn-secondary text-sm">Nouvel import</button>
            <a href="/dashboard/commandes" className="btn-primary text-sm">Voir les commandes →</a>
          </div>
        </div>
      )}
    </div>
  )
}
