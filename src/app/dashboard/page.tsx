'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const STATUT_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  en_attente:   { label: 'En attente',   bg: '#FAEEDA', color: '#633806' },
  en_livraison: { label: 'En livraison', bg: '#E6F1FB', color: '#0C447C' },
  livre:        { label: 'Livré',        bg: '#E1F5EE', color: '#085041' },
  annule:       { label: 'Annulé',       bg: '#FCEBEB', color: '#501313' },
  echec:        { label: 'Échec',        bg: '#F1EFE8', color: '#444441' },
}

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ ca: 0, benefice: 0, nb: 0, livrees: 0, en_cours: 0, annulees: 0, panier_moyen: 0 })
  const [commandes, setCommandes] = useState<any[]>([])
  const [hierBenefice, setHierBenefice] = useState(0)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

    const [cmdRes, hierRes] = await Promise.all([
      supabase.from('commandes_detail').select('*').gte('created_at', today.toISOString()).order('created_at', { ascending: false }),
      supabase.from('commandes_detail').select('benefice').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
    ])

    const data = cmdRes.data || []
    const hier = hierRes.data || []
    setCommandes(data.slice(0, 6))

    const livrees = data.filter((c: any) => c.statut === 'livre')
    const ca = livrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const benefice = livrees.reduce((s: number, c: any) => s + (c.benefice || 0), 0)
    const hierB = hier.filter((c: any) => c.statut === 'livre').reduce((s: number, c: any) => s + (c.benefice || 0), 0)

    setStats({
      ca, benefice,
      nb: data.length,
      livrees: livrees.length,
      en_cours: data.filter((c: any) => c.statut === 'en_livraison').length,
      annulees: data.filter((c: any) => ['annule', 'echec'].includes(c.statut)).length,
      panier_moyen: livrees.length > 0 ? Math.round(ca / livrees.length) : 0,
    })
    setHierBenefice(hierB)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const ch = supabase.channel('dash-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const pct = hierBenefice > 0 ? Math.round(((stats.benefice - hierBenefice) / hierBenefice) * 100) : 0
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) return (
    <div className="flex justify-center items-center min-h-64">
      <div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <p className="text-sm text-gray-400 capitalize font-medium">{date}</p>

      {/* Bénéfice card */}
      <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', borderRadius: 22, padding: '22px 24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, background: 'rgba(127,119,221,.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 40, width: 90, height: 90, background: 'rgba(29,158,117,.07)', borderRadius: '50%' }} />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Mon bénéfice aujourd'hui</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
          <p style={{ fontSize: 38, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{fmt(stats.benefice)} <span style={{ fontSize: 20, fontWeight: 600, opacity: .7 }}>FCFA</span></p>
          {pct !== 0 && (
            <span style={{ background: pct > 0 ? 'rgba(29,158,117,.25)' : 'rgba(226,75,74,.25)', color: pct > 0 ? '#9FE1CB' : '#F09595', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginBottom: 2 }}>
              {pct > 0 ? '+' : ''}{pct}% vs hier
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,.35)', flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <span>CA : <strong style={{ color: 'rgba(255,255,255,.65)' }}>{fmt(stats.ca)} F</strong></span>
          <span>·</span>
          <span><strong style={{ color: 'rgba(255,255,255,.65)' }}>{stats.nb}</strong> commandes</span>
          <span>·</span>
          <span>Panier : <strong style={{ color: 'rgba(255,255,255,.65)' }}>{fmt(stats.panier_moyen)} F</strong></span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[
          { label: 'Total', val: stats.nb, color: '#0C0C1E', bg: '#fff' },
          { label: 'Livrées', val: stats.livrees, color: '#085041', bg: '#E1F5EE' },
          { label: 'En cours', val: stats.en_cours, color: '#0C447C', bg: '#E6F1FB' },
          { label: 'Annulées', val: stats.annulees, color: '#501313', bg: '#FCEBEB' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: '0.5px solid rgba(0,0,0,.06)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: s.color, opacity: .6, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: -1 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link href="/dashboard/commandes" style={{ display: 'block', width: '100%', textAlign: 'center', fontWeight: 700, padding: '16px', borderRadius: 18, color: '#fff', textDecoration: 'none', fontSize: 16, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', boxShadow: '0 4px 20px rgba(127,119,221,.3)' }}>
        ⚡ Nouvelle commande
      </Link>

      {/* Commandes récentes */}
      <div className="card" style={{ borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>Commandes du jour</p>
          <Link href="/dashboard/commandes" style={{ color: '#7F77DD', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Voir tout →</Link>
        </div>

        {commandes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>📦</p>
            <p style={{ color: '#aaa', fontSize: 13, marginBottom: 14 }}>Aucune commande aujourd'hui</p>
            <Link href="/dashboard/commandes" className="btn-primary text-sm">Créer la première</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {commandes.map((c: any) => {
              const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG['en_attente']
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F8F8FC', borderRadius: 13, border: '0.5px solid #eee' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#534AB7', flexShrink: 0 }}>
                    {(c.client_nom || c.client_tel || 'C').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0C0C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.client_nom || c.client_tel || 'Client'}
                    </p>
                    <p style={{ fontSize: 11, color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {c.zone_nom ? `📍 ${c.zone_nom}` : ''} {c.numero_commande ? `· ${c.numero_commande}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: c.statut === 'livre' ? '#1D9E75' : '#0C0C1E', marginBottom: 4 }}>
                      {fmt(c.total_vente || 0)} F
                    </p>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bouton toutes les commandes */}
      <Link href="/dashboard/commandes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', border: '1.5px solid #CECBF6', borderRadius: 16, padding: '14px', textDecoration: 'none', color: '#534AB7', fontWeight: 700, fontSize: 14 }}>
        📦 Voir toutes les commandes
        <span style={{ background: '#EEEDFE', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{stats.nb} aujourd'hui</span>
      </Link>

      {/* Raccourcis rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[
          { label: 'Rapports', href: '/dashboard/rapports', icon: '📊', bg: '#E1F5EE', color: '#085041' },
          { label: 'Factures', href: '/dashboard/factures', icon: '🧾', bg: '#EEEDFE', color: '#3C3489' },
          { label: 'Stock', href: '/dashboard/stock', icon: '🏪', bg: '#FAEEDA', color: '#633806' },
          { label: 'Import', href: '/dashboard/import', icon: '📥', bg: '#E6F1FB', color: '#0C447C' },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{ background: a.bg, border: `0.5px solid ${a.color}33`, borderRadius: 14, padding: '14px 8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 22 }}>{a.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: a.color, textAlign: 'center' }}>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
