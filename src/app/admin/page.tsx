'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function AdminAffiliationPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'retraits'|'affilies'|'commissions'>('retraits')
  const [retraits, setRetraits] = useState<any[]>([])
  const [affilies, setAffiliés] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [stats, setStats] = useState({ totalAffiliés: 0, totalInvites: 0, totalCommissions: 0, totalRetraits: 0, enAttente: 0 })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [r, a, c] = await Promise.all([
      supabase.from('retraits').select('*, profiles:user_id(email, nom_boutique)').order('created_at', { ascending: false }),
      supabase.from('affilies').select('*, profiles:user_id(email, nom_boutique)').order('created_at', { ascending: false }),
      supabase.from('commissions').select('*, affilies(code, profiles:user_id(email)), profiles:filleul_user_id(email)').order('created_at', { ascending: false }).limit(100),
    ])
    const allRetraits = r.data || []
    const allAffiliés = a.data || []
    const allCommissions = c.data || []

    setRetraits(allRetraits)
    setAffiliés(allAffiliés)
    setCommissions(allCommissions)
    setStats({
      totalAffiliés: allAffiliés.length,
      totalInvites: allAffiliés.reduce((s: number, a: any) => s + (a.nb_filleuls || 0), 0),
      totalCommissions: allCommissions.reduce((s: number, c: any) => s + (c.montant || 0), 0),
      totalRetraits: allRetraits.filter((r: any) => r.statut === 'paye').reduce((s: number, r: any) => s + (r.montant || 0), 0),
      enAttente: allRetraits.filter((r: any) => r.statut === 'en_attente').length,
    })
    setLoading(false)
  }

  async function approuverRetrait(retrait: any) {
    setProcessing(retrait.id)
    try {
      // Créer paiement PayDunya vers le numéro Wave
      const mode = process.env.NEXT_PUBLIC_PAYDUNYA_MODE || 'live'
      const res = await fetch('/api/affiliation/payer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retrait_id: retrait.id,
          montant: retrait.montant,
          numero: retrait.numero_wave,
          email: retrait.profiles?.email || '',
        })
      })
      const data = await res.json()
      if (data.ok) {
        await supabase.from('retraits').update({ statut: 'paye', paydunya_token: data.token, updated_at: new Date().toISOString() }).eq('id', retrait.id)
        // Mettre à jour total_retire de l'affilié
        await supabase.from('affilies').update({
          total_retire: (retrait.affilie?.total_retire || 0) + retrait.montant,
          updated_at: new Date().toISOString()
        }).eq('id', retrait.affilie_id)
        // Notifier l'affilié
        await supabase.from('notifications_user').insert({
          user_id: retrait.user_id,
          titre: '💸 Retrait payé !',
          message: `Ton retrait de ${fmt(retrait.montant)} FCFA a été envoyé sur le ${retrait.numero_wave}.`,
          type: 'success',
        })
        alert(`✅ Paiement de ${fmt(retrait.montant)} FCFA envoyé !`)
      } else {
        // Approuver manuellement si PayDunya échoue
        await supabase.from('retraits').update({ statut: 'approuve', updated_at: new Date().toISOString() }).eq('id', retrait.id)
        alert(`Approuvé manuellement. Erreur PayDunya: ${data.error || 'inconnue'}`)
      }
    } catch (e) {
      await supabase.from('retraits').update({ statut: 'approuve', updated_at: new Date().toISOString() }).eq('id', retrait.id)
      alert('Approuvé manuellement (erreur réseau)')
    }
    setProcessing(null); load()
  }

  async function refuserRetrait(retraitId: string, affilieId: string, montant: number, userId: string, note: string) {
    setProcessing(retraitId)
    // Rembourser le solde
    await supabase.rpc('crediter_affilie', { p_affilie_id: affilieId, p_montant: montant })
    await supabase.from('retraits').update({ statut: 'refuse', note_admin: note, updated_at: new Date().toISOString() }).eq('id', retraitId)
    await supabase.from('notifications_user').insert({
      user_id: userId,
      titre: '❌ Retrait refusé',
      message: `Ton retrait de ${fmt(montant)} FCFA a été refusé. Motif : ${note}. Le montant a été recrédité sur ton solde.`,
      type: 'warning',
    })
    setProcessing(null); load()
  }

  async function toggleStatut(affilieId: string, statut: string) {
    await supabase.from('affilies').update({ statut: statut === 'actif' ? 'suspendu' : 'actif' }).eq('id', affilieId)
    load()
  }

  const S: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.sbt{transition:all .15s;cursor:pointer;font-family:inherit;}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Programme d'affiliation</h1>
          {stats.enAttente > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 20, padding: '4px 12px', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>⚠️ {stats.enAttente} retrait{stats.enAttente > 1 ? 's' : ''} en attente</span>
            </div>
          )}
        </div>
        <button onClick={load} style={{ background: 'rgba(127,119,221,.15)', border: '1px solid rgba(127,119,221,.3)', color: '#7F77DD', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🔄</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { lbl: '👥 Affiliés', val: stats.totalAffiliés, color: '#7F77DD' },
          { lbl: '👥 Personnes invitées', val: stats.totalInvites, color: '#1D9E75' },
          { lbl: '💰 Commissions', val: fmt(stats.totalCommissions) + ' F', color: '#F59E0B' },
          { lbl: '💸 Retraits payés', val: fmt(stats.totalRetraits) + ' F', color: '#E24B4A' },
        ].map(k => (
          <div key={k.lbl} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '14px' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>{k.lbl}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: -.5 }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: 4, marginBottom: 20 }}>
        {[['retraits',`💸 Retraits${stats.enAttente > 0 ? ` (${stats.enAttente})` : ''}`],['affilies','👥 Affiliés'],['commissions','💰 Commissions']].map(([id, label]) => (
          <button key={id} className="sbt" onClick={() => setTab(id as any)}
            style={{ flex: 1, padding: '8px', borderRadius: 11, border: 'none', background: tab === id ? 'rgba(127,119,221,.2)' : 'transparent', color: tab === id ? '#AFA9EC' : 'rgba(255,255,255,.4)', fontWeight: 700, fontSize: 13 }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* RETRAITS */}
          {tab === 'retraits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {retraits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,.3)' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>💸</p>
                  <p>Aucune demande de retrait</p>
                </div>
              ) : retraits.map((r: any) => {
                const isWaiting = r.statut === 'en_attente'
                const cfg = r.statut === 'paye' ? { color: '#9FE1CB', bg: 'rgba(29,158,117,.15)', label: '✅ Payé' }
                  : r.statut === 'approuve' ? { color: '#93C5FD', bg: 'rgba(37,99,235,.15)', label: '🔄 Approuvé' }
                  : r.statut === 'refuse' ? { color: '#F09595', bg: 'rgba(226,75,74,.15)', label: '❌ Refusé' }
                  : { color: '#FCD34D', bg: 'rgba(245,158,11,.15)', label: '⏳ En attente' }
                return (
                  <div key={r.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${isWaiting ? 'rgba(245,158,11,.3)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{fmt(r.montant)} FCFA</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 3 }}>👤 {r.profiles?.email || 'N/A'}</p>
                        <p style={{ fontSize: 13, color: '#AFA9EC', marginBottom: 3 }}>📱 {r.numero_wave}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{new Date(r.created_at).toLocaleString('fr-FR')}</p>
                        {r.note_admin && <p style={{ fontSize: 11, color: '#F59E0B', marginTop: 4 }}>Note : {r.note_admin}</p>}
                      </div>
                      {isWaiting && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                          <button className="sbt" onClick={() => approuverRetrait(r)} disabled={processing === r.id}
                            style={{ background: 'rgba(29,158,117,.2)', border: '1px solid rgba(29,158,117,.4)', color: '#9FE1CB', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, opacity: processing === r.id ? .6 : 1 }}>
                            {processing === r.id ? '⏳...' : '✅ Payer via Wave'}
                          </button>
                          <button className="sbt" onClick={() => {
                            const note = prompt('Motif du refus :')
                            if (note) refuserRetrait(r.id, r.affilie_id, r.montant, r.user_id, note)
                          }} disabled={processing === r.id}
                            style={{ background: 'rgba(226,75,74,.15)', border: '1px solid rgba(226,75,74,.3)', color: '#F09595', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>
                            ❌ Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* AFFILIÉS */}
          {tab === 'affilies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {affilies.map((a: any) => (
                <div key={a.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{a.profiles?.email || 'N/A'}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: a.statut === 'actif' ? 'rgba(29,158,117,.2)' : 'rgba(226,75,74,.15)', color: a.statut === 'actif' ? '#9FE1CB' : '#F09595' }}>{a.statut}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#AFA9EC', fontWeight: 700 }}>Code : {a.code}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>👥 {a.nb_filleuls} filleuls</span>
                      <span style={{ fontSize: 12, color: '#9FE1CB' }}>💰 {fmt(a.total_gains)} F gagné</span>
                      <span style={{ fontSize: 12, color: '#FCD34D' }}>💎 {fmt(a.solde)} F solde</span>
                    </div>
                  </div>
                  <button className="sbt" onClick={() => toggleStatut(a.id, a.statut)}
                    style={{ padding: '7px 14px', borderRadius: 10, border: `1px solid ${a.statut === 'actif' ? 'rgba(226,75,74,.3)' : 'rgba(29,158,117,.3)'}`, background: a.statut === 'actif' ? 'rgba(226,75,74,.1)' : 'rgba(29,158,117,.1)', color: a.statut === 'actif' ? '#F09595' : '#9FE1CB', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {a.statut === 'actif' ? 'Suspendre' : 'Activer'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* COMMISSIONS */}
          {tab === 'commissions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {commissions.map((c: any) => (
                <div key={c.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginBottom: 3 }}>
                      {c.affilies?.profiles?.email || 'Affilié'} → {c.profiles?.email || 'Filleul'}
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#AFA9EC' }}>Code : {c.affilies?.code}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>Plan {c.plan}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#9FE1CB' }}>+{fmt(c.montant)} F</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>50% de {fmt(c.montant_abonnement)} F</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
