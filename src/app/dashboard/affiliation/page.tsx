'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function AffiliationPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [affilie, setAffilie] = useState<any>(null)
  const [invites, setInvites] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [retraits, setRetraits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [tab, setTab] = useState<'dashboard'|'invites'|'retraits'>('dashboard')
  const [montantRetrait, setMontantRetrait] = useState('')
  const [numeroWave, setNumeroWave] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      load(user.id)
    })
  }, [])

  async function load(uid: string) {
    setLoading(true)
    const { data: af } = await supabase.from('affilies').select('*').eq('user_id', uid).single()
    const { data: rt } = await supabase.from('retraits').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    setAffilie(af || null)
    setRetraits(rt || [])

    if (af) {
      const { data: inv } = await supabase.from('filleuls').select('*, profiles:filleul_user_id(email, nom_boutique, plan, created_at)').eq('affilie_id', af.id).order('created_at', { ascending: false })
      const { data: com } = await supabase.from('commissions').select('*, profiles:filleul_user_id(email)').eq('affilie_id', af.id).order('created_at', { ascending: false })
      setInvites(inv || [])
      setCommissions(com || [])
    }
    setLoading(false)
  }

  async function rejoindre() {
    if (!userId) return
    setJoining(true)
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single()
    const base = (profile?.email || userId).split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    const code = base + Math.floor(Math.random() * 100)
    const { data } = await supabase.from('affilies').insert({ user_id: userId, code, statut: 'actif', solde: 0, total_gains: 0, total_retire: 0, nb_filleuls: 0 }).select().single()
    if (data) setAffilie(data)
    setJoining(false)
  }

  async function demanderRetrait() {
    if (!userId || !affilie || !montantRetrait || !numeroWave) return
    const montant = parseInt(montantRetrait)
    if (montant < 5000) { alert('Montant minimum : 5 000 FCFA'); return }
    if (montant > affilie.solde) { alert('Solde insuffisant'); return }
    setSubmitting(true)
    const { error } = await supabase.from('retraits').insert({ affilie_id: affilie.id, user_id: userId, montant, numero_wave: numeroWave, statut: 'en_attente' })
    if (!error) {
      await supabase.from('affilies').update({ solde: affilie.solde - montant, updated_at: new Date().toISOString() }).eq('id', affilie.id)
      alert('✅ Demande envoyée ! Traitement sous 24-48h.')
      setMontantRetrait(''); setNumeroWave('')
      load(userId)
    }
    setSubmitting(false)
  }

  function copierLien() {
    navigator.clipboard.writeText(`https://dropzi.netlify.app/login?ref=${affilie?.code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const F: React.CSSProperties = { width: '100%', border: '1.5px solid #EBEBEB', borderRadius: 12, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#FAFAFA', color: '#111', boxSizing: 'border-box' }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '3px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  if (!affilie) return (
    <div style={{ maxWidth: 520, margin: '0 auto', paddingBottom: 48 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ background: 'linear-gradient(135deg,#06060F,#1a1a3e)', borderRadius: 24, padding: '40px 32px', textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🤝</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -.8, marginBottom: 12 }}>Programme de parrainage</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: 32 }}>
          Recommande Dropzi et gagne <strong style={{ color: '#9FE1CB' }}>50% de commission</strong> sur chaque abonnement payé par les personnes que tu invites.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 32 }}>
          {[['🔗','Partage','Ton lien unique'],['👤','Inscription','Tes contacts s\'inscrivent'],['💰','50%','Commission automatique']].map(([icon, titre, desc]) => (
            <div key={titre} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '16px 10px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{titre}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#AFA9EC', marginBottom: 10 }}>Exemple de gains mensuels :</p>
          {[['1 contact — plan Starter','1 500 F/mois'],['1 contact — plan Business','2 500 F/mois'],['1 contact — plan Elite','7 500 F/mois'],['10 contacts — plan Business','25 000 F/mois']].map(([label, gain]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#9FE1CB' }}>→ {gain}</span>
            </div>
          ))}
        </div>
        <button onClick={rejoindre} disabled={joining}
          style={{ width: '100%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 16, padding: '16px', fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(127,119,221,.4)' }}>
          {joining ? '⏳ Création...' : '🚀 Rejoindre le programme'}
        </button>
      </div>
    </div>
  )

  const lien = `https://dropzi.netlify.app/login?ref=${affilie.code}`

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.sbt{transition:all .15s;cursor:pointer;font-family:inherit;}`}</style>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.5, margin: 0 }}>Mon parrainage 🤝</h1>
        <p style={{ fontSize: 13, color: '#ABABAB', marginTop: 4 }}>Code : <strong style={{ color: '#7F77DD' }}>{affilie.code}</strong></p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
        <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', borderRadius: 18, padding: '18px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>💰 Solde disponible</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#9FE1CB', letterSpacing: -1.5, lineHeight: 1, marginBottom: 4 }}>{fmt(affilie.solde)}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>FCFA à retirer</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#EEEDFE', borderRadius: 14, padding: '12px 16px', flex: 1 }}>
            <p style={{ fontSize: 10, color: '#7F77DD', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Total gagné</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#534AB7', letterSpacing: -.5 }}>{fmt(affilie.total_gains)} F</p>
          </div>
          <div style={{ background: '#F0FFF4', borderRadius: 14, padding: '12px 16px', flex: 1 }}>
            <p style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Contacts inscrits</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#15803D', letterSpacing: -.5 }}>{affilie.nb_filleuls || invites.length} personnes</p>
          </div>
        </div>
      </div>

      {/* Lien */}
      <div style={{ background: '#fff', borderRadius: 18, padding: '18px', border: '1px solid #F0F0F0', boxShadow: '0 1px 8px rgba(0,0,0,.04)', marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E', marginBottom: 12 }}>🔗 Ton lien de parrainage</p>
        <div style={{ background: '#F8F8FC', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 12, color: '#7F77DD', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lien}</p>
          <button className="sbt" onClick={copierLien}
            style={{ background: copied ? '#1D9E75' : '#7F77DD', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {copied ? '✓ Copié !' : 'Copier'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`https://wa.me/?text=Rejoins%20Dropzi%20avec%20mon%20lien%20!%20${encodeURIComponent(lien)}`} target="_blank" rel="noreferrer"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#25D366', color: '#fff', borderRadius: 12, padding: '10px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            💬 Partager sur WhatsApp
          </a>
          <button className="sbt" onClick={() => navigator.share?.({ title: 'Dropzi', text: 'Rejoins Dropzi !', url: lien }).catch(() => {})}
            style={{ background: '#F8F8FC', border: '1.5px solid #EBEBEB', color: '#555', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 700 }}>
            📤
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, background: '#F0F0F8', borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {[['dashboard','📊 Aperçu'],['invites','👤 Mes contacts'],['retraits','💸 Retraits']].map(([id, label]) => (
          <button key={id} className="sbt" onClick={() => setTab(id as any)}
            style={{ flex: 1, padding: '8px', borderRadius: 11, border: 'none', background: tab === id ? '#fff' : 'transparent', color: tab === id ? '#0C0C1E' : '#888', fontWeight: 700, fontSize: 12, boxShadow: tab === id ? '0 2px 8px rgba(0,0,0,.08)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {/* APERÇU */}
      {tab === 'dashboard' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F5F5F5' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>Dernières commissions</p>
          </div>
          {commissions.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>💰</p>
              <p style={{ fontSize: 14, color: '#C0C0C0' }}>Aucune commission pour l'instant</p>
              <p style={{ fontSize: 12, color: '#C0C0C0', marginTop: 4 }}>Partage ton lien pour commencer à gagner</p>
            </div>
          ) : commissions.slice(0, 10).map((c: any) => (
            <div key={c.id} style={{ padding: '12px 18px', borderBottom: '1px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0FFF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💰</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0C0C1E', marginBottom: 2 }}>{c.profiles?.email || 'Contact'}</p>
                <p style={{ fontSize: 11, color: '#ABABAB' }}>Plan {c.plan} · {new Date(c.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>+{fmt(c.montant)} F</p>
                <p style={{ fontSize: 10, color: '#ABABAB' }}>50% de {fmt(c.montant_abonnement)} F</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MES CONTACTS */}
      {tab === 'invites' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F5F5F5' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>{invites.length} contact{invites.length > 1 ? 's' : ''} inscrit{invites.length > 1 ? 's' : ''} via ton lien</p>
          </div>
          {invites.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>👤</p>
              <p style={{ fontSize: 14, color: '#C0C0C0' }}>Personne n'a encore utilisé ton lien</p>
            </div>
          ) : invites.map((inv: any) => (
            <div key={inv.id} style={{ padding: '12px 18px', borderBottom: '1px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#7F77DD', flexShrink: 0 }}>
                {(inv.profiles?.email || 'C').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0C0C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.profiles?.email || 'Contact'}</p>
                <p style={{ fontSize: 11, color: '#ABABAB' }}>{inv.profiles?.nom_boutique || ''} · Inscrit le {new Date(inv.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div style={{ flexShrink: 0 }}>
                {inv.profiles?.plan && inv.profiles.plan !== 'aucun' ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#E1F5EE', color: '#085041' }}>{inv.profiles.plan}</span>
                ) : (
                  <span style={{ fontSize: 11, color: '#ABABAB' }}>Sans abonnement</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RETRAITS */}
      {tab === 'retraits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: '20px', border: '1px solid #F0F0F0', boxShadow: '0 1px 8px rgba(0,0,0,.04)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0C0C1E', marginBottom: 4 }}>💸 Demander un retrait</p>
            <p style={{ fontSize: 12, color: '#ABABAB', marginBottom: 16 }}>Solde : <strong style={{ color: '#16A34A' }}>{fmt(affilie.solde)} FCFA</strong> · Minimum 5 000 FCFA</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Montant (FCFA)</label>
              <input style={F} type="number" value={montantRetrait} onChange={e => setMontantRetrait(e.target.value)} placeholder="Ex: 10000" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Numéro Wave / Orange Money</label>
              <input style={F} value={numeroWave} onChange={e => setNumeroWave(e.target.value)} placeholder="77 000 00 00" />
            </div>
            <button className="sbt" onClick={demanderRetrait} disabled={submitting || !montantRetrait || !numeroWave || affilie.solde < 5000}
              style={{ width: '100%', background: 'linear-gradient(135deg,#1D9E75,#16A34A)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, opacity: affilie.solde < 5000 ? .5 : 1 }}>
              {submitting ? '⏳ Envoi...' : '💸 Demander le retrait'}
            </button>
          </div>

          {retraits.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F5F5F5' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>Historique des retraits</p>
              </div>
              {retraits.map((r: any) => {
                const cfg = r.statut === 'paye' ? { bg: '#F0FFF4', color: '#16A34A', label: '✅ Payé' }
                  : r.statut === 'approuve' ? { bg: '#EFF6FF', color: '#2563EB', label: '🔄 En cours' }
                  : r.statut === 'refuse' ? { bg: '#FEF2F2', color: '#DC2626', label: '❌ Refusé' }
                  : { bg: '#FFFBEB', color: '#D97706', label: '⏳ En attente' }
                return (
                  <div key={r.id} style={{ padding: '12px 18px', borderBottom: '1px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#0C0C1E' }}>{fmt(r.montant)} FCFA</p>
                      <p style={{ fontSize: 11, color: '#ABABAB' }}>{r.numero_wave} · {new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                      {r.note_admin && <p style={{ fontSize: 11, color: '#7F77DD', marginTop: 2 }}>Note : {r.note_admin}</p>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
