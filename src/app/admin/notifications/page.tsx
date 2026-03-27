'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

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
    if (!confirm('Supprimer cette notification ?')) return
    await supabase.from('notifications_admin').delete().eq('id', id)
    load()
  }

  const typeColor: Record<string, string> = { info: '#7F77DD', warning: '#BA7517', success: '#1D9E75', error: '#E24B4A' }
  const typeIcon: Record<string, string> = { info: 'ℹ️', warning: '⚠️', success: '✅', error: '❌' }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>Notifications</h1>
        <p className="text-gray-500 text-sm mt-1">Envoyer des messages à tous les utilisateurs</p>
      </div>

      {/* Formulaire */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(127,119,221,.25)', borderRadius: 20, padding: 24 }}>
        <h2 className="text-white font-semibold mb-5">📢 Nouvelle notification</h2>
        <div className="space-y-4">
          <div>
            <label style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Titre *</label>
            <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              placeholder="Ex: Nouvelle fonctionnalité disponible !"
              style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Message *</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Contenu de la notification..."
              rows={3}
              style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14 }}>
                <option value="info">ℹ️ Info</option>
                <option value="success">✅ Succès</option>
                <option value="warning">⚠️ Avertissement</option>
                <option value="error">❌ Erreur</option>
              </select>
            </div>
            <div>
              <label style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Destinataires</label>
              <select value={form.cible} onChange={e => setForm(f => ({ ...f, cible: e.target.value }))}
                style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14 }}>
                <option value="tous">👥 Tous les utilisateurs</option>
                <option value="basic">🔵 Plan Basic uniquement</option>
                <option value="business">🟣 Plan Business uniquement</option>
                <option value="elite">🟢 Plan Elite uniquement</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          {form.titre && (
            <div style={{ background: `${typeColor[form.type]}11`, border: `1px solid ${typeColor[form.type]}33`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ color: typeColor[form.type], fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{typeIcon[form.type]} {form.titre}</div>
              <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>{form.message}</div>
              <div style={{ color: '#555', fontSize: 11, marginTop: 8 }}>Pour : {form.cible === 'tous' ? 'Tous les utilisateurs' : `Plan ${form.cible}`}</div>
            </div>
          )}

          <button onClick={envoyer} disabled={saving || !form.titre || !form.message}
            style={{ width: '100%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: saving || !form.titre || !form.message ? 0.5 : 1 }}>
            {saving ? '⏳ Envoi...' : '📢 Envoyer la notification'}
          </button>
        </div>
      </div>

      {/* Historique */}
      <div>
        <h2 className="text-white font-semibold mb-4">Historique des notifications ({notifs.length})</h2>
        {notifs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#444', padding: '40px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16 }}>
            Aucune notification envoyée encore
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map(n => (
              <div key={n.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{typeIcon[n.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{n.titre}</div>
                  <div style={{ color: '#666', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${typeColor[n.type]}22`, color: typeColor[n.type] }}>{n.type.toUpperCase()}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>→ {n.cible === 'tous' ? 'Tous les utilisateurs' : `Plan ${n.cible}`}</span>
                    <span style={{ fontSize: 11, color: '#444' }}>{new Date(n.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
                <button onClick={() => supprimer(n.id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '4px', fontSize: 16, flexShrink: 0 }}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
