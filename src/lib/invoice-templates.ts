// 5 modèles de factures premium Dropzi

export interface InvoiceData {
  numero: string
  created_at: string
  client_nom: string
  client_tel?: string
  client_adresse?: string
  boutique: string
  boutique_tel?: string
  boutique_adresse?: string
  items: { description: string; quantite: number; prix: number }[]
  montant_ht: number
  frais_livraison: number
  montant_total: number
  notes?: string
  logo?: string
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

// MODELE 1 — Sombre & Premium
export function templateDark(d: InvoiceData): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Facture ${d.numero}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0C0C1E;color:#fff;padding:48px;min-height:100vh;}
.wrap{max-width:720px;margin:0 auto;}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.1);}
.logo-area{display:flex;align-items:center;gap:14px;}
.logo-icon{width:52px;height:52px;background:linear-gradient(135deg,#7F77DD,#534AB7);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;flex-shrink:0;}
.brand{font-size:24px;font-weight:800;letter-spacing:-1px;}
.brand-sub{font-size:13px;color:rgba(255,255,255,.4);margin-top:2px;}
.inv-right{text-align:right;}
.inv-num{font-size:28px;font-weight:800;color:#7F77DD;letter-spacing:-1px;}
.inv-date{font-size:13px;color:rgba(255,255,255,.4);margin-top:4px;}
.inv-badge{display:inline-block;background:rgba(29,158,117,.2);color:#9FE1CB;font-size:11px;font-weight:700;padding:3px 12px;border-radius:20px;margin-top:8px;}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:40px;}
.party-lbl{font-size:10px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px;}
.party-name{font-size:17px;font-weight:700;}
.party-info{font-size:13px;color:rgba(255,255,255,.45);margin-top:5px;line-height:1.6;}
table{width:100%;border-collapse:collapse;margin-bottom:28px;}
thead tr{background:rgba(127,119,221,.15);border-radius:10px;}
th{padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;}
th:last-child{text-align:right;}
td{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);font-size:14px;color:rgba(255,255,255,.8);}
td:last-child{text-align:right;font-weight:600;}
.totals{margin-left:auto;width:300px;}
.tot-row{display:flex;justify-content:space-between;padding:8px 0;font-size:14px;color:rgba(255,255,255,.45);border-bottom:1px solid rgba(255,255,255,.06);}
.tot-final{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:linear-gradient(135deg,#7F77DD,#534AB7);border-radius:14px;margin-top:10px;}
.tot-final-lbl{font-weight:700;font-size:16px;}
.tot-final-val{font-size:26px;font-weight:800;}
.notes-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px 18px;margin-bottom:28px;font-size:13px;color:rgba(255,255,255,.45);line-height:1.6;}
.footer{margin-top:48px;padding-top:20px;border-top:1px solid rgba(255,255,255,.07);text-align:center;color:rgba(255,255,255,.2);font-size:12px;}
@media print{body{padding:20px;}}
</style></head><body>
<div class="wrap">
<div class="header">
  <div class="logo-area">
    <div class="logo-icon">${d.logo ? `<img src="${d.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">` : d.boutique.slice(0,1).toUpperCase()}</div>
    <div><div class="brand">${d.boutique}</div><div class="brand-sub">Dropzi</div></div>
  </div>
  <div class="inv-right">
    <div class="inv-num">${d.numero}</div>
    <div class="inv-date">${new Date(d.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
    <div><span class="inv-badge">✓ Émise</span></div>
  </div>
</div>
<div class="parties">
  <div><div class="party-lbl">De</div><div class="party-name">${d.boutique}</div>${d.boutique_tel?`<div class="party-info">📞 ${d.boutique_tel}</div>`:''}${d.boutique_adresse?`<div class="party-info">📍 ${d.boutique_adresse}</div>`:''}</div>
  <div><div class="party-lbl">Facturé à</div><div class="party-name">${d.client_nom||'Client'}</div>${d.client_tel?`<div class="party-info">📞 ${d.client_tel}</div>`:''}${d.client_adresse?`<div class="party-info">📍 ${d.client_adresse}</div>`:''}</div>
</div>
<table>
  <thead><tr><th>Description</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead>
  <tbody>${d.items.map(i=>`<tr><td>${i.description}</td><td>${i.quantite}</td><td>${fmt(i.prix)} F</td><td>${fmt(i.prix*i.quantite)} F</td></tr>`).join('')}</tbody>
</table>
${d.notes?`<div class="notes-box">📝 ${d.notes}</div>`:''}
<div class="totals">
  <div class="tot-row"><span>Sous-total</span><span>${fmt(d.montant_ht)} FCFA</span></div>
  ${d.frais_livraison>0?`<div class="tot-row"><span>🚚 Livraison</span><span>${fmt(d.frais_livraison)} FCFA</span></div>`:''}
  <div class="tot-final"><span class="tot-final-lbl">Total à payer</span><span class="tot-final-val">${fmt(d.montant_total)} FCFA</span></div>
</div>
<div class="footer">Facture générée par Dropzi · ${new Date().toLocaleDateString('fr-FR')} · Merci pour votre confiance 🙏</div>
</div><script>window.onload=()=>window.print()<\/script></body></html>`
}

// MODELE 2 — Corporate & Professionnel
export function templateCorporate(d: InvoiceData): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Facture ${d.numero}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:"Arial",sans-serif;background:#fff;color:#1a1a2e;padding:48px;}
.wrap{max-width:720px;margin:0 auto;}
.header{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:36px;}
.brand-name{font-size:28px;font-weight:900;color:#0C0C1E;letter-spacing:-1px;}
.brand-sub{font-size:12px;color:#888;margin-top:3px;text-transform:uppercase;letter-spacing:.08em;}
.inv-info{text-align:right;}
.inv-title{font-size:32px;font-weight:900;color:#0C0C1E;text-transform:uppercase;letter-spacing:-1px;}
.inv-num{font-size:14px;color:#7F77DD;font-weight:700;margin-top:4px;}
.inv-date{font-size:12px;color:#888;margin-top:3px;}
.divider{height:4px;background:linear-gradient(90deg,#0C0C1E,#7F77DD,#1D9E75);border-radius:2px;margin-bottom:32px;}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:32px;}
.party-lbl{font-size:10px;font-weight:900;color:#888;text-transform:uppercase;letter-spacing:.15em;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #f0f0f0;}
.party-name{font-size:16px;font-weight:700;color:#0C0C1E;}
.party-info{font-size:12px;color:#666;margin-top:4px;line-height:1.6;}
table{width:100%;border-collapse:collapse;margin-bottom:28px;}
thead{background:#0C0C1E;}
th{padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.08em;}
th:last-child{text-align:right;}
tbody tr:nth-child(even){background:#F8F8FC;}
td{padding:13px 16px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;}
td:last-child{text-align:right;font-weight:700;}
.totals{margin-left:auto;width:280px;}
.tot-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#666;border-bottom:1px solid #f0f0f0;}
.tot-final{display:flex;justify-content:space-between;padding:14px 16px;background:#0C0C1E;color:#fff;margin-top:8px;border-radius:0;}
.tot-final-lbl{font-weight:700;font-size:15px;}
.tot-final-val{font-size:22px;font-weight:900;}
.notes-box{background:#F8F8FC;border-left:4px solid #7F77DD;padding:12px 16px;margin-bottom:28px;font-size:12px;color:#555;}
.footer{margin-top:48px;padding-top:16px;border-top:2px solid #0C0C1E;display:flex;justify-content:space-between;font-size:11px;color:#888;}
@media print{body{padding:20px;}}
</style></head><body>
<div class="wrap">
<div class="header">
  <div><div class="brand-name">${d.boutique}</div><div class="brand-sub">Facture officielle</div></div>
  <div class="inv-info"><div class="inv-title">Facture</div><div class="inv-num">${d.numero}</div><div class="inv-date">${new Date(d.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div></div>
</div>
<div class="divider"></div>
<div class="parties">
  <div><div class="party-lbl">Émetteur</div><div class="party-name">${d.boutique}</div>${d.boutique_tel?`<div class="party-info">📞 ${d.boutique_tel}</div>`:''}${d.boutique_adresse?`<div class="party-info">📍 ${d.boutique_adresse}</div>`:''}</div>
  <div><div class="party-lbl">Destinataire</div><div class="party-name">${d.client_nom||'Client'}</div>${d.client_tel?`<div class="party-info">📞 ${d.client_tel}</div>`:''}${d.client_adresse?`<div class="party-info">📍 ${d.client_adresse}</div>`:''}</div>
</div>
<table>
  <thead><tr><th>Description</th><th>Qté</th><th>Prix unit.</th><th>Total HT</th></tr></thead>
  <tbody>${d.items.map(i=>`<tr><td>${i.description}</td><td>${i.quantite}</td><td>${fmt(i.prix)} FCFA</td><td>${fmt(i.prix*i.quantite)} FCFA</td></tr>`).join('')}</tbody>
</table>
${d.notes?`<div class="notes-box"><strong>Note :</strong> ${d.notes}</div>`:''}
<div class="totals">
  <div class="tot-row"><span>Sous-total HT</span><span>${fmt(d.montant_ht)} FCFA</span></div>
  ${d.frais_livraison>0?`<div class="tot-row"><span>Frais de livraison</span><span>${fmt(d.frais_livraison)} FCFA</span></div>`:''}
  <div class="tot-final"><span class="tot-final-lbl">TOTAL</span><span class="tot-final-val">${fmt(d.montant_total)} FCFA</span></div>
</div>
<div class="footer"><span>Dropzi — L'outil e-commerce Africain</span><span>${d.boutique} · ${new Date().getFullYear()}</span></div>
</div><script>window.onload=()=>window.print()<\/script></body></html>`
}

// MODELE 3 — Moderne & Minimaliste
export function templateMinimal(d: InvoiceData): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Facture ${d.numero}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff;color:#1a1a2e;padding:56px;line-height:1.5;}
.wrap{max-width:680px;margin:0 auto;}
.header{margin-bottom:52px;}
.top-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;}
.brand{font-size:20px;font-weight:800;color:#1a1a2e;letter-spacing:-.5px;}
.inv-badge-top{background:#7F77DD;color:#fff;font-size:11px;font-weight:700;padding:4px 14px;border-radius:100px;}
.inv-num-big{font-size:42px;font-weight:800;color:#7F77DD;letter-spacing:-2px;margin-bottom:4px;}
.inv-date{font-size:14px;color:#999;}
.line{height:1px;background:#f0f0f0;margin:28px 0;}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:40px;}
.party-lbl{font-size:11px;color:#bbb;text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px;}
.party-name{font-size:16px;font-weight:700;}
.party-info{font-size:13px;color:#999;margin-top:3px;}
table{width:100%;border-collapse:collapse;margin-bottom:32px;}
th{padding:10px 0;text-align:left;font-size:11px;font-weight:700;color:#ccc;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #f0f0f0;}
th:last-child{text-align:right;}
td{padding:14px 0;font-size:14px;color:#333;border-bottom:1px solid #fafafa;}
td:last-child{text-align:right;font-weight:600;color:#1a1a2e;}
.totals{margin-left:auto;width:260px;}
.tot-row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#999;}
.tot-final{display:flex;justify-content:space-between;align-items:center;padding:18px 0;border-top:2px solid #1a1a2e;margin-top:8px;}
.tot-final-lbl{font-size:16px;font-weight:700;}
.tot-final-val{font-size:28px;font-weight:800;color:#7F77DD;}
.notes-box{font-size:13px;color:#999;margin-bottom:28px;padding:14px;background:#fafafa;border-radius:8px;}
.footer{margin-top:52px;font-size:12px;color:#ccc;text-align:center;}
@media print{body{padding:24px;}}
</style></head><body>
<div class="wrap">
<div class="header">
  <div class="top-row"><div class="brand">${d.boutique}</div><span class="inv-badge-top">FACTURE</span></div>
  <div class="inv-num-big">${d.numero}</div>
  <div class="inv-date">${new Date(d.created_at).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
</div>
<div class="line"></div>
<div class="parties">
  <div><div class="party-lbl">De</div><div class="party-name">${d.boutique}</div>${d.boutique_tel?`<div class="party-info">${d.boutique_tel}</div>`:''}${d.boutique_adresse?`<div class="party-info">${d.boutique_adresse}</div>`:''}</div>
  <div><div class="party-lbl">Pour</div><div class="party-name">${d.client_nom||'Client'}</div>${d.client_tel?`<div class="party-info">${d.client_tel}</div>`:''}${d.client_adresse?`<div class="party-info">${d.client_adresse}</div>`:''}</div>
</div>
<div class="line"></div>
<table>
  <thead><tr><th>Description</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead>
  <tbody>${d.items.map(i=>`<tr><td>${i.description}</td><td>${i.quantite}</td><td>${fmt(i.prix)} F</td><td>${fmt(i.prix*i.quantite)} F</td></tr>`).join('')}</tbody>
</table>
${d.notes?`<div class="notes-box">${d.notes}</div>`:''}
<div class="totals">
  <div class="tot-row"><span>Sous-total</span><span>${fmt(d.montant_ht)} F</span></div>
  ${d.frais_livraison>0?`<div class="tot-row"><span>Livraison</span><span>${fmt(d.frais_livraison)} F</span></div>`:''}
  <div class="tot-final"><span class="tot-final-lbl">Total</span><span class="tot-final-val">${fmt(d.montant_total)} FCFA</span></div>
</div>
<div class="footer">Merci pour votre confiance · ${d.boutique} · Dropzi</div>
</div><script>window.onload=()=>window.print()<\/script></body></html>`
}

// MODELE 4 — Africain & Coloré
export function templateAfrican(d: InvoiceData): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Facture ${d.numero}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff;padding:0;}
.wrap{max-width:720px;margin:0 auto;}
.header{background:linear-gradient(135deg,#1D9E75,#0F6E56);padding:36px 40px;color:#fff;position:relative;overflow:hidden;}
.header::before{content:'';position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:rgba(255,255,255,.08);border-radius:50%;}
.header::after{content:'';position:absolute;bottom:-30px;left:20px;width:120px;height:120px;background:rgba(255,255,255,.05);border-radius:50%;}
.header-inner{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start;}
.brand{font-size:26px;font-weight:800;letter-spacing:-1px;}
.brand-sub{font-size:12px;color:rgba(255,255,255,.6);margin-top:3px;}
.inv-info{text-align:right;}
.inv-num{font-size:26px;font-weight:800;letter-spacing:-1px;}
.inv-date{font-size:12px;color:rgba(255,255,255,.6);margin-top:4px;}
.inv-status{display:inline-block;background:rgba(255,255,255,.2);color:#fff;font-size:11px;font-weight:700;padding:3px 12px;border-radius:20px;margin-top:8px;}
.body{padding:36px 40px;}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:28px;}
.party-lbl{font-size:10px;font-weight:700;color:#1D9E75;text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px;}
.party-name{font-size:16px;font-weight:700;color:#0C0C1E;}
.party-info{font-size:12px;color:#777;margin-top:4px;line-height:1.6;}
table{width:100%;border-collapse:collapse;margin-bottom:24px;}
thead tr{border-bottom:2px solid #1D9E75;}
th{padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#1D9E75;text-transform:uppercase;letter-spacing:.08em;}
th:last-child{text-align:right;}
tbody tr:nth-child(odd){background:#F0FDF4;}
td{padding:12px 14px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;}
td:last-child{text-align:right;font-weight:700;color:#0F6E56;}
.totals{margin-left:auto;width:270px;}
.tot-row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#666;border-bottom:1px solid #f0f0f0;}
.tot-final{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:linear-gradient(135deg,#1D9E75,#0F6E56);border-radius:12px;color:#fff;margin-top:10px;}
.tot-lbl{font-weight:700;font-size:15px;}
.tot-val{font-size:24px;font-weight:800;}
.notes-box{background:#F0FDF4;border-left:4px solid #1D9E75;padding:12px 16px;margin-bottom:24px;font-size:12px;color:#0F6E56;}
.footer{text-align:center;padding:20px 40px;background:#F0FDF4;color:#1D9E75;font-size:12px;font-weight:600;}
@media print{body{padding:0;}}
</style></head><body>
<div class="wrap">
<div class="header">
  <div class="header-inner">
    <div><div class="brand">${d.boutique}</div><div class="brand-sub">L'Afrique qui entreprend 🌍</div></div>
    <div class="inv-info"><div class="inv-num">${d.numero}</div><div class="inv-date">${new Date(d.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div><div><span class="inv-status">✓ Émise</span></div></div>
  </div>
</div>
<div class="body">
<div class="parties">
  <div><div class="party-lbl">De la boutique</div><div class="party-name">${d.boutique}</div>${d.boutique_tel?`<div class="party-info">📞 ${d.boutique_tel}</div>`:''}${d.boutique_adresse?`<div class="party-info">📍 ${d.boutique_adresse}</div>`:''}</div>
  <div><div class="party-lbl">Pour le client</div><div class="party-name">${d.client_nom||'Client'}</div>${d.client_tel?`<div class="party-info">📞 ${d.client_tel}</div>`:''}${d.client_adresse?`<div class="party-info">📍 ${d.client_adresse}</div>`:''}</div>
</div>
<table>
  <thead><tr><th>Produit / Service</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead>
  <tbody>${d.items.map(i=>`<tr><td>${i.description}</td><td>${i.quantite}</td><td>${fmt(i.prix)} F</td><td>${fmt(i.prix*i.quantite)} F</td></tr>`).join('')}</tbody>
</table>
${d.notes?`<div class="notes-box">📝 ${d.notes}</div>`:''}
<div class="totals">
  <div class="tot-row"><span>Sous-total</span><span>${fmt(d.montant_ht)} FCFA</span></div>
  ${d.frais_livraison>0?`<div class="tot-row"><span>🚚 Livraison</span><span>${fmt(d.frais_livraison)} FCFA</span></div>`:''}
  <div class="tot-final"><span class="tot-lbl">Total à payer</span><span class="tot-val">${fmt(d.montant_total)} FCFA</span></div>
</div>
</div>
<div class="footer">Merci pour votre confiance · Dropzi · L'outil e-commerce pensé pour l'Afrique 🌍</div>
</div><script>window.onload=()=>window.print()<\/script></body></html>`
}

// MODELE 5 — Élégant & Luxe
export function templateLuxe(d: InvoiceData): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Facture ${d.numero}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Georgia,"Times New Roman",serif;background:#FAFAF7;color:#1a1a2e;padding:56px;}
.wrap{max-width:700px;margin:0 auto;background:#fff;padding:52px;border:1px solid #e8e4dc;}
.header{text-align:center;margin-bottom:44px;padding-bottom:28px;border-bottom:2px solid #C9A84C;}
.brand{font-size:32px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#1a1a2e;}
.brand-line{width:60px;height:2px;background:#C9A84C;margin:10px auto;}
.brand-sub{font-size:12px;color:#aaa;letter-spacing:.2em;text-transform:uppercase;}
.inv-info{margin-top:20px;display:flex;justify-content:center;gap:40px;}
.inv-info-item{text-align:center;}
.inv-info-lbl{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.12em;margin-bottom:4px;}
.inv-info-val{font-size:15px;font-weight:700;color:#C9A84C;}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:36px;padding-bottom:28px;border-bottom:1px solid #f0ebe0;}
.party-lbl{font-size:10px;font-weight:700;color:#C9A84C;text-transform:uppercase;letter-spacing:.15em;margin-bottom:10px;}
.party-name{font-size:16px;font-weight:700;}
.party-info{font-size:12px;color:#888;margin-top:4px;line-height:1.7;}
table{width:100%;border-collapse:collapse;margin-bottom:28px;}
th{padding:12px 0;text-align:left;font-size:10px;font-weight:700;color:#C9A84C;text-transform:uppercase;letter-spacing:.12em;border-bottom:2px solid #C9A84C;}
th:last-child{text-align:right;}
td{padding:14px 0;font-size:13px;color:#444;border-bottom:1px solid #f5f0e8;font-family:-apple-system,sans-serif;}
td:last-child{text-align:right;font-weight:700;color:#1a1a2e;}
.totals{margin-left:auto;width:260px;}
.tot-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#888;font-family:-apple-system,sans-serif;}
.tot-line{border-top:1px solid #C9A84C;margin:8px 0;}
.tot-final{display:flex;justify-content:space-between;align-items:center;padding-top:12px;}
.tot-final-lbl{font-size:16px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;}
.tot-final-val{font-size:28px;font-weight:700;color:#C9A84C;}
.notes-box{background:#FAFAF7;border:1px solid #e8e4dc;padding:14px 18px;margin-bottom:28px;font-size:12px;color:#888;font-family:-apple-system,sans-serif;line-height:1.7;}
.footer{text-align:center;margin-top:44px;padding-top:20px;border-top:1px solid #e8e4dc;font-size:11px;color:#bbb;letter-spacing:.08em;text-transform:uppercase;}
@media print{body{padding:20px;}.wrap{padding:32px;}}
</style></head><body>
<div class="wrap">
<div class="header">
  <div class="brand">${d.boutique}</div>
  <div class="brand-line"></div>
  <div class="brand-sub">Excellence & Service</div>
  <div class="inv-info">
    <div class="inv-info-item"><div class="inv-info-lbl">Facture N°</div><div class="inv-info-val">${d.numero}</div></div>
    <div class="inv-info-item"><div class="inv-info-lbl">Date</div><div class="inv-info-val">${new Date(d.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div></div>
    <div class="inv-info-item"><div class="inv-info-lbl">Statut</div><div class="inv-info-val">✓ Émise</div></div>
  </div>
</div>
<div class="parties">
  <div><div class="party-lbl">De</div><div class="party-name">${d.boutique}</div>${d.boutique_tel?`<div class="party-info">${d.boutique_tel}</div>`:''}${d.boutique_adresse?`<div class="party-info">${d.boutique_adresse}</div>`:''}</div>
  <div><div class="party-lbl">Facturé à</div><div class="party-name">${d.client_nom||'Client'}</div>${d.client_tel?`<div class="party-info">${d.client_tel}</div>`:''}${d.client_adresse?`<div class="party-info">${d.client_adresse}</div>`:''}</div>
</div>
<table>
  <thead><tr><th>Désignation</th><th>Qté</th><th>Prix unitaire</th><th>Montant</th></tr></thead>
  <tbody>${d.items.map(i=>`<tr><td>${i.description}</td><td>${i.quantite}</td><td>${fmt(i.prix)} FCFA</td><td>${fmt(i.prix*i.quantite)} FCFA</td></tr>`).join('')}</tbody>
</table>
${d.notes?`<div class="notes-box">${d.notes}</div>`:''}
<div class="totals">
  <div class="tot-row"><span>Sous-total</span><span>${fmt(d.montant_ht)} FCFA</span></div>
  ${d.frais_livraison>0?`<div class="tot-row"><span>Livraison</span><span>${fmt(d.frais_livraison)} FCFA</span></div>`:''}
  <div class="tot-line"></div>
  <div class="tot-final"><span class="tot-final-lbl">Total</span><span class="tot-final-val">${fmt(d.montant_total)} FCFA</span></div>
</div>
<div class="footer">Merci pour votre fidélité · ${d.boutique} · Dropzi</div>
</div><script>window.onload=()=>window.print()<\/script></body></html>`
}

export const TEMPLATES = [
  { id: 'dark', name: '🌑 Sombre & Premium', fn: templateDark },
  { id: 'corporate', name: '🏢 Corporate', fn: templateCorporate },
  { id: 'minimal', name: '✨ Moderne & Minimal', fn: templateMinimal },
  { id: 'african', name: '🌍 Africain & Coloré', fn: templateAfrican },
  { id: 'luxe', name: '👑 Élégant & Luxe', fn: templateLuxe },
]
