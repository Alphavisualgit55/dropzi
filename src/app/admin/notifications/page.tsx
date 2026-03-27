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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ titre: '', message: '', type: 'info', cible: 'tous' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('notifications_admin').select('*').order('created_at', { ascending: false })
    setNotifs(data || [])
    setLoading(false)
  }

  async function envoyer() {
    if (!form.titre || !form.message) return
    setSaving(true)
    await supabase.from('notifications_admin').insert(form)
    setForm({ titre: '', message: '', type: 'info', cible: 'tous' })
    setSaving(false)
    load()
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer ?')) return
    await supabase.from('notifications_admin').delete().eq('id', id)
    load()
  }

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.1em', display: 'block', marginBottom: 6 }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -.5 }}>Notifications</h1>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, marginTop: 4 }}>Envoyer des messages à vos utilisateurs</p>
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
                <option value="tous">👥 Tous les utilisateurs</option>
                <option value="basic">Plan Basic</option>
                <option value="business">Plan Business</option>
                <option value="elite">Plan Elite</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          {form.titre && (
            <div style={{ background: TYPE_CONFIG[form.type].bg, border: `1px solid ${TYPE_CONFIG[form.type].color}44`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ color: TYPE_CONFIG[form.type].color, fontWeight: 700, fontSize: 14, marginBottom: 5 }}>
                {TYPE_CONFIG[form.type].icon} {form.titre}
              </div>
              {form.message && <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, lineHeight: 1.6 }}>{form.message}</div>}
              <div style={{ color: 'rgba(255,255,255,.25)', fontSize: 11, marginTop: 8 }}>
                → {form.cible === 'tous' ? 'Tous les utilisateurs' : `Plan ${form.cible}`}
              </div>
            </div>
          )}

          <button onClick={envoyer} disabled={saving || !form.titre || !form.message} style={{
            background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none',
            borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', opacity: saving || !form.titre || !form.message ? 0.5 : 1,
            boxShadow: '0 0 20px rgba(127,119,221,.25)'
          }}>
            {saving ? '⏳ Envoi en cours...' : '📢 Envoyer la notification'}
          </button>
        </div>
      </div>

      {/* Historique */}
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'rgba(255,255,255,.8)' }}>
        Historique — {notifs.length} notification{notifs.length > 1 ? 's' : ''}
      </div>

      {notifs.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: 13 }}>
          Aucune notification envoyée
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifs.map(n => (
            <div key={n.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_CONFIG[n.type]?.icon || 'ℹ️'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{n.titre}</div>
                <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: TYPE_CONFIG[n.type]?.bg, color: TYPE_CONFIG[n.type]?.color }}>
                    {n.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>→ {n.cible === 'tous' ? 'Tous' : `Plan ${n.cible}`}</span>
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
