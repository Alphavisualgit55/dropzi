'use client'
import { useEffect, useState } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
const PLAN_PRIX: Record<string, number> = { starter: 3000, business: 5000, elite: 15000 }

const PLAN_CFG: Record<string, { color: string; bg: string; glow: string }> = {
  starter:  { color: '#FCD34D', bg: 'rgba(245,158,11,.12)', glow: 'rgba(245,158,11,.2)' },
  business: { color: '#AFA9EC', bg: 'rgba(127,119,221,.12)', glow: 'rgba(127,119,221,.2)' },
  elite:    { color: '#9FE1CB', bg: 'rgba(29,158,117,.12)', glow: 'rgba(29,158,117,.2)' },
}

export default function AdminSubscriptionsPage() {
  const [abos, setAbos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ mrr: 0, actifs: 0, expires7j: 0, totalRevenu: 0 })
  const [filtre, setFiltre] = useState<'tous' | 'starter' | 'business' | 'elite'>('tous')
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscriptions?t=' + Date.now(), { cache: 'no-store' })
      const data = await res.json()
      if (!data.ok) { setLoading(false); return }
      const now = new Date()
      const in7j = new Date(now); in7j.setDate(now.getDate() + 7)
      const all = data.abonnements || []
      const actifs = all.filter((a: any) => a.statut === 'actif' && a.fin && new Date(a.fin) > now)
      setStats({
        mrr: actifs.reduce((s: number, a: any) => s + (PLAN_PRIX[a.plan] || 0), 0),
        actifs: actifs.length,
        expires7j: actifs.filter((a: any) => new Date(a.fin) <= in7j).length,
        totalRevenu: all.reduce((s: number, a: any) => s + (a.montant || 0), 0),
      })
      setAbos(actifs)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function prolonger(userId: string, aboId: string, plan: string, days: number) {
    setSaving(aboId)
    const res = await fetch('/api/admin/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_plan', user_id: userId, plan, expires_days: days })
    })
    const data = await res.json()
    setSaving(null)
    if (data.ok) {
      setAbos(prev => prev.map(a => a.id === aboId ? { ...a, fin: data.fin } : a))
    } else alert('Erreur: ' + data.error)
  }

  const now = new Date()
  const filtered = abos
    .filter(a => filtre === 'tous' || a.plan === filtre)
    .sort((a, b) => new Date(b.debut || 0).getTime() - new Date(a.debut || 0).getTime())

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.sbt{transition:all .15s;cursor:pointer;font-family:inherit;}.card{transition:border-color .2s;}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#fff' }}>Abonnés actifs</h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: 4 }}>
            {stats.actifs} abonnement{stats.actifs > 1 ? 's' : ''} en cours
          </p>
        </div>
        <button onClick={load} className="sbt"
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
          🔄 Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { icon: '💰', label: 'Revenus / mois', value: fmt(stats.mrr) + ' F', color: '#9FE1CB', bg: 'rgba(29,158,117,.08)', border: 'rgba(29,158,117,.2)' },
          { icon: '✅', label: 'Abonnés actifs', value: String(stats.actifs), color: '#AFA9EC', bg: 'rgba(127,119,221,.08)', border: 'rgba(127,119,221,.2)' },
          { icon: '⚠️', label: 'Expirent dans 7j', value: String(stats.expires7j), color: '#FCD34D', bg: 'rgba(245,158,11,.08)', border: stats.expires7j > 0 ? 'rgba(245,158,11,.4)' : 'rgba(255,255,255,.07)' },
          { icon: '📦', label: 'Total encaissé', value: fmt(stats.totalRevenu) + ' F', color: '#93C5FD', bg: 'rgba(55,138,221,.08)', border: 'rgba(55,138,221,.2)' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 16, padding: '16px' }}>
            <p style={{ fontSize: 11, color: k.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8, opacity: .8 }}>{k.icon} {k.label}</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: k.color, letterSpacing: -1, lineHeight: 1 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['tous', 'starter', 'business', 'elite'] as const).map(f => {
          const count = f === 'tous' ? abos.length : abos.filter(a => a.plan === f).length
          const cfg = f !== 'tous' ? PLAN_CFG[f] : null
          return (
            <button key={f} className="sbt" onClick={() => setFiltre(f)}
              style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${filtre === f ? (cfg?.color || '#7F77DD') : 'rgba(255,255,255,.1)'}`, background: filtre === f ? (cfg?.bg || 'rgba(127,119,221,.15)') : 'transparent', color: filtre === f ? (cfg?.color || '#AFA9EC') : 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
              {f === 'tous' ? 'Tous' : f} <span style={{ opacity: .6 }}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,.25)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aucun abonné actif</p>
          <p style={{ fontSize: 13 }}>Les abonnements apparaîtront ici après le premier paiement</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((a: any) => {
            const cfg = PLAN_CFG[a.plan] || { color: '#888', bg: 'rgba(255,255,255,.05)', glow: 'transparent' }
            const expire = a.fin ? new Date(a.fin) : null
            const joursRestants = expire ? Math.ceil((expire.getTime() - now.getTime()) / 86400000) : null
            const urgence = joursRestants !== null && joursRestants <= 7
            const isSaving = saving === a.id

            return (
              <div key={a.id} className="card"
                style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${urgence ? 'rgba(245,158,11,.35)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: cfg.bg, border: `1px solid ${cfg.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
                  {(a.profiles?.email || 'U').slice(0, 2).toUpperCase()}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{a.profiles?.email || 'N/A'}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, letterSpacing: '.05em' }}>
                      {(a.plan || '').toUpperCase()}
                    </span>
                    {urgence && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: 'rgba(245,158,11,.15)', color: '#FCD34D' }}>
                        ⚠️ {joursRestants}j restants
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {a.profiles?.nom_boutique && (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>🏪 {a.profiles.nom_boutique}</span>
                    )}
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
                      Depuis {a.debut ? new Date(a.debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                    <span style={{ fontSize: 12, color: urgence ? '#FCD34D' : 'rgba(255,255,255,.3)' }}>
                      Expire {expire ? expire.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Montant + boutons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: cfg.color }}>{fmt(a.montant || 0)} F</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>payé</p>
                  </div>
                  <button className="sbt" onClick={() => prolonger(a.user_id, a.id, a.plan, 30)} disabled={!!isSaving}
                    style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(127,119,221,.3)', background: 'rgba(127,119,221,.1)', color: '#AFA9EC', fontSize: 12, fontWeight: 700, opacity: isSaving ? .5 : 1 }}>
                    {isSaving ? '⏳' : '+30j'}
                  </button>
                  <button className="sbt" onClick={() => prolonger(a.user_id, a.id, a.plan, 365)} disabled={!!isSaving}
                    style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(29,158,117,.3)', background: 'rgba(29,158,117,.1)', color: '#9FE1CB', fontSize: 12, fontWeight: 700, opacity: isSaving ? .5 : 1 }}>
                    {isSaving ? '⏳' : '+1 an'}
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
