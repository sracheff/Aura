import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Create admin client inside the handler so env vars are available at runtime
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { appointmentId, ownerId } = await req.json()
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
      .single()
    const salonName = settings?.salon_name || 'the salon'

    const apptDate = new Date(appt.start_time)
    const dateStr  = apptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const timeStr  = apptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const message  = `Hi ${clientName}! Just a reminder about your appointment at ${salonName} on ${dateStr} at ${timeStr} for ${appt.service_name}. See you soon! 💇`

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken  = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      await supabaseAdmin.from('reminder_logs').insert({
        owner_id: ownerId, appointment_id: appointmentId,
        client_id: appt.client_id, channel: 'sms',
        phone: clientPhone, message, status: 'failed',
      })
      return NextResponse.json({ error: 'Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your environment variables.' }, { status: 503 })
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

    const twilioData = await twilioRes.json()
    const status = twilioRes.ok ? 'sent' : 'failed'

    await supabaseAdmin.from('reminder_logs').insert({
      owner_id: ownerId, appointment_id: appointmentId,
      client_id: appt.client_id, channel: 'sms',
      phone: e164, message, status,
    })

    if (!twilioRes.ok) {
      return NextResponse.json({ error: twilioData.message || 'Twilio error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, sid: twilioData.sid, message })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
