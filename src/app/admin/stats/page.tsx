'use client'
import { useEffect, useState } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const PLAN_CFG: Record<string, { color: string; bg: string }> = {
  starter:  { color: '#F59E0B', bg: 'rgba(245,158,11,.15)' },
  business: { color: '#818CF8', bg: 'rgba(129,140,248,.15)' },
  elite:    { color: '#34D399', bg: 'rgba(52,211,153,.15)' },
  aucun:    { color: '#475569', bg: 'rgba(71,85,105,.15)' },
}

export default function AdminStatsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'commandes'|'ca'|'benefice'|'taux'>('commandes')
  const [filtrePlan, setFiltrePlan] = useState('tous')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/stats?t=' + Date.now(), { cache: 'no-store' })
    const d = await res.json()
    if (d.ok) setData(d)
    setLoading(false)
  }

  const users = (data?.users || [])
    .filter((u: any) => filtrePlan === 'tous' || u.plan === filtrePlan || (filtrePlan === 'actif' && u.plan_actif))
    .filter((u: any) => !search || [u.email, u.nom_boutique].some((v: any) => (v || '').toLowerCase().includes(search.toLowerCase())))
    .sort((a: any, b: any) => {
      if (sortBy === 'commandes') return b.nb_commandes - a.nb_commandes
      if (sortBy === 'ca') return b.ca_total - a.ca_total
      if (sortBy === 'benefice') return b.benefice_total - a.benefice_total
      if (sortBy === 'taux') return b.taux_livraison - a.taux_livraison
      return 0
    })

  const S: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#fff' }}>Statistiques utilisateurs</h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: 4 }}>Performances de chaque boutique</p>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          🔄 Actualiser
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 36, height: 36, border: '2px solid #818CF8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* KPIs globaux */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 24 }}>
            {[
              { lbl: '👥 Total users',       val: data?.global?.totalUsers || 0,                  color: '#AFA9EC', bg: 'rgba(127,119,221,.08)', border: 'rgba(127,119,221,.2)' },
              { lbl: '✅ Abonnés actifs',    val: data?.global?.actifs || 0,                       color: '#34D399', bg: 'rgba(52,211,153,.08)',  border: 'rgba(52,211,153,.2)' },
              { lbl: '💰 MRR',               val: fmt(data?.global?.mrr || 0) + ' F',              color: '#FCD34D', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)' },
              { lbl: '📦 Total commandes',   val: fmt(data?.global?.totalCommandes || 0),           color: '#93C5FD', bg: 'rgba(55,138,221,.08)', border: 'rgba(55,138,221,.2)' },
              { lbl: '💎 CA global',         val: fmt(data?.global?.totalCA || 0) + ' F',           color: '#9FE1CB', bg: 'rgba(29,158,117,.08)', border: 'rgba(29,158,117,.2)' },
            ].map(k => (
              <div key={k.lbl} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 14, padding: '14px 12px' }}>
                <p style={{ fontSize: 10, color: k.color, fontWeight: 700, marginBottom: 8, opacity: .8 }}>{k.lbl}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: -.5 }}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Filtres + Tri */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Rechercher boutique, email..."
              style={{ ...S, flex: 1, minWidth: 180 }} />
            <select value={filtrePlan} onChange={e => setFiltrePlan(e.target.value)} style={{ ...S }}>
              <option value="tous">Tous les plans</option>
              <option value="actif">Actifs seulement</option>
              <option value="starter">Starter</option>
              <option value="business">Business</option>
              <option value="elite">Elite</option>
              <option value="aucun">Sans plan</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ ...S }}>
              <option value="commandes">↓ Nb commandes</option>
              <option value="ca">↓ CA total</option>
              <option value="benefice">↓ Bénéfice</option>
              <option value="taux">↓ Taux livraison</option>
            </select>
          </div>

          {/* Tableau */}
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 18, overflow: 'hidden' }}>
            {/* Header tableau */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px 100px 70px 80px', gap: 8, padding: '10px 16px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              {['Boutique / Email', 'Plan', 'Commandes', 'CA Total', 'Bénéfice', 'Taux', 'Inscrit'].map(h => (
                <p key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</p>
              ))}
            </div>

            {/* Lignes */}
            {users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>📊</p>
                <p>Aucun utilisateur trouvé</p>
              </div>
            ) : users.map((u: any, i: number) => {
              const plan = u.plan || 'aucun'
              const cfg = PLAN_CFG[plan] || PLAN_CFG['aucun']
              return (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px 100px 70px 80px', gap: 8, padding: '12px 16px', borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', alignItems: 'center', transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                  {/* Boutique */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {u.nom_boutique || '—'}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </p>
                  </div>

                  {/* Plan */}
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, display: 'inline-block' }}>
                      {plan === 'aucun' ? '—' : plan.toUpperCase()}
                    </span>
                  </div>

                  {/* Commandes */}
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: u.nb_commandes > 0 ? '#fff' : 'rgba(255,255,255,.25)' }}>{u.nb_commandes}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{u.nb_livrees} livrées</p>
                  </div>

                  {/* CA */}
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: u.ca_total > 0 ? '#9FE1CB' : 'rgba(255,255,255,.25)' }}>
                      {u.ca_total > 0 ? fmt(u.ca_total) + ' F' : '—'}
                    </p>
                  </div>

                  {/* Bénéfice */}
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: u.benefice_total > 0 ? '#34D399' : 'rgba(255,255,255,.25)' }}>
                      {u.benefice_total > 0 ? fmt(u.benefice_total) + ' F' : '—'}
                    </p>
                  </div>

                  {/* Taux livraison */}
                  <div>
                    {u.nb_commandes > 0 ? (
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: u.taux_livraison >= 70 ? '#34D399' : u.taux_livraison >= 40 ? '#F59E0B' : '#F09595' }}>
                          {u.taux_livraison}%
                        </p>
                        <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 4, marginTop: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${u.taux_livraison}%`, height: '100%', background: u.taux_livraison >= 70 ? '#34D399' : u.taux_livraison >= 40 ? '#F59E0B' : '#F09595', borderRadius: 4, transition: 'width .5s' }} />
                        </div>
                      </div>
                    ) : <p style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>—</p>}
                  </div>

                  {/* Date inscription */}
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
                      {new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total filtré */}
          {users.length > 0 && (
            <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{users.length} utilisateurs affichés</span>
              <span style={{ fontSize: 12, color: '#9FE1CB' }}>CA cumulé : {fmt(users.reduce((s: number, u: any) => s + u.ca_total, 0))} F</span>
              <span style={{ fontSize: 12, color: '#34D399' }}>Bénéfice cumulé : {fmt(users.reduce((s: number, u: any) => s + u.benefice_total, 0))} F</span>
              <span style={{ fontSize: 12, color: '#93C5FD' }}>Total commandes : {fmt(users.reduce((s: number, u: any) => s + u.nb_commandes, 0))}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
