'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
const PLAN_PRIX: Record<string, number> = { starter: 3000, business: 5000, elite: 15000 }

export default function AdminSubscriptionsPage() {
  const supabase = createClient()
  const [abos, setAbos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ mrr: 0, actifs: 0, expires7j: 0, totalRevenu: 0 })
  const [filtre, setFiltre] = useState('tous')
  const [notifAll, setNotifAll] = useState(false)
  const [notifTitre, setNotifTitre] = useState('')
  const [notifMsg, setNotifMsg] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('abonnements')
      .select('*, profiles(email, nom_boutique, plan, plan_expires, created_at)')
      .order('updated_at', { ascending: false })
    const now = new Date()
    const in7j = new Date(now); in7j.setDate(now.getDate() + 7)
    const all = data || []
    const actifs = all.filter((a: any) => a.statut === 'actif' && a.fin && new Date(a.fin) > now)
    const mrr = actifs.reduce((s: number, a: any) => s + (PLAN_PRIX[a.plan] || 0), 0)
    const expires7j = actifs.filter((a: any) => new Date(a.fin) <= in7j).length
    const totalRevenu = all.reduce((s: number, a: any) => s + (a.montant || 0), 0)
    setStats({ mrr, actifs: actifs.length, expires7j, totalRevenu })
    setAbos(all)
    setLoading(false)
  }

  async function envoyerTous() {
    if (!notifTitre || !notifMsg) return
    setSending(true)
    const actifs = abos.filter(a => a.statut === 'actif')
    for (const a of actifs) {
      await supabase.from('notifications_user').insert({ user_id: a.user_id, titre: notifTitre, message: notifMsg, type: 'info' })
    }
    setSending(false); setNotifAll(false); setNotifTitre(''); setNotifMsg('')
    alert(`✅ Notification envoyée à ${actifs.length} abonnés`)
  }

  async function prolonger(aboId: string, userId: string, days: number) {
    const abo = abos.find(a => a.id === aboId)
    const base = abo?.fin && new Date(abo.fin) > new Date() ? new Date(abo.fin) : new Date()
    const newFin = new Date(base); newFin.setDate(newFin.getDate() + days)
    await supabase.from('abonnements').update({ fin: newFin.toISOString(), statut: 'actif', updated_at: new Date().toISOString() }).eq('id', aboId)
    await supabase.from('profiles').update({ plan_expires: newFin.toISOString() }).eq('id', userId)
    load()
  }

  const now = new Date()
  const filtered = abos.filter(a => filtre === 'tous' || a.statut === filtre || a.plan === filtre)

  const S: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }
  const PLAN_COLOR: Record<string, string> = { starter: '#F59E0B', business: '#7F77DD', elite: '#1D9E75', aucun: '#6B7280' }

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Abonnements & Revenus</h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: 4 }}>{abos.length} abonnements au total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setNotifAll(true)} style={{ background: 'rgba(127,119,221,.15)', border: '1px solid rgba(127,119,221,.3)', color: '#7F77DD', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔔 Notifier tous les abonnés
          </button>
          <button onClick={load} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔄
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { lbl: '💰 MRR', val: fmt(stats.mrr) + ' F', sub: 'Revenus mensuels récurrents', color: '#1D9E75' },
          { lbl: '✅ Abonnés actifs', val: String(stats.actifs), sub: 'Plans en cours', color: '#7F77DD' },
          { lbl: '⚠️ Expirent bientôt', val: String(stats.expires7j), sub: 'Dans 7 jours', color: '#F59E0B' },
          { lbl: '📦 Revenu total', val: fmt(stats.totalRevenu) + ' F', sub: 'Depuis le début', color: '#378ADD' },
        ].map(k => (
          <div key={k.lbl} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '16px' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 700, marginBottom: 8 }}>{k.lbl}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>{k.val}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* MODAL NOTIFICATION */}
      {notifAll && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0C0C1E', border: '1px solid rgba(127,119,221,.3)', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🔔 Notifier tous les abonnés actifs</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Titre</label>
              <input style={S} value={notifTitre} onChange={e => setNotifTitre(e.target.value)} placeholder="Ex: Nouvelle fonctionnalité disponible !" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Message</label>
              <textarea style={{ ...S, height: 80, resize: 'none' }} value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="Détails de la notification..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setNotifAll(false)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', background: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
              <button onClick={envoyerTous} disabled={sending || !notifTitre || !notifMsg}
                style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !notifTitre || !notifMsg ? .5 : 1 }}>
                {sending ? '⏳ Envoi...' : `📤 Envoyer à ${abos.filter(a => a.statut === 'actif').length} abonnés`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['tous','actif','expire','starter','business','elite'].map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${filtre === f ? '#7F77DD' : 'rgba(255,255,255,.1)'}`, background: filtre === f ? 'rgba(127,119,221,.2)' : 'transparent', color: filtre === f ? '#AFA9EC' : 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {f === 'tous' ? 'Tous' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((a: any) => {
            const actif = a.statut === 'actif' && a.fin && new Date(a.fin) > now
            const expire = a.fin ? new Date(a.fin) : null
            const expiresIn = expire ? Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
            return (
              <div key={a.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${actif ? 'rgba(29,158,117,.2)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{a.profiles?.email || 'N/A'}</span>
                    {a.profiles?.nom_boutique && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>· {a.profiles.nom_boutique}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: (PLAN_COLOR[a.plan] || '#888') + '22', color: PLAN_COLOR[a.plan] || '#888', border: `1px solid ${(PLAN_COLOR[a.plan] || '#888')}44` }}>{a.plan?.toUpperCase()}</span>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: actif ? 'rgba(29,158,117,.15)' : 'rgba(226,75,74,.15)', color: actif ? '#9FE1CB' : '#F09595' }}>{actif ? '✓ Actif' : '✗ Expiré'}</span>
                    {expiresIn !== null && <span style={{ fontSize: 11, color: expiresIn <= 7 && actif ? '#F59E0B' : 'rgba(255,255,255,.3)' }}>{expiresIn > 0 ? `${expiresIn}j restants` : 'Expiré'}</span>}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>{a.debut ? new Date(a.debut).toLocaleDateString('fr-FR') : 'N/A'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#9FE1CB' }}>{fmt(a.montant || 0)} F</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{a.fin ? new Date(a.fin).toLocaleDateString('fr-FR') : 'N/A'}</p>
                  </div>
                  <button onClick={() => prolonger(a.id, a.user_id, 30)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(127,119,221,.3)', background: 'rgba(127,119,221,.1)', color: '#AFA9EC', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    +30j
                  </button>
                  <button onClick={() => prolonger(a.id, a.user_id, 365)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(29,158,117,.3)', background: 'rgba(29,158,117,.1)', color: '#9FE1CB', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    +1 an
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
