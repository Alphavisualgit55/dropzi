'use client'
import { useEffect, useState } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
const PLAN_PRIX: Record<string, number> = { starter: 3000, business: 5000, elite: 15000 }
const PLAN_COLOR: Record<string, { color: string; bg: string }> = {
  starter:  { color: '#D97706', bg: '#FEF3C7' },
  business: { color: '#3730A3', bg: '#EEF2FF' },
  elite:    { color: '#065F46', bg: '#ECFDF5' },
}

export default function AdminSubscriptionsPage() {
  const [abos, setAbos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ mrr: 0, actifs: 0, expires7j: 0, totalRevenu: 0 })
  const [filtre, setFiltre] = useState<'tous'|'starter'|'business'|'elite'>('tous')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscriptions?t=' + Date.now(), { cache: 'no-store' })
      const data = await res.json()
      if (!data.ok) { setLoading(false); return }

      const now = new Date()
      const in7j = new Date(now); in7j.setDate(now.getDate() + 7)

      // Seulement les abonnés actifs
      const actifs = (data.abonnements || []).filter((a: any) =>
        a.statut === 'actif' && a.fin && new Date(a.fin) > now
      )

      setStats({
        mrr: actifs.reduce((s: number, a: any) => s + (PLAN_PRIX[a.plan] || 0), 0),
        actifs: actifs.length,
        expires7j: actifs.filter((a: any) => new Date(a.fin) <= in7j).length,
        totalRevenu: (data.abonnements || []).reduce((s: number, a: any) => s + (a.montant || 0), 0),
      })
      setAbos(actifs)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function prolonger(userId: string, aboId: string, plan: string, days: number) {
    const res = await fetch('/api/admin/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_plan', user_id: userId, plan, expires_days: days })
    })
    const data = await res.json()
    if (data.ok) {
      setAbos(prev => prev.map(a => a.id === aboId
        ? { ...a, fin: data.fin }
        : a
      ))
    } else alert('Erreur: ' + data.error)
  }

  const now = new Date()
  const filtered = abos.filter(a => filtre === 'tous' || a.plan === filtre)
    .sort((a, b) => new Date(b.debut || 0).getTime() - new Date(a.debut || 0).getTime())

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Abonnés actifs</h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: 4 }}>
            Uniquement les abonnements en cours
          </p>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          🔄 Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
        <div style={{ background: 'rgba(29,158,117,.08)', border: '1px solid rgba(29,158,117,.2)', borderRadius: 16, padding: '18px' }}>
          <p style={{ fontSize: 11, color: '#9FE1CB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>💰 Revenus/mois</p>
          <p style={{ fontSize: 30, fontWeight: 900, color: '#9FE1CB', letterSpacing: -1, lineHeight: 1 }}>{fmt(stats.mrr)} F</p>
        </div>
        <div style={{ background: 'rgba(127,119,221,.08)', border: '1px solid rgba(127,119,221,.2)', borderRadius: 16, padding: '18px' }}>
          <p style={{ fontSize: 11, color: '#AFA9EC', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>✅ Abonnés actifs</p>
          <p style={{ fontSize: 30, fontWeight: 900, color: '#AFA9EC', letterSpacing: -1, lineHeight: 1 }}>{stats.actifs}</p>
        </div>
        <div style={{ background: stats.expires7j > 0 ? 'rgba(245,158,11,.08)' : 'rgba(255,255,255,.03)', border: `1px solid ${stats.expires7j > 0 ? 'rgba(245,158,11,.25)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, padding: '18px' }}>
          <p style={{ fontSize: 11, color: '#FCD34D', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>⚠️ Expirent bientôt</p>
          <p style={{ fontSize: 30, fontWeight: 900, color: stats.expires7j > 0 ? '#FCD34D' : 'rgba(255,255,255,.3)', letterSpacing: -1, lineHeight: 1 }}>{stats.expires7j}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>dans les 7 prochains jours</p>
        </div>
        <div style={{ background: 'rgba(55,138,221,.08)', border: '1px solid rgba(55,138,221,.2)', borderRadius: 16, padding: '18px' }}>
          <p style={{ fontSize: 11, color: '#93C5FD', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>📦 Total encaissé</p>
          <p style={{ fontSize: 30, fontWeight: 900, color: '#93C5FD', letterSpacing: -1, lineHeight: 1 }}>{fmt(stats.totalRevenu)} F</p>
        </div>
      </div>

      {/* Filtres par plan */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['tous','starter','business','elite'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${filtre === f ? '#7F77DD' : 'rgba(255,255,255,.1)'}`, background: filtre === f ? 'rgba(127,119,221,.2)' : 'transparent', color: filtre === f ? '#AFA9EC' : 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {f === 'tous' ? `Tous (${abos.length})` : `${f} (${abos.filter(a => a.plan === f).length})`}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,.3)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>💳</p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Aucun abonné actif</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>Les abonnements apparaîtront ici dès qu'un utilisateur paie</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((a: any) => {
            const expire = a.fin ? new Date(a.fin) : null
            const joursRestants = expire ? Math.ceil((expire.getTime() - now.getTime()) / 86400000) : null
            const cfg = PLAN_COLOR[a.plan] || { color: '#888', bg: '#F3F4F6' }
            const urgence = joursRestants !== null && joursRestants <= 7

            return (
              <div key={a.id} style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', border: urgence ? '2px solid #FDE68A' : '1px solid #F0F0F0' }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
                  {(a.profiles?.email || 'U').slice(0, 2).toUpperCase()}
                </div>

                {/* Info principale */}
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>{a.profiles?.email || 'N/A'}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                      {(a.plan || '').toUpperCase()}
                    </span>
                    {urgence && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: '#FEF3C7', color: '#92400E' }}>
                        ⚠️ Expire dans {joursRestants}j
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {a.profiles?.nom_boutique && (
                      <span style={{ fontSize: 12, color: '#888' }}>🏪 {a.profiles.nom_boutique}</span>
                    )}
                    <span style={{ fontSize: 12, color: '#ABABAB' }}>
                      Depuis le {a.debut ? new Date(a.debut).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                    <span style={{ fontSize: 12, color: urgence ? '#D97706' : '#ABABAB' }}>
                      Expire le {expire ? expire.toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Montant + actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#0C0C1E' }}>{fmt(a.montant || 0)} F</p>
                    <p style={{ fontSize: 11, color: '#ABABAB' }}>payé</p>
                  </div>
                  <button onClick={() => prolonger(a.user_id, a.id, a.plan, 30)}
                    style={{ padding: '7px 14px', borderRadius: 10, border: '1.5px solid #E0E0F0', background: '#F8F8FC', color: '#7F77DD', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    +30j
                  </button>
                  <button onClick={() => prolonger(a.user_id, a.id, a.plan, 365)}
                    style={{ padding: '7px 14px', borderRadius: 10, border: '1.5px solid #BBF7D0', background: '#F0FFF4', color: '#16A34A', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
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
