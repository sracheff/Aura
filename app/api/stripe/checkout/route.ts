import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Price IDs — set these after creating products in Stripe dashboard
const PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  pro:     process.env.STRIPE_PRICE_PRO!,
}

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, email } = await req.json()

    if (!plan || !userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const priceId = PRICES[plan]
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: salon } = await supabase
      .from('salons')
      .select('stripe_customer_id, name')
      .eq('owner_id', userId)
      .single()

    let customerId = salon?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { owner_id: userId, salon_name: salon?.name || '' },
      })
      customerId = customer.id
      await supabase.from('salons').update({ stripe_customer_id: customerId }).eq('owner_id', userId)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aura-rlybtvra9-sracheffs-projects.vercel.app'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?tab=billing&success=true`,
      cancel_url: `${appUrl}/settings?tab=billing`,
      subscription_data: {
        metadata: { owner_id: userId },
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      },
      allow_promotion_codes: true,
      metadata: { owner_id: userId, plan },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
