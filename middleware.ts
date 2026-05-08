import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Routes that don't require auth
const PUBLIC_ROUTES = ['/login', '/book', '/portal', '/intake', '/api/stripe/webhook']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some(p => pathname.startsWith(p))) {
    return res
  }

  // Allow static files and API routes (except protected ones)
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/') || pathname === '/favicon.ico') {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    // Not logged in — redirect to login
    if (!session) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }

    // Logged in but on root — redirect to dashboard
    if (pathname === '/') {
      const dashUrl = req.nextUrl.clone()
      dashUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashUrl)
    }

    // Skip subscription check for onboarding + settings (so they can upgrade)
    if (pathname.startsWith('/onboarding') || pathname.startsWith('/settings')) {
      return res
    }

    // Check subscription status (non-blocking — graceful fallback on DB error)
    try {
      const { data: salon } = await supabase
        .from('salons')
        .select('plan, trial_ends_at, subscription_status, onboarding_complete')
        .eq('owner_id', session.user.id)
        .single()

      if (salon) {
        // Redirect to onboarding if not complete
        if (!salon.onboarding_complete && !pathname.startsWith('/onboarding')) {
          const onboardUrl = req.nextUrl.clone()
          onboardUrl.pathname = '/onboarding'
          return NextResponse.redirect(onboardUrl)
        }

        // Trial expired + no active subscription → billing page
        const trialExpired = salon.plan === 'trial' && new Date(salon.trial_ends_at) < new Date()
        const subscriptionInactive = salon.plan === 'cancelled' || salon.subscription_status === 'past_due'

        if ((trialExpired || subscriptionInactive) && !pathname.startsWith('/settings')) {
          const billingUrl = req.nextUrl.clone()
          billingUrl.pathname = '/settings'
          billingUrl.searchParams.set('tab', 'billing')
          billingUrl.searchParams.set('expired', 'true')
          return NextResponse.redirect(billingUrl)
        }
      }
    } catch {
      // DB error — allow through to avoid locking users out
    }

    return res
  } catch {
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
