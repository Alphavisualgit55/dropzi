'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [count1, setCount1] = useState(0)
  const [count2, setCount2] = useState(0)
  const [count3, setCount3] = useState(0)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const [activeFeature, setActiveFeature] = useState(0)
  const [typed, setTyped] = useState('')
  const words = ['Livrez.', 'Encaissez.', 'Gérez.', 'Grandissez.']
  const [wordIdx, setWordIdx] = useState(0)

  useEffect(() => {
    const h = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    let i = 0, deleting = false
    let word = words[wordIdx]
    const interval = setInterval(() => {
      if (!deleting) {
        i++; setTyped(word.slice(0, i))
        if (i === word.length) { deleting = true }
      } else {
        i--; setTyped(word.slice(0, i))
        if (i === 0) { deleting = false; setWordIdx(w => (w + 1) % words.length); clearInterval(interval) }
      }
    }, deleting ? 55 : 95)
    return () => clearInterval(interval)
  }, [wordIdx])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect() } }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!statsVisible) return
    let step = 0
    const t = setInterval(() => {
      step++; const p = 1 - Math.pow(1 - step / 60, 3)
      setCount1(Math.round(p * 500)); setCount2(Math.round(p * 24)); setCount3(Math.round(p * 98))
      if (step >= 60) clearInterval(t)
    }, 33)
    return () => clearInterval(t)
  }, [statsVisible])

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(f => (f + 1) % 6), 3000)
    return () => clearInterval(t)
  }, [])

  const features = [
    { icon: '⚡', title: 'Commande en 10 secondes', desc: 'Téléphone + produit + zone. C\'est tout. Zéro paperasse, zéro perte de temps.' },
    { icon: '💰', title: 'Bénéfice en temps réel', desc: 'Combien j\'ai gagné aujourd\'hui ? La réponse est là, maintenant, précise.' },
    { icon: '📦', title: 'Stock automatique', desc: 'Livraison confirmée → stock mis à jour automatiquement. Zéro effort humain.' },
    { icon: '📊', title: 'Rapport WhatsApp', desc: 'Rapport complet généré en 1 clic. Tu cliques Copier. Tu colles. Envoyé.' },
    { icon: '🗺️', title: 'Zones intelligentes', desc: 'Chaque zone a son coût de livraison. Chaque livreur a sa zone. Automatique.' },
    { icon: '📈', title: 'Bilans & historique', desc: 'Historique complet. Bilans hebdo & mensuel. Décisions basées sur vrais chiffres.' },
  ]

  return (
    <div style={{ fontFamily: '"Syne", system-ui, sans-serif', background: '#050510', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        *{box-sizing:border-box;}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes up{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.05)}}
        .u1{animation:up .8s ease both}
        .u2{animation:up .8s .15s ease both}
        .u3{animation:up .8s .3s ease both}
        .u4{animation:up .8s .45s ease both}
        .shimmer{background:linear-gradient(90deg,#fff 0%,#7F77DD 25%,#fff 50%,#C0BCFF 75%,#fff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}
        .cursor{display:inline-block;width:3px;height:.85em;background:#7F77DD;margin-left:3px;animation:blink 1s infinite;vertical-align:-.1em;border-radius:2px}
        .hover-card{transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}
        .hover-card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(127,119,221,.2)}
        .btn-shine{position:relative;overflow:hidden}
        .btn-shine::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.12) 50%,transparent 65%);transform:translateX(-100%);transition:transform .5s ease}
        .btn-shine:hover::after{transform:translateX(100%)}
        .grid-lines{background-image:linear-gradient(rgba(127,119,221,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(127,119,221,.04) 1px,transparent 1px);background-size:64px 64px}
      `}</style>

      {/* NAV */}
      <nav style={{
        position:'fixed',top:0,left:0,right:0,zIndex:200,
        padding:'0 6vw',height:68,display:'flex',alignItems:'center',justifyContent:'space-between',
        background: scrollY > 40 ? 'rgba(5,5,16,.92)' : 'transparent',
        backdropFilter: scrollY > 40 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 40 ? '1px solid rgba(127,119,221,.12)' : 'none',
        transition:'all .3s ease'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:38,height:38,borderRadius:11,background:'linear-gradient(135deg,#7F77DD,#534AB7)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 18px rgba(127,119,221,.5)'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <span style={{fontSize:22,fontWeight:800,letterSpacing:-1}}>Dropzi</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:28}}>
          <a href="#features" style={{color:'rgba(255,255,255,.4)',fontSize:14,textDecoration:'none'}}>Fonctionnalités</a>
          <a href="#tarifs" style={{color:'rgba(255,255,255,.4)',fontSize:14,textDecoration:'none'}}>Tarifs</a>
          <Link href="/login" style={{color:'rgba(255,255,255,.6)',fontSize:14,textDecoration:'none'}}>Connexion</Link>
          <Link href="/login" className="btn-shine" style={{background:'linear-gradient(135deg,#7F77DD,#534AB7)',color:'#fff',padding:'9px 22px',borderRadius:11,fontSize:14,fontWeight:700,textDecoration:'none',boxShadow:'0 0 18px rgba(127,119,221,.35)'}}>Démarrer →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="grid-lines" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'120px 6vw 80px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'15%',left:'5%',width:500,height:500,background:'radial-gradient(circle,rgba(127,119,221,.13) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'10%',right:'5%',width:600,height:600,background:'radial-gradient(circle,rgba(29,158,117,.08) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'35%',right:'12%',width:64,height:64,borderRadius:'50%',border:'1px solid rgba(127,119,221,.2)',background:'rgba(127,119,221,.05)',animation:'float 6s ease-in-out infinite'}}/>
        <div style={{position:'absolute',top:'65%',left:'8%',width:40,height:40,borderRadius:'50%',border:'1px solid rgba(29,158,117,.2)',background:'rgba(29,158,117,.05)',animation:'float 5s ease-in-out 1.5s infinite'}}/>

        <div style={{maxWidth:920,textAlign:'center',position:'relative',zIndex:1}}>
          <div className="u1" style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(127,119,221,.1)',border:'1px solid rgba(127,119,221,.2)',borderRadius:100,padding:'5px 18px',marginBottom:36}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#1D9E75',display:'inline-block',boxShadow:'0 0 8px #1D9E75',animation:'pulse 2s infinite'}}/>
            <span style={{color:'#AFA9EC',fontSize:13,fontWeight:500}}>Le SaaS e-commerce fait pour l'Afrique 🌍</span>
          </div>

          <h1 className="u2" style={{fontSize:'clamp(52px,9vw,104px)',fontWeight:800,lineHeight:1.0,letterSpacing:-4,marginBottom:20}}>
            Vends plus.<br/>
            <span className="shimmer">{typed}</span><span className="cursor"/>
          </h1>

          <p className="u3" style={{fontSize:'clamp(16px,1.8vw,20px)',color:'rgba(255,255,255,.4)',maxWidth:540,margin:'0 auto 52px',lineHeight:1.75,fontFamily:'DM Sans, sans-serif',fontWeight:300}}>
            Tes concurrents utilisent encore Excel et les notes papier.<br/>Toi, tu gères tout depuis ton téléphone — en 10 secondes par commande.
          </p>

          <div className="u4" style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:48}}>
            <Link href="/login" className="btn-shine" style={{background:'linear-gradient(135deg,#7F77DD,#534AB7)',color:'#fff',padding:'18px 38px',borderRadius:16,fontSize:16,fontWeight:700,textDecoration:'none',boxShadow:'0 0 48px rgba(127,119,221,.45)',letterSpacing:-.3}}>
              Essayer gratuitement 7 jours →
            </Link>
            <a href="#features" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.65)',padding:'18px 38px',borderRadius:16,fontSize:16,fontWeight:500,textDecoration:'none'}}>
              Voir comment ça marche
            </a>
          </div>

          <div style={{display:'flex',gap:28,justifyContent:'center',flexWrap:'wrap'}}>
            {['✓ 7 jours gratuits','✓ Aucune carte requise','✓ Annulation à tout moment'].map(t=>(
              <span key={t} style={{color:'rgba(255,255,255,.3)',fontSize:13}}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section ref={statsRef} style={{padding:'80px 6vw',borderTop:'1px solid rgba(255,255,255,.05)'}}>
        <div style={{maxWidth:860,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2}}>
          {[[count1+'+','Commerçants actifs','en Afrique de l\'Ouest'],[count2+'M+ FCFA','gérés chaque jour','transactions sur la plateforme'],[count3+'%','gain de temps moyen','versus Excel et papier']].map(([v,l,s],i)=>(
            <div key={i} style={{textAlign:'center',padding:'40px 16px',borderRight:i<2?'1px solid rgba(255,255,255,.06)':'none'}}>
              <div style={{fontSize:'clamp(36px,5vw,60px)',fontWeight:800,color:'#7F77DD',lineHeight:1,letterSpacing:-2}}>{v}</div>
              <div style={{color:'#fff',fontSize:15,fontWeight:600,marginTop:10}}>{l}</div>
              <div style={{color:'rgba(255,255,255,.25)',fontSize:12,marginTop:4}}>{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{padding:'100px 6vw',background:'rgba(127,119,221,.025)',borderTop:'1px solid rgba(255,255,255,.05)'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:60}}>
            <p style={{color:'#7F77DD',fontSize:12,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',marginBottom:14}}>Le vrai problème</p>
            <h2 style={{fontSize:'clamp(30px,5vw,56px)',fontWeight:800,letterSpacing:-2,lineHeight:1.05}}>
              Combien d'argent tu perds<br/>à cause du désordre ?
            </h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
            {[
              {e:'😩',t:'Notes papier perdues',d:'Commande prise à la main. Client qui rappelle. Introuvable. Conflit.'},
              {e:'📊',t:'Excel qui ment',d:'Formules cassées. Bénéfice faux. Tu crois gagner mais tu perds.'},
              {e:'⏰',t:'2h de saisie le soir',d:'Recopier les commandes du jour à 22h au lieu de te reposer.'},
              {e:'😤',t:'Stock invisible',d:'Tu vends un produit épuisé. Client furieux. Remboursement. Mauvaise réputation.'},
            ].map(p=>(
              <div key={p.t} className="hover-card" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',borderRadius:18,padding:26}}>
                <div style={{fontSize:36,marginBottom:14}}>{p.e}</div>
                <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{p.t}</div>
                <div style={{color:'rgba(255,255,255,.35)',fontSize:13,lineHeight:1.65}}>{p.d}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:44}}>
            <div style={{display:'inline-block',background:'rgba(127,119,221,.1)',border:'1px solid rgba(127,119,221,.2)',borderRadius:12,padding:'14px 28px'}}>
              <span style={{color:'#AFA9EC',fontSize:17,fontWeight:600}}>Dropzi règle tout ça. En moins de 5 minutes.</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{padding:'100px 6vw'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:60}}>
            <p style={{color:'#7F77DD',fontSize:12,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',marginBottom:14}}>Fonctionnalités</p>
            <h2 style={{fontSize:'clamp(30px,5vw,56px)',fontWeight:800,letterSpacing:-2,lineHeight:1.05}}>Tout ce qu'il te faut.<br/>Rien de superflu.</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14}}>
            {features.map((f,i)=>(
              <div key={i} className="hover-card" onClick={()=>setActiveFeature(i)} style={{
                background:activeFeature===i?'rgba(127,119,221,.1)':'rgba(255,255,255,.02)',
                border:`1px solid ${activeFeature===i?'rgba(127,119,221,.4)':'rgba(255,255,255,.06)'}`,
                borderRadius:20,padding:28,cursor:'pointer',transition:'all .3s ease'
              }}>
                <div style={{fontSize:38,marginBottom:14}}>{f.icon}</div>
                <div style={{fontSize:17,fontWeight:700,marginBottom:8,letterSpacing:-.3}}>{f.title}</div>
                <div style={{color:'rgba(255,255,255,.4)',fontSize:14,lineHeight:1.7}}>{f.desc}</div>
                {activeFeature===i&&<div style={{marginTop:14,color:'#7F77DD',fontSize:12,fontWeight:600}}>✓ Inclus dans tous les plans</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RAPPORT SECTION */}
      <section style={{padding:'100px 6vw',background:'rgba(127,119,221,.025)',borderTop:'1px solid rgba(255,255,255,.05)'}}>
        <div style={{maxWidth:1000,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:56,alignItems:'center'}}>
          <div>
            <p style={{color:'#25D366',fontSize:12,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',marginBottom:14}}>📊 Rapport WhatsApp</p>
            <h2 style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,letterSpacing:-2,lineHeight:1.05,marginBottom:20}}>Ton rapport du jour,<br/>en 1 clic.</h2>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:15,lineHeight:1.8,marginBottom:32,fontFamily:'DM Sans,sans-serif'}}>Dropzi génère un rapport complet — CA, bénéfice net, dépenses pub, détail par livraison. Clique Copier. Colle sur WhatsApp. En 10 secondes.</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {['Rapport journalier avec historique sauvegardé','Bilan hebdomadaire & mensuel automatique','Dépenses pub et achat déduites du bénéfice','Copier-coller WhatsApp formaté en 1 clic'].map(f=>(
                <div key={f} style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{width:18,height:18,borderRadius:'50%',background:'rgba(37,211,102,.15)',border:'1px solid #25D366',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#25D366',flexShrink:0}}>✓</span>
                  <span style={{color:'rgba(255,255,255,.55)',fontSize:14}}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mock rapport */}
          <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:20,overflow:'hidden'}}>
            <div style={{background:'linear-gradient(135deg,#1a1a3e,#2D2A6E)',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:30,height:30,background:'#7F77DD',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14}}>D</div>
                <div><div style={{fontSize:14,fontWeight:700}}>Ma Boutique</div><div style={{color:'rgba(255,255,255,.35)',fontSize:11}}>RAPPORT JOURNALIER</div></div>
              </div>
              <span style={{color:'rgba(255,255,255,.35)',fontSize:12}}>Vendredi 27 mars</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
              {[['CA','310 000','FCFA'],['Livrées','24','commandes'],['Bénéfice','87 500','FCFA']].map(([l,v,u])=>(
                <div key={l} style={{padding:'16px 10px',textAlign:'center',borderRight:'1px solid rgba(255,255,255,.06)'}}>
                  <div style={{color:'rgba(255,255,255,.3)',fontSize:10,textTransform:'uppercase',letterSpacing:'.1em'}}>{l}</div>
                  <div style={{color:'#7F77DD',fontSize:22,fontWeight:800,letterSpacing:-1,margin:'4px 0'}}>{v}</div>
                  <div style={{color:'rgba(255,255,255,.25)',fontSize:10}}>{u}</div>
                </div>
              ))}
            </div>
            <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:8}}>
              {[['Fatou D. · Plateau','25 000 F','+8 500 F'],['Moussa S. · Pikine','18 000 F','+6 200 F'],['Aissatou B. · Médina','12 000 F','+4 100 F']].map(([n,c,b])=>(
                <div key={n} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(255,255,255,.03)',borderRadius:10}}>
                  <span style={{color:'rgba(255,255,255,.45)',fontSize:13}}>{n}</span>
                  <div><span style={{fontSize:13,fontWeight:600}}>{c}</span><span style={{color:'#1D9E75',fontSize:12,marginLeft:8}}>{b}</span></div>
                </div>
              ))}
              <div style={{background:'rgba(255,80,80,.08)',border:'1px solid rgba(255,100,100,.15)',borderRadius:10,padding:'8px 12px',display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'rgba(255,255,255,.4)',fontSize:13}}>📢 Pub Facebook</span>
                <span style={{color:'#F09595',fontSize:13,fontWeight:500}}>-15 000 F</span>
              </div>
            </div>
            <div style={{margin:'0 16px',background:'rgba(0,0,0,.3)',borderRadius:12,padding:'14px 16px',marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{color:'rgba(255,255,255,.4)',fontSize:12}}>Bénéfice brut</span>
                <span style={{fontSize:12,fontWeight:500}}>87 500 F</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{color:'rgba(255,255,255,.4)',fontSize:12}}>Dépenses pub</span>
                <span style={{color:'#F09595',fontSize:12,fontWeight:500}}>-15 000 F</span>
              </div>
              <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:8,display:'flex',justifyContent:'space-between'}}>
                <span style={{fontWeight:700,fontSize:13}}>✅ Bénéfice NET</span>
                <span style={{color:'#9FE1CB',fontSize:18,fontWeight:800}}>72 500 F</span>
              </div>
            </div>
            <div style={{padding:'0 16px 16px'}}>
              <div style={{background:'#25D366',borderRadius:12,padding:'13px',textAlign:'center',fontSize:15,fontWeight:700,cursor:'pointer'}}>
                📋 Copier pour WhatsApp
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{padding:'100px 6vw'}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:60}}>
            <h2 style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,letterSpacing:-2,lineHeight:1.05}}>Ils ont testé. Ils sont restés.</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
            {[
              {n:'Aminata D.',r:'Boutique mode, Dakar',t:'Avant je perdais 2h par jour sur Excel. Maintenant mon rapport WhatsApp est prêt en 30 secondes.',a:'AD'},
              {n:'Moussa K.',r:'Dropshipper, Abidjan',t:'Je gère 80 commandes par semaine depuis mon téléphone. Dropzi a tout changé pour moi.',a:'MK'},
              {n:'Fatou S.',r:'E-commerce, Dakar',t:'Le calcul du bénéfice net avec les dépenses pub — enfin je sais vraiment combien je gagne.',a:'FS'},
            ].map(t=>(
              <div key={t.n} className="hover-card" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',borderRadius:20,padding:28}}>
                <div style={{color:'#7F77DD',fontSize:40,fontFamily:'Georgia,serif',lineHeight:.8,marginBottom:14}}>"</div>
                <p style={{color:'rgba(255,255,255,.6)',fontSize:14,lineHeight:1.75,marginBottom:20}}>{t.t}</p>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#7F77DD,#534AB7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800}}>{t.a}</div>
                  <div><div style={{fontSize:14,fontWeight:600}}>{t.n}</div><div style={{color:'rgba(255,255,255,.3)',fontSize:12}}>{t.r}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="tarifs" style={{padding:'100px 6vw',background:'rgba(127,119,221,.025)',borderTop:'1px solid rgba(255,255,255,.05)'}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:60}}>
            <p style={{color:'#7F77DD',fontSize:12,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',marginBottom:14}}>Tarifs</p>
            <h2 style={{fontSize:'clamp(30px,5vw,56px)',fontWeight:800,letterSpacing:-2,lineHeight:1.05}}>Simple. Transparent. Africain.</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16}}>
            {[
              {name:'Basic',price:'3 000',c:'rgba(255,255,255,.5)',features:['20 produits max','Commandes illimitées','Rapport journalier','1 utilisateur','Stock simple']},
              {name:'Business',price:'5 000',c:'#AFA9EC',hot:true,features:['Produits illimités','Stock multi-zones','Rapport WhatsApp','Historique & bilans','Dépenses & pub','Livreurs par zone','Commandes rapides']},
              {name:'Elite',price:'15 000',c:'#9FE1CB',features:['Tout Business +','Multi-utilisateurs','Export Excel/PDF','Support prioritaire','Branding custom']},
            ].map(p=>(
              <div key={p.name} className="hover-card" style={{background:p.hot?'rgba(127,119,221,.1)':'rgba(255,255,255,.02)',border:`1px solid ${p.hot?'rgba(127,119,221,.4)':'rgba(255,255,255,.07)'}`,borderRadius:20,padding:32,position:'relative'}}>
                {p.hot&&<div style={{position:'absolute',top:-13,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#7F77DD,#534AB7)',fontSize:11,fontWeight:700,padding:'3px 16px',borderRadius:100,whiteSpace:'nowrap',boxShadow:'0 0 18px rgba(127,119,221,.4)'}}>⭐ RECOMMANDÉ</div>}
                <div style={{fontSize:15,fontWeight:700,color:p.c,marginBottom:8}}>{p.name}</div>
                <div style={{fontSize:'clamp(28px,3.5vw,44px)',fontWeight:800,letterSpacing:-2,lineHeight:1}}>{p.price}<span style={{fontSize:13,fontWeight:400,color:'rgba(255,255,255,.35)'}}> FCFA/mois</span></div>
                <div style={{margin:'24px 0',display:'flex',flexDirection:'column',gap:9}}>
                  {p.features.map(f=>(
                    <div key={f} style={{display:'flex',gap:10,alignItems:'center'}}>
                      <span style={{color:p.hot?'#AFA9EC':'rgba(255,255,255,.25)',fontSize:13}}>✓</span>
                      <span style={{color:'rgba(255,255,255,.55)',fontSize:14}}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" style={{display:'block',padding:'13px',borderRadius:12,textAlign:'center',background:p.hot?'linear-gradient(135deg,#7F77DD,#534AB7)':'rgba(255,255,255,.06)',color:'#fff',textDecoration:'none',fontSize:14,fontWeight:700,boxShadow:p.hot?'0 0 20px rgba(127,119,221,.3)':'none'}}>
                  Démarrer →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding:'120px 6vw',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:700,height:700,background:'radial-gradient(circle,rgba(127,119,221,.1) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1,maxWidth:680,margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(36px,6vw,72px)',fontWeight:800,letterSpacing:-3,lineHeight:.95,marginBottom:24}}>
            Ton business mérite<br/><span style={{color:'#7F77DD'}}>mieux qu'Excel.</span>
          </h2>
          <p style={{color:'rgba(255,255,255,.35)',fontSize:18,marginBottom:48,lineHeight:1.6,fontFamily:'DM Sans,sans-serif'}}>7 jours gratuits. Accès complet. Aucune carte bancaire.</p>
          <Link href="/login" className="btn-shine" style={{background:'linear-gradient(135deg,#7F77DD,#534AB7)',color:'#fff',padding:'20px 52px',borderRadius:16,fontSize:18,fontWeight:700,textDecoration:'none',boxShadow:'0 0 60px rgba(127,119,221,.4)',display:'inline-block',letterSpacing:-.3}}>
            Créer mon compte Dropzi →
          </Link>
        </div>
      </section>

      <footer style={{borderTop:'1px solid rgba(255,255,255,.05)',padding:'28px 6vw',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
        <span style={{color:'rgba(255,255,255,.25)',fontSize:13}}>© 2025 Dropzi · Fait avec ❤️ pour l'Afrique</span>
        <div style={{display:'flex',gap:24}}>
          {['Confidentialité','CGU','Contact'].map(l=>(
            <a key={l} href="#" style={{color:'rgba(255,255,255,.2)',fontSize:13,textDecoration:'none'}}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
