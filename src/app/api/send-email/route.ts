import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: 'Dropzi', email: process.env.BREVO_FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error('Brevo error: ' + err)
  }
  return res.json()
}

function emailTemplate(titre: string, message: string, type: string) {
  const colors: Record<string, string> = {
    info: '#7F77DD', success: '#1D9E75', warning: '#BA7517', error: '#E24B4A'
  }
  const color = colors[type] || '#7F77DD'
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#0C0C1E,#1a1a3e);padding:28px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#7F77DD,#534AB7);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-weight:800;font-size:18px">D</span>
        </div>
        <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-1px;">Dropzi</span>
      </div>
    </div>
    <div style="padding:32px;">
      <div style="background:${color}11;border-left:4px solid ${color};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:${color};font-weight:700;font-size:16px;margin:0 0 6px;">${titre}</p>
        <p style="color:#444;font-size:14px;line-height:1.7;margin:0;">${message}</p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://dropzi.netlify.app/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7F77DD,#534AB7);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
          Voir mon dashboard →
        </a>
      </div>
    </div>
    <div style="background:#f8f8fc;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#aaa;font-size:12px;margin:0;">Dropzi · L'outil e-commerce pensé pour l'Afrique 🌍</p>
      <p style="color:#ccc;font-size:11px;margin:4px 0 0;">dropzi.netlify.app</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { titre, message, type, cible, user_id_specifique } = body

    if (!titre || !message) {
      return NextResponse.json({ error: 'titre et message requis' }, { status: 400 })
    }

    // Récupérer les emails des destinataires
    let query = supabase.from('profiles').select('id, email, nom_boutique, plan')

    if (cible === 'user_specifique' && user_id_specifique) {
      query = query.eq('id', user_id_specifique) as any
    } else if (cible !== 'tous') {
      query = query.eq('plan', cible) as any
    }

    const { data: users, error } = await query
    if (error) throw new Error(error.message)

    const recipients = (users || []).filter((u: any) => u.email)
    let sent = 0
    let failed = 0

    // Envoyer les emails par batch de 10
    for (const user of recipients) {
      try {
        const subject = `[Dropzi] ${titre}`
        const html = emailTemplate(titre, message, type || 'info')
        await sendEmail(user.email, subject, html)
        sent++
        // Petite pause pour éviter le rate limit
        await new Promise(r => setTimeout(r, 100))
      } catch (e) {
        console.error(`Erreur email pour ${user.email}:`, e)
        failed++
      }
    }

    return NextResponse.json({ sent, failed, total: recipients.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
