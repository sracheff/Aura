import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { appointmentId, ownerId, reviewUrl } = await req.json()
    if (!appointmentId || !ownerId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: appt } = await supabaseAdmin
      .from('appointments')
      .select('*, clients(name, phone)')
      .eq('id', appointmentId)
      .single()

    if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

    const clientPhone = (appt.clients as any)?.phone
    const clientName  = (appt.clients as any)?.name || 'there'
    if (!clientPhone) return NextResponse.json({ error: 'Client has no phone number' }, { status: 400 })

    const { data: settings } = await supabaseAdmin
      .from('salon_settings')
      .select('salon_name')
      .eq('owner_id', ownerId)
      .maybeSingle()
    const salonName = settings?.salon_name || 'us'

    const link    = reviewUrl || ''
    const message = link
      ? `Hi ${clientName}! Thanks for visiting ${salonName} — we hope you loved your experience! We'd be so grateful if you left us a quick review: ${link} 🌟`
      : `Hi ${clientName}! Thanks for visiting ${salonName} today. We hope you loved your appointment! If you have a moment, we'd love a review — it really helps. 🌟`

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken  = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: 'Twilio not configured' }, { status: 503 })
    }

    const digits = clientPhone.replace(/\D/g, '')
    const e164   = digits.startsWith('1') ? `+${digits}` : `+1${digits}`

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const body = new URLSearchParams({ To: e164, From: fromNumber, Body: message })
    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const status = twilioRes.ok ? 'sent' : 'failed'

    // Stamp the appointment
    await supabaseAdmin
      .from('appointments')
      .update({ review_sent_at: new Date().toISOString() })
      .eq('id', appointmentId)

    // Log the request
    await supabaseAdmin.from('review_requests').insert({
      owner_id: ownerId,
      appointment_id: appointmentId,
      client_id: appt.client_id,
      phone: e164,
      status,
    })

    if (!twilioRes.ok) {
      const err = await twilioRes.json()
      return NextResponse.json({ error: err.message || 'Twilio error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
