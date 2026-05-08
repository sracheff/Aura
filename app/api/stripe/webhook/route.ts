import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const getOwnerId = (obj: any) => obj?.metadata?.owner_id || null

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const ownerId = getOwnerId(session)
        if (!ownerId || !session.subscription) break

        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = sub.items.data[0]?.price.id
        const plan = priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'starter'

        await supabase.from('salons').update({
          plan,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          subscription_status: sub.status,
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        }).eq('owner_id', ownerId)

        await supabase.from('subscription_events').insert({
          owner_id: ownerId,
          event_type: 'checkout.completed',
          stripe_event_id: event.id,
          payload: { plan, subscription_id: sub.id },
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const ownerId = getOwnerId(sub)
        if (!ownerId) break

        const priceId = sub.items.data[0]?.price.id
        const plan = priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : sub.status === 'active' ? 'starter' : 'trial'

        await supabase.from('salons').update({
          plan,
          stripe_price_id: priceId,
          subscription_status: sub.status,
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        }).eq('owner_id', ownerId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const ownerId = getOwnerId(sub)
        if (!ownerId) break

        await supabase.from('salons').update({
          plan: 'cancelled',
          subscription_status: 'cancelled',
        }).eq('owner_id', ownerId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        await supabase.from('salons').update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
  }

  return NextResponse.json({ received: true })
}

// Stripe needs raw body — disable body parsing
export const config = { api: { bodyParser: false } }
