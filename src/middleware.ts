import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Pages accessibles sans abonnement
const PUBLIC_PATHS = [
  '/landing',
  '/login',
  '/tutoriels',
  '/dashboard/abonnement',
  '/api/paydunya',
  '/api/track',
  '/_next',
  '/favicon',
  '/icons',
  '/manifest',
  '/sw.js',
  '/offline',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Laisser passer les pages publiques
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Laisser passer les assets statiques
  if (pathname.match(/\.(png|jpg|svg|ico|css|js|woff|woff2)$/)) {
    return NextResponse.next()
  }

  // Vérifier seulement les pages dashboard
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Récupérer le token Supabase depuis les cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const accessToken = request.cookies.get('sb-access-token')?.value ||
    request.cookies.get(`sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`)?.value

  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Vérifier l'abonnement avec service role
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey)

    // Décoder le JWT pour obtenir user_id
    const base64Url = accessToken.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString())
    const userId = payload.sub

    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin bypass
    if (userId === '48a705e3-b06c-4417-89d4-7c27d0fea31b') {
      return NextResponse.next()
    }

    // Vérifier abonnement actif
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires')
      .eq('id', userId)
      .single()

    const planValide = profile?.plan && !['aucun', 'gratuit', null, ''].includes(profile.plan)
    const nonExpire = profile?.plan_expires ? new Date(profile.plan_expires) > new Date() : false

    if (!planValide || !nonExpire) {
      return NextResponse.redirect(new URL('/dashboard/abonnement', request.url))
    }

    return NextResponse.next()
  } catch (e) {
    // En cas d'erreur on laisse passer — mieux vaut laisser accéder que bloquer un vrai client
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
