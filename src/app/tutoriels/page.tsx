'use client'
import { useState } from 'react'
import Link from 'next/link'

const VIDEOS = [
  {
    id: 1,
    embed: 'https://drive.google.com/file/d/11mtrpIoHoeKDQU2wQ4FZ1_R-1KSbf60X/preview',
    titre: 'Configuration complète',
    sousTitre: 'Démarrer avec Dropzi',
    duree: '~10 min',
    niveau: 'Débutant',
    couleur: '#7F77DD',
    bg: '#EEEDFE',
    emoji: '🚀',
    description: 'Configure ton compte Dropzi de A à Z. Zones, produits, livreurs et première commande.',
    points: [
      'Créer et configurer ton compte',
      'Ajouter tes zones de livraison',
      'Importer tes produits',
      'Créer ta première commande',
      'Lire ton bénéfice en temps réel',
    ]
  },
  {
    id: 2,
    embed: 'https://drive.google.com/file/d/1GB9DGAubo0dQbybwL-q8gdzNPjVRqYUR/preview',
    titre: 'Sync Google Sheet',
    sousTitre: 'Fonctionnalité ultime',
    duree: '~8 min',
    niveau: 'Intermédiaire',
    couleur: '#1D9E75',
    bg: '#E1F5EE',
    emoji: '⚡',
    description: 'Connecte Easy Sell / Shopify à Dropzi. Les commandes s\'importent automatiquement.',
    points: [
      'Publier ton Google Sheet en CSV',
      'Connecter Easy Sell à Dropzi',
      'Activer la synchronisation auto',
      'Recevoir les notifications',
      'Gérer les commandes importées',
    ]
  }
]

export default function TutorielsPage() {
  const [actif, setActif] = useState(0)
  const [termines, setTermines] = useState<number[]>([])
  const video = VIDEOS[actif]

  function marquerTermine(idx: number) {
    if (!termines.includes(idx)) setTermines(t => [...t, idx])
  }

  const progression = Math.round((termines.length / VIDEOS.length) * 100)

  return (
    <div style={{ minHeight: '100vh', background: '#06060F', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color: '#fff' }}>

      {/* NAV mobile-first */}
      <nav style={{ background: 'rgba(6,6,15,.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="2"/></svg>
          </div>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 800, letterSpacing: -.5 }}>Dropzi</span>
          <span style={{ background: 'rgba(127,119,221,.2)', color: '#AFA9EC', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Formation</span>
        </Link>
        <Link href="/login" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          Démarrer →
        </Link>
      </nav>

      {/* PROGRESSION */}
      <div style={{ background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '12px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>Ta progression</span>
            <span style={{ fontSize: 12, color: '#7F77DD', fontWeight: 700 }}>{termines.length}/{VIDEOS.length} vidéos · {progression}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${progression}%`, height: '100%', background: 'linear-gradient(90deg,#7F77DD,#1D9E75)', borderRadius: 8, transition: 'width .5s ease' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 80px' }}>

        {/* LECTEUR PRINCIPAL */}
        <div style={{ background: '#000', position: 'relative' }}>
          <div style={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              key={video.id}
              src={video.embed}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay"
              allowFullScreen
            />
          </div>
          {/* Badge sur le lecteur */}
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{video.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Vidéo {actif + 1}/{VIDEOS.length}</span>
          </div>
        </div>

        {/* INFOS VIDÉO */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: video.couleur, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>{video.sousTitre}</p>
              <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -.5, lineHeight: 1.2, marginBottom: 6 }}>{video.titre}</h1>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', gap: 4 }}>⏱ {video.duree}</span>
                <span style={{ background: video.bg + '33', color: video.couleur, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{video.niveau}</span>
              </div>
            </div>
            <button onClick={() => marquerTermine(actif)} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all .2s',
              background: termines.includes(actif) ? '#1D9E75' : 'rgba(255,255,255,.08)',
              color: termines.includes(actif) ? '#fff' : 'rgba(255,255,255,.5)',
            }}>
              {termines.includes(actif) ? '✓ Terminé' : 'Marquer terminé'}
            </button>
          </div>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: 16 }}>{video.description}</p>

          {/* Points clés */}
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, border: '1px solid rgba(255,255,255,.07)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Ce que tu vas apprendre</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {video.points.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: video.bg + '33', border: `1.5px solid ${video.couleur}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: video.couleur, flexShrink: 0, marginTop: 1, fontWeight: 700 }}>✓</div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.4 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NAVIGATION VIDÉOS */}
        <div style={{ padding: '0 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Toutes les vidéos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {VIDEOS.map((v, i) => (
              <button key={v.id} onClick={() => setActif(i)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', transition: 'all .15s', textAlign: 'left', border: 'none',
                background: actif === i ? 'rgba(127,119,221,.12)' : 'rgba(255,255,255,.03)',
                outline: actif === i ? '1.5px solid rgba(127,119,221,.4)' : '1px solid rgba(255,255,255,.06)',
              }}>
                {/* Icône */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: termines.includes(i) ? 'rgba(29,158,117,.2)' : v.bg + '22', border: `1.5px solid ${termines.includes(i) ? '#1D9E75' : v.couleur + '44'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {termines.includes(i) ? '✅' : v.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: actif === i ? '#fff' : 'rgba(255,255,255,.7)' }}>Vidéo {v.id} — {v.titre}</span>
                    {actif === i && <span style={{ background: v.couleur, color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>EN COURS</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{v.duree}</span>
                    <span style={{ fontSize: 11, color: termines.includes(i) ? '#1D9E75' : 'rgba(255,255,255,.25)' }}>{termines.includes(i) ? '✓ Terminé' : v.niveau}</span>
                  </div>
                </div>
                <div style={{ fontSize: 16, color: actif === i ? '#7F77DD' : 'rgba(255,255,255,.15)', flexShrink: 0 }}>▶</div>
              </button>
            ))}
          </div>
        </div>

        {/* BOUTONS NAVIGATION */}
        <div style={{ padding: '0 16px', display: 'flex', gap: 10 }}>
          {actif > 0 && (
            <button onClick={() => setActif(a => a - 1)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              ← Vidéo précédente
            </button>
          )}
          {actif < VIDEOS.length - 1 ? (
            <button onClick={() => { marquerTermine(actif); setActif(a => a + 1) }} style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(127,119,221,.3)' }}>
              Vidéo suivante →
            </button>
          ) : (
            <Link href="/login" style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#1D9E75,#0F6E56)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'block', boxShadow: '0 4px 20px rgba(29,158,117,.3)' }}>
              🎉 Commencer sur Dropzi →
            </Link>
          )}
        </div>

        {/* CTA FINAL si tout terminé */}
        {termines.length === VIDEOS.length && (
          <div style={{ margin: '16px 16px 0', background: 'linear-gradient(135deg,rgba(29,158,117,.15),rgba(127,119,221,.1))', border: '1px solid rgba(29,158,117,.3)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>🎉</p>
            <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Formation complète !</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 16 }}>Tu maîtrises Dropzi. Lance-toi maintenant.</p>
            <Link href="/login" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Créer mon compte gratuit →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
