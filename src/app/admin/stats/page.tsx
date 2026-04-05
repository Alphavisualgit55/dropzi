'use client'
import { useEffect, useState } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const PLAN_CFG: Record<string, { color: string; bg: string }> = {
  starter:  { color: '#F59E0B', bg: 'rgba(245,158,11,.15)' },
  business: { color: '#818CF8', bg: 'rgba(129,140,248,.15)' },
  elite:    { color: '#34D399', bg: 'rgba(52,211,153,.15)' },
  aucun:    { color: '#475569', bg: 'rgba(71,85,105,.15)' },
}

const PERIODES = [
  { id: 'today',  label: "Auj.",     days: 0 },
  { id: '7j',     label: '7 jours',  days: 7 },
  { id: '30j',    label: '30 jours', days: 30 },
  { id: 'month',  label: 'Ce mois',  days: -1 },
  { id: 'custom', label: 'Dates...',  days: -2 },
]

export default function AdminStatsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'commandes'|'ca'|'benefice'|'taux'>('commandes')
  const [filtrePlan, setFiltrePlan] = useState('tous')
  const [periode, setPeriode] = useState('30j')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => { load() }, [periode, dateFrom, dateTo])

  function getDates() {
    const now = new Date()
    let from = '', to = new Date().toISOString().slice(0, 10)
    if (periode === 'today') {
      from = now.toISOString().slice(0, 10)
    } else if (periode === '7j') {
      const d = new Date(); d.setDate(d.getDate() - 7)
      from = d.toISOString().slice(0, 10)
    } else if (periode === '30j') {
      const d = new Date(); d.setDate(d.getDate() - 30)
      from = d.toISOString().slice(0, 10)
    } else if (periode === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    } else if (periode === 'custom') {
      from = dateFrom; to = dateTo
    }
    return { from, to }
  }

  async function load() {
    setLoading(true)
    const { from, to } = getDates()
    const params = new URLSearchParams({ t: Date.now().toString() })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const res = await fetch('/api/admin/stats?' + params.toString(), { cache: 'no-store' })
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
      return b.taux_livraison - a.taux_livraison
    })

  const S: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.row{transition:background .1s;}.row:hover{background:rgba(255,255,255,.03)!important;}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#fff' }}>Statistiques</h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: 4 }}>Performances de chaque boutique</p>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>🔄</button>
      </div>

      {/* Sélecteur période */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '14px 16px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>📅 Période</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PERIODES.map(p => (
            <button key={p.id} onClick={() => setPeriode(p.id)}
              style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${periode === p.id ? '#818CF8' : 'rgba(255,255,255,.1)'}`, background: periode === p.id ? 'rgba(129,140,248,.2)' : 'transparent', color: periode === p.id ? '#AFA9EC' : 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {p.label}
            </button>
          ))}
        </div>
        {periode === 'custom' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 4 }}>Du</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...S }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 4 }}>Au</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...S }} />
            </div>
            <button onClick={load} disabled={!dateFrom || !dateTo}
              style={{ marginTop: 18, padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#818CF8,#6366F1)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !dateFrom || !dateTo ? .5 : 1 }}>
              Appliquer
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 36, height: 36, border: '2px solid #818CF8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* KPIs globaux */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { lbl: '👥 Users',         val: String(data?.global?.totalUsers || 0),          color: '#AFA9EC', bg: 'rgba(127,119,221,.08)', border: 'rgba(127,119,221,.2)' },
              { lbl: '✅ Actifs',         val: String(data?.global?.actifs || 0),              color: '#34D399', bg: 'rgba(52,211,153,.08)',  border: 'rgba(52,211,153,.2)' },
              { lbl: '💰 MRR',            val: fmt(data?.global?.mrr || 0) + ' F',             color: '#FCD34D', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)' },
              { lbl: '📦 Commandes',      val: fmt(data?.global?.totalCommandes || 0),          color: '#93C5FD', bg: 'rgba(55,138,221,.08)', border: 'rgba(55,138,221,.2)' },
              { lbl: '✅ Livrées',        val: fmt(data?.global?.totalLivrees || 0),            color: '#9FE1CB', bg: 'rgba(29,158,117,.08)', border: 'rgba(29,158,117,.2)' },
              { lbl: '💎 CA global',      val: fmt(data?.global?.totalCA || 0) + ' F',          color: '#F9A8D4', bg: 'rgba(236,72,153,.08)', border: 'rgba(236,72,153,.2)' },
              { lbl: '📈 Bénéfice total', val: fmt(data?.global?.totalBenefice || 0) + ' F',   color: '#6EE7B7', bg: 'rgba(52,211,153,.08)', border: 'rgba(52,211,153,.2)' },
            ].map(k => (
              <div key={k.lbl} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 14, padding: '14px 12px' }}>
                <p style={{ fontSize: 10, color: k.color, fontWeight: 700, marginBottom: 8, opacity: .8 }}>{k.lbl}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: -.5 }}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Boutique, email..."
              style={{ ...S, flex: 1, minWidth: 160 }} />
            <select value={filtrePlan} onChange={e => setFiltrePlan(e.target.value)} style={S}>
              <option value="tous">Tous les plans</option>
              <option value="actif">Actifs seulement</option>
              <option value="starter">Starter</option>
              <option value="business">Business</option>
              <option value="elite">Elite</option>
              <option value="aucun">Sans plan</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={S}>
              <option value="commandes">↓ Commandes</option>
              <option value="ca">↓ CA</option>
              <option value="benefice">↓ Bénéfice</option>
              <option value="taux">↓ Taux livraison</option>
            </select>
          </div>

          {/* Tableau */}
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 18, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 90px 110px 110px 70px 80px', gap: 8, padding: '10px 16px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              {['Boutique / Email', 'Plan', 'Commandes', 'CA Total', 'Bénéfice', 'Taux', 'Inscrit'].map(h => (
                <p key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.07em', margin: 0 }}>{h}</p>
              ))}
            </div>

            {users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>📊</p>
                <p>Aucun utilisateur trouvé</p>
              </div>
            ) : users.map((u: any, i: number) => {
              const plan = u.plan || 'aucun'
              const cfg = PLAN_CFG[plan] || PLAN_CFG['aucun']
              return (
                <div key={u.id} className="row"
                  style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 90px 110px 110px 70px 80px', gap: 8, padding: '11px 16px', borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{u.nom_boutique || '—'}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                      {plan === 'aucun' ? '—' : plan.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: u.nb_commandes > 0 ? '#fff' : 'rgba(255,255,255,.2)', margin: 0 }}>{u.nb_commandes}</p>
                    {u.nb_commandes > 0 && <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', margin: 0 }}>{u.nb_livrees} livrées · {u.nb_annulees} ann.</p>}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: u.ca_total > 0 ? '#9FE1CB' : 'rgba(255,255,255,.2)', margin: 0 }}>
                      {u.ca_total > 0 ? fmt(u.ca_total) + ' F' : '—'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: u.benefice_total > 0 ? '#34D399' : u.benefice_total < 0 ? '#F09595' : 'rgba(255,255,255,.2)', margin: 0 }}>
                      {u.benefice_total !== 0 ? fmt(u.benefice_total) + ' F' : '—'}
                    </p>
                  </div>
                  <div>
                    {u.nb_commandes > 0 ? (
                      <>
                        <p style={{ fontSize: 13, fontWeight: 700, color: u.taux_livraison >= 70 ? '#34D399' : u.taux_livraison >= 40 ? '#F59E0B' : '#F09595', margin: 0 }}>{u.taux_livraison}%</p>
                        <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 4, marginTop: 3, overflow: 'hidden', width: '90%' }}>
                          <div style={{ width: `${u.taux_livraison}%`, height: '100%', background: u.taux_livraison >= 70 ? '#34D399' : u.taux_livraison >= 40 ? '#F59E0B' : '#F09595', borderRadius: 4 }} />
                        </div>
                      </>
                    ) : <p style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', margin: 0 }}>—</p>}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: 0 }}>
                      {new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totaux */}
          {users.length > 0 && (
            <div style={{ marginTop: 10, padding: '12px 16px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{users.length} boutiques</span>
              <span style={{ fontSize: 12, color: '#93C5FD', fontWeight: 700 }}>📦 {fmt(users.reduce((s: number, u: any) => s + u.nb_commandes, 0))} commandes</span>
              <span style={{ fontSize: 12, color: '#9FE1CB', fontWeight: 700 }}>💎 {fmt(users.reduce((s: number, u: any) => s + u.ca_total, 0))} F CA</span>
              <span style={{ fontSize: 12, color: '#34D399', fontWeight: 700 }}>📈 {fmt(users.reduce((s: number, u: any) => s + u.benefice_total, 0))} F bénéfice</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
