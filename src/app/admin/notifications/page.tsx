'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  info:    { color: '#7F77DD', bg: 'rgba(127,119,221,.1)', icon: 'ℹ️' },
  success: { color: '#1D9E75', bg: 'rgba(29,158,117,.1)', icon: '✅' },
  warning: { color: '#BA7517', bg: 'rgba(186,117,23,.1)', icon: '⚠️' },
  error:   { color: '#E24B4A', bg: 'rgba(226,75,74,.1)', icon: '❌' },
}

export default function AdminNotificationsPage() {
  const supabase = createClient()
  const [notifs, setNotifs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ total: 0, lues: 0, nonLues: 0 })
  const [form, setForm] = useState({
    titre: '', message: '', type: 'info', cible: 'tous', user_id_specifique: ''
  })

  useEffect(() => { load() }, [])

  async function load() {
    const [n, u, lues, nonLues, total] = await Promise.all([
      supabase.from('notifications_admin').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, nom_boutique, email, plan').order('nom_boutique'),
      supabase.from('notifications_user').select('*', { count: 'exact', head: true }).eq('lu', true),
      supabase.from('notifications_user').select('*', { count: 'exact', head: true }).eq('lu', false),
      supabase.from('notifications_user').select('*', { count: 'exact', head: true }),
    ])
    setNotifs(n.data || [])
    setUsers(u.data || [])
    setStats({ total: total.count || 0, lues: lues.count || 0, nonLues: nonLues.count || 0 })
    setLoading(false)
  }

  async function envoyer() {
    if (!form.titre || !form.message) return
    setSaving(true)

    // Sauvegarder dans notifications_admin (historique)
    await supabase.from('notifications_admin').insert({
      titre: form.titre, message: form.message,
      type: form.type, cible: form.cible
    })

    // Envoyer aux utilisateurs concernés dans notifications_user
    let usersToNotify: any[] = []

    if (form.cible === 'tous') {
      usersToNotify = users
    } else if (form.cible === 'user_specifique' && form.user_id_specifique) {
      usersToNotify = users.filter(u => u.id === form.user_id_specifique)
    } else {
      usersToNotify = users.filter(u => u.plan === form.cible)
    }

    if (usersToNotify.length > 0) {
      await supabase.from('notifications_user').insert(
        usersToNotify.map(u => ({
          user_id: u.id,
          titre: form.titre,
          message: form.message,
          type: form.type,
          lu: false,
        }))
      )
    }

    setForm({ titre: '', message: '', type: 'info', cible: 'tous', user_id_specifique: '' })
    setSaving(false)
    load()
    alert(`✅ Notification envoyée à ${usersToNotify.length} utilisateur${usersToNotify.length > 1 ? 's' : ''} !`)
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer ?')) return
    await supabase.from('notifications_admin').delete().eq('id', id)
    load()
  }

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.1em', display: 'block', marginBottom: 6 }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /></div>

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -.5 }}>Notifications</h1>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, marginTop: 4 }}>Envoyer des messages à vos utilisateurs</p>
      </div>

      {/* Stats notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total envoyées', v: stats.total, c: '#7F77DD' },
          { l: 'Lues', v: stats.lues, c: '#1D9E75' },
          { l: 'Non lues', v: stats.nonLues, c: '#E24B4A' },
        ].map(s => (
          <div key={s.l} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 16 }}>
            <div style={{ color: s.c, fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>{s.v}</div>
            <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      <div style={{ background: 'rgba(127,119,221,.05)', border: '1px solid rgba(127,119,221,.2)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>📢 Nouvelle notification</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Titre *</label>
            <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              placeholder="Ex : Nouvelle fonctionnalité disponible !" style={inp} />
          </div>
          <div>
            <label style={lbl}>Message *</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Contenu de la notification..." rows={3}
              style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                <option value="info">ℹ️ Info</option>
                <option value="success">✅ Succès</option>
                <option value="warning">⚠️ Avertissement</option>
                <option value="error">❌ Erreur</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Destinataires</label>
              <select value={form.cible} onChange={e => setForm(f => ({ ...f, cible: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                <option value="tous">👥 Tous les utilisateurs ({users.length})</option>
                <option value="basic">Plan Basic ({users.filter(u => u.plan === 'basic').length})</option>
                <option value="business">Plan Business ({users.filter(u => u.plan === 'business').length})</option>
                <option value="elite">Plan Elite ({users.filter(u => u.plan === 'elite').length})</option>
                <option value="user_specifique">👤 Utilisateur spécifique</option>
              </select>
            </div>
          </div>

          {/* Sélection utilisateur spécifique */}
          {form.cible === 'user_specifique' && (
            <div>
              <label style={lbl}>Choisir l'utilisateur</label>
              <select value={form.user_id_specifique} onChange={e => setForm(f => ({ ...f, user_id_specifique: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Sélectionner...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.nom_boutique || u.email} ({u.plan})</option>)}
              </select>
            </div>
          )}

          {/* Preview */}
          {form.titre && (
            <div style={{ background: TYPE_CONFIG[form.type].bg, border: `1px solid ${TYPE_CONFIG[form.type].color}44`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ color: TYPE_CONFIG[form.type].color, fontWeight: 700, fontSize: 14, marginBottom: 5 }}>
                {TYPE_CONFIG[form.type].icon} {form.titre}
              </div>
              {form.message && <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, lineHeight: 1.6 }}>{form.message}</div>}
              <div style={{ color: 'rgba(255,255,255,.25)', fontSize: 11, marginTop: 8 }}>
                → {form.cible === 'tous' ? `Tous les ${users.length} utilisateurs` : form.cible === 'user_specifique' ? users.find(u => u.id === form.user_id_specifique)?.email || 'Utilisateur sélectionné' : `Plan ${form.cible} (${users.filter(u => u.plan === form.cible).length} users)`}
              </div>
            </div>
          )}

          <button onClick={envoyer} disabled={saving || !form.titre || !form.message} style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving || !form.titre || !form.message ? 0.5 : 1, boxShadow: '0 0 20px rgba(127,119,221,.25)' }}>
            {saving ? '⏳ Envoi...' : '📢 Envoyer la notification'}
          </button>
        </div>
      </div>

      {/* Historique */}
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'rgba(255,255,255,.8)' }}>
        Historique — {notifs.length} notification{notifs.length > 1 ? 's' : ''}
      </div>
      {notifs.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: 13 }}>Aucune notification envoyée</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifs.map((n: any) => (
            <div key={n.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_CONFIG[n.type]?.icon || 'ℹ️'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{n.titre}</div>
                <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: TYPE_CONFIG[n.type]?.bg, color: TYPE_CONFIG[n.type]?.color }}>{n.type.toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>→ {n.cible === 'tous' ? 'Tous les utilisateurs' : `Plan ${n.cible}`}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.2)' }}>{new Date(n.created_at).toLocaleString('fr-FR')}</span>
                </div>
              </div>
              <button onClick={() => supprimer(n.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.2)', cursor: 'pointer', padding: 4, fontSize: 16, flexShrink: 0 }}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
