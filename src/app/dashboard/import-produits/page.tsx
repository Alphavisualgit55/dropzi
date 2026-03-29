'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

interface ProduitImport {
  nom: string
  prix_vente: number
  cout_achat: number
  image_url: string
  sku: string
  stock: number
  status: 'pending' | 'imported' | 'exists' | 'error'
}

export default function ImportProduitsPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [produits, setProduits] = useState<ProduitImport[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(0)
  const [csvUrl, setCsvUrl] = useState('')
  const [methode, setMethode] = useState<'csv' | 'fichier'>('csv')
  const [existants, setExistants] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('produits').select('nom').eq('user_id', user.id).eq('actif', true)
        .then(({ data }) => setExistants((data || []).map((p: any) => p.nom.toLowerCase())))
    })
  }, [])

  function parseShopifyCSV(text: string): ProduitImport[] {
    // Parser CSV robuste qui gère les guillemets et virgules dans les valeurs
    function parseCSVLine(line: string): string[] {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          if (inQuotes && line[i+1] === '"') { current += '"'; i++ }
          else inQuotes = !inQuotes
        } else if (line[i] === ',' && !inQuotes) {
          result.push(current.trim()); current = ''
        } else {
          current += line[i]
        }
      }
      result.push(current.trim())
      return result
    }

    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())

    // Colonnes Shopify exactes
    const idx = {
      nom:   headers.findIndex(h => h === 'title' || h === 'nom' || h === 'product name' || h === 'name'),
      prix:  headers.findIndex(h => h === 'variant price' || h === 'price' || h === 'prix'),
      cout:  headers.findIndex(h => h === 'cost per item' || h === 'cost' || h === 'cout' || h === 'cost per unit'),
      image: headers.findIndex(h => h === 'image src' || h === 'image' || h === 'img src' || h === 'image url'),
      sku:   headers.findIndex(h => h === 'variant sku' || h === 'sku'),
      stock: headers.findIndex(h => h.includes('inventory qty') || h.includes('stock')),
      status:headers.findIndex(h => h === 'status'),
    }

    const seen = new Set<string>()
    const result: ProduitImport[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i])
      const nom = idx.nom >= 0 ? (cols[idx.nom] || '').trim() : ''
      // Ignorer lignes vides (variantes Shopify) et doublons
      if (!nom || seen.has(nom.toLowerCase())) continue
      // Ignorer produits inactifs si colonne Status présente
      if (idx.status >= 0 && cols[idx.status] && cols[idx.status].toLowerCase() !== 'active') continue
      seen.add(nom.toLowerCase())

      const prix = idx.prix >= 0 ? parseFloat(cols[idx.prix]) || 0 : 0
      const cout = idx.cout >= 0 ? parseFloat(cols[idx.cout]) || 0 : 0
      const image = idx.image >= 0 ? (cols[idx.image] || '').trim() : ''
      const sku = idx.sku >= 0 ? (cols[idx.sku] || '').trim() : ''
      const stock = idx.stock >= 0 ? parseInt(cols[idx.stock]) || 0 : 0

      // Ignorer si le nom contient du HTML ou est trop court
      const nomClean = nom.replace(/<[^>]*>/g, '').trim()
      if (!nomClean || nomClean.length < 3) continue
      if (nomClean.includes('<') || nomClean.includes('>') || nomClean.includes('</')) continue
      // Ignorer si prix ET cout sont à 0 (probablement une ligne parasite)
      if (prix === 0 && cout === 0 && !sku) continue

      result.push({
        nom: nomClean,
        prix_vente: prix,
        cout_achat: cout,
        image_url: image,
        sku,
        stock,
        status: existants.includes(nomClean.toLowerCase()) ? 'exists' : 'pending'
      })
    }
    return result
  }

  async function lireCSVUrl() {
    if (!csvUrl) return
    setLoading(true)
    try {
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(csvUrl)}`)
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Impossible de lire le fichier')
      const parsed = parseShopifyCSV(json.csv)
      if (parsed.length === 0) throw new Error('Aucun produit trouvé dans le fichier')
      setProduits(parsed)
      setStep('preview')
    } catch (e: any) { alert(e.message) }
    setLoading(false)
  }

  async function lireFichier(file: File) {
    setLoading(true)
    try {
      const text = await file.text()
      const parsed = parseShopifyCSV(text)
      if (parsed.length === 0) throw new Error('Aucun produit trouvé dans le fichier')
      setProduits(parsed)
      setStep('preview')
    } catch (e: any) { alert(e.message) }
    setLoading(false)
  }

  async function importerTout() {
    if (!userId) return
    setImporting(true)
    const updated = [...produits]

    for (let i = 0; i < produits.length; i++) {
      const p = produits[i]
      if (p.status === 'exists' || p.status === 'imported') { setDone(i + 1); continue }
      try {
        const { error } = await supabase.from('produits').insert({
          user_id: userId,
          nom: p.nom,
          prix_vente: p.prix_vente,
          cout_achat: p.cout_achat,
          image_url: p.image_url || null,
          stock_total: p.stock || 0,
          actif: true,
        })
        updated[i] = { ...p, status: error ? 'error' : 'imported' }
      } catch {
        updated[i] = { ...p, status: 'error' }
      }
      setProduits([...updated])
      setDone(i + 1)
      await new Promise(r => setTimeout(r, 80))
    }

    setImporting(false)
    setStep('done')
  }

  const nbNew = produits.filter(p => p.status === 'pending').length
  const nbExists = produits.filter(p => p.status === 'exists').length
  const nbImported = produits.filter(p => p.status === 'imported').length

  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }
  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #EBEBEB', borderRadius: 12, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#FAFAFA', color: '#111', boxSizing: 'border-box' }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.5, margin: 0 }}>Import produits Shopify</h1>
        <p style={{ fontSize: 13, color: '#C0C0C0', margin: '5px 0 0' }}>Importe tous tes produits Shopify en 1 clic</p>
      </div>

      {/* ÉTAPE 1 — UPLOAD */}
      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Guide Shopify */}
          <div style={{ background: '#EEEDFE', border: '1px solid #CECBF6', borderRadius: 18, padding: '18px 20px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#534AB7', marginBottom: 12 }}>📋 Comment exporter depuis Shopify</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Shopify Admin → Produits → Tous les produits',
                'Clique "Exporter" en haut à droite',
                'Choisis "Tous les produits" → "Fichier CSV pour Excel"',
                'Télécharge le fichier et uploade-le ci-dessous',
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#7F77DD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: '#3C3489', lineHeight: 1.4 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Méthode */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[['fichier', '📁 Uploader un fichier CSV'], ['csv', '🔗 Coller une URL']].map(([m, l]) => (
              <button key={m} onClick={() => setMethode(m as any)} style={{ flex: 1, padding: '10px', borderRadius: 12, border: `2px solid ${methode === m ? '#7F77DD' : '#EBEBEB'}`, background: methode === m ? '#EEEDFE' : '#fff', color: methode === m ? '#534AB7' : '#888', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {l}
              </button>
            ))}
          </div>

          {methode === 'fichier' && (
            <div>
              <label style={lbl}>Fichier CSV Shopify</label>
              <div style={{ border: '2px dashed #CECBF6', borderRadius: 16, padding: '32px 20px', textAlign: 'center', background: '#FAFAFE', cursor: 'pointer', position: 'relative' }}>
                <input type="file" accept=".csv" onChange={e => { if (e.target.files?.[0]) lireFichier(e.target.files[0]) }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                <div style={{ fontSize: 40, marginBottom: 10 }}>📁</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#7F77DD', marginBottom: 4 }}>Clique ou glisse ton fichier CSV</p>
                <p style={{ fontSize: 12, color: '#C0C0C0' }}>Format : products_export.csv de Shopify</p>
              </div>
            </div>
          )}

          {methode === 'csv' && (
            <div>
              <label style={lbl}>URL du fichier CSV</label>
              <input style={inp} value={csvUrl} onChange={e => setCsvUrl(e.target.value)} placeholder="https://..." />
              <button onClick={lireCSVUrl} disabled={loading || !csvUrl} style={{ marginTop: 10, width: '100%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading || !csvUrl ? 0.5 : 1 }}>
                {loading ? '⏳ Lecture...' : '📥 Lire le fichier'}
              </button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#7F77DD', fontWeight: 600, fontSize: 14 }}>
              ⏳ Lecture du fichier en cours...
            </div>
          )}
        </div>
      )}

      {/* ÉTAPE 2 — APERÇU */}
      {step === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stats */}
          <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', borderRadius: 20, padding: '20px 22px', color: '#fff' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Produits trouvés</p>
            <p style={{ fontSize: 42, fontWeight: 800, letterSpacing: -2, lineHeight: 1, marginBottom: 12 }}>{produits.length}</p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span style={{ color: '#9FE1CB' }}>✓ {nbNew} nouveaux</span>
              {nbExists > 0 && <span style={{ color: '#FAC775' }}>⚠ {nbExists} déjà existants</span>}
            </div>
          </div>

          {/* Barre progression */}
          {importing && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #EBEBEB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E' }}>Import en cours...</span>
                <span style={{ fontSize: 13, color: '#7F77DD', fontWeight: 700 }}>{done}/{produits.length}</span>
              </div>
              <div style={{ background: '#F0F0F8', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${produits.length > 0 ? (done / produits.length) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg,#7F77DD,#1D9E75)', borderRadius: 8, transition: 'width .3s' }} />
              </div>
            </div>
          )}

          {/* Liste produits */}
          <div style={{ maxHeight: '45vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {produits.map((p, i) => (
              <div key={i} style={{ background: p.status === 'imported' ? '#F0FDF4' : p.status === 'exists' ? '#FFFBEB' : '#fff', border: `1px solid ${p.status === 'imported' ? '#BBF7D0' : p.status === 'exists' ? '#FDE68A' : '#EBEBEB'}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Image */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0F0F8', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" onError={e => { (e.target as any).style.display = 'none' }} /> : '🛍️'}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</p>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#ABABAB' }}>
                    <span>Prix : {fmt(p.prix_vente)} F</span>
                    {p.cout_achat > 0 && <span>Coût : {fmt(p.cout_achat)} F</span>}
                  </div>
                </div>
                {/* Status */}
                <div style={{ flexShrink: 0 }}>
                  {p.status === 'imported' && <span style={{ fontSize: 11, fontWeight: 700, color: '#085041', background: '#E1F5EE', padding: '3px 10px', borderRadius: 20 }}>✓ Importé</span>}
                  {p.status === 'exists' && <span style={{ fontSize: 11, fontWeight: 700, color: '#633806', background: '#FAEEDA', padding: '3px 10px', borderRadius: 20 }}>Existe déjà</span>}
                  {p.status === 'error' && <span style={{ fontSize: 11, fontWeight: 700, color: '#501313', background: '#FCEBEB', padding: '3px 10px', borderRadius: 20 }}>Erreur</span>}
                  {p.status === 'pending' && <span style={{ fontSize: 12, color: '#ABABAB' }}>{fmt(p.prix_vente)} F</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setStep('upload'); setProduits([]) }} style={{ padding: '12px 20px', borderRadius: 14, border: '1.5px solid #EBEBEB', background: '#fff', color: '#666', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Retour</button>
            <button onClick={importerTout} disabled={importing || nbNew === 0} style={{ flex: 1, background: importing ? '#ccc' : 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: nbNew === 0 ? 0.5 : 1 }}>
              {importing ? `⏳ Import ${done}/${produits.length}...` : `⚡ Importer ${nbNew} produits`}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — DONE */}
      {step === 'done' && (
        <div style={{ background: '#fff', borderRadius: 24, padding: '48px 24px', textAlign: 'center', border: '1px solid #EBEBEB' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.5, marginBottom: 8 }}>{nbImported} produits importés !</p>
          <p style={{ fontSize: 14, color: '#ABABAB', marginBottom: 32 }}>Tes produits Shopify sont maintenant dans Dropzi. Tu peux les retrouver dans la page Produits.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setStep('upload'); setProduits([]) }} style={{ padding: '12px 24px', borderRadius: 14, border: '1.5px solid #EBEBEB', background: '#fff', color: '#666', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Importer d'autres
            </button>
            <a href="/dashboard/produits" style={{ padding: '12px 24px', borderRadius: 14, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Voir mes produits →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
