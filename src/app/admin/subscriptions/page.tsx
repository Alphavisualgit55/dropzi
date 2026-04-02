'use client'
import { useEffect, useState } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
const PLAN_PRIX: Record<string, number> = { starter: 3000, business: 5000, elite: 15000 }
const PLAN_COLOR: Record<string, string> = { starter: '#F59E0B', business: '#7F77DD', elite: '#1D9E75' }

export const dynamic = 'force-dynamic'

export default function AdminSubscriptionsPage() {
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
    try {
      const res = await fetch('/api/admin/subscriptions?t=' + Date.now(), { cache: 'no-store' })
      const data = await res.json()
      if (!data.ok) { console.error('Erreur:', data.error); setLoading(false); return }

      const all = data.abonnements || []
      const now = new Date()
      const in7j = new Date(now); in7j.setDate(now.getDate() + 7)
      const actifs = all.filter((a: any) => a.statut === 'actif' && a.fin && new Date(a.fin) > now)
      setStats({
        mrr: actifs.reduce((s: number, a: any) => s + (PLAN_PRIX[a.plan] || 0), 0),
        actifs: actifs.length,
        expires7j: actifs.filter((a: any) => new Date(a.fin) <= in7j).length,
        totalRevenu: all.reduce((s: number, a: any) => s + (a.montant || 0), 0),
      })
      setAbos(all)
    } catch(e) { console.error('Erreur réseau:', e) }
    setLoading(false)
  }

  async function prolonger(userId: string, aboId: string, days: number) {
    const abo = abos.find(a => a.id === aboId)
    const base = abo?.fin && new Date(abo.fin) > new Date() ? new Date(abo.fin) : new Date()
    base.setDate(base.getDate() + days)
    const finStr = base.toISOString()

    const res = await fetch('/api/admin/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_plan', user_id: userId, plan: abo?.plan, expires_days: days })
    })
    const data = await res.json()
    if (data.ok) {
      setAbos(prev => prev.map(a => a.id === aboId ? { ...a, statut: 'actif', fin: finStr } : a))
    } else {
      alert('Erreur: ' + data.error)
    }
  }

  async function envoyerTous() {
    if (!notifTitre || !notifMsg) return
    setSending(true)
    const actifs = abos.filter(a => a.statut === 'actif')
    for (const a of actifs) {
      await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'notify', user_id: a.user_id, titre: notifTitre, message: notifMsg, type: 'info' })
      })
    }
    setSending(false); setNotifAll(false); setNotifTitre(''); setNotifMsg('')
    alert(`✅ Notification envoyée à ${actifs.length} abonnés`)
  }

  const now = new Date()
  const filtered = abos.filter(a => filtre === 'tous' || a.statut === filtre || a.plan === filtre)

  const S: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Abonnements & Revenus</h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: 4 }}>{abos.length} abonnements</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setNotifAll(true)}
            style={{ background: 'rgba(127,119,221,.15)', border: '1px solid rgba(127,119,221,.3)', color: '#AFA9EC', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔔 Notifier tous
          </button>
          <button onClick={load}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', borderRadius: 10, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔄
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { lbl: '💰 MRR', val: fmt(stats.mrr) + ' F', sub: 'Revenus mensuels', color: '#1D9E75' },
          { lbl: '✅ Abonnés actifs', val: String(stats.actifs), sub: 'Plans en cours', color: '#7F77DD' },
          { lbl: '⚠️ Expirent bientôt', val: String(stats.expires7j), sub: 'Dans 7 jours', color: '#F59E0B' },
          { lbl: '📦 Revenu total', val: fmt(stats.totalRevenu) + ' F', sub: 'Depuis le début', color: '#378ADD' },
        ].map(k => (
          <div key={k.lbl} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '16px' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 700, marginBottom: 8 }}>{k.lbl}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>{k.val}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Modal notification */}
      {notifAll && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0C0C1E', border: '1px solid rgba(127,119,221,.3)', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🔔 Notifier tous les abonnés actifs</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Titre</label>
              <input style={S} value={notifTitre} onChange={e => setNotifTitre(e.target.value)} placeholder="Ex: Nouvelle fonctionnalité !" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Message</label>
              <textarea style={{ ...S, height: 80, resize: 'none' }} value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="Détails..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setNotifAll(false)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', background: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
              <button onClick={envoyerTous} disabled={sending || !notifTitre || !notifMsg}
                style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !notifTitre || !notifMsg ? .5 : 1 }}>
                {sending ? '⏳...' : `📤 Envoyer à ${abos.filter(a => a.statut === 'actif').length} abonnés`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['tous','actif','expire','starter','business','elite'].map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${filtre === f ? '#7F77DD' : 'rgba(255,255,255,.1)'}`, background: filtre === f ? 'rgba(127,119,221,.2)' : 'transparent', color: filtre === f ? '#AFA9EC' : 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,.3)' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>💳</p>
          <p>Aucun abonnement trouvé</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((a: any) => {
            const actif = a.statut === 'actif' && a.fin && new Date(a.fin) > now
            const expire = a.fin ? new Date(a.fin) : null
            const joursRestants = expire ? Math.ceil((expire.getTime() - now.getTime()) / 86400000) : null
            const planColor = PLAN_COLOR[a.plan] || '#888'

            return (
              <div key={a.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${actif ? 'rgba(29,158,117,.2)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{a.profiles?.email || 'N/A'}</span>
                    {a.profiles?.nom_boutique && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>· {a.profiles.nom_boutique}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: planColor + '22', color: planColor, border: `1px solid ${planColor}44` }}>
                      {(a.plan || 'aucun').toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: actif ? 'rgba(29,158,117,.15)' : 'rgba(226,75,74,.15)', color: actif ? '#9FE1CB' : '#F09595' }}>
                      {actif ? '✓ Actif' : '✗ Expiré'}
                    </span>
                    {joursRestants !== null && actif && (
                      <span style={{ fontSize: 11, color: joursRestants <= 7 ? '#F59E0B' : 'rgba(255,255,255,.3)' }}>
                        {joursRestants <= 0 ? 'Expiré' : `${joursRestants}j restants`}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>
                      {a.debut ? new Date(a.debut).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right', marginRight: 4 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#9FE1CB' }}>{fmt(a.montant || 0)} F</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{expire ? expire.toLocaleDateString('fr-FR') : 'N/A'}</p>
                  </div>
                  <button onClick={() => prolonger(a.user_id, a.id, 30)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(127,119,221,.3)', background: 'rgba(127,119,221,.1)', color: '#AFA9EC', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    +30j
                  </button>
                  <button onClick={() => prolonger(a.user_id, a.id, 365)}
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
