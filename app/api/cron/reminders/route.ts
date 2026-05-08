import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel cron calls this endpoint. Protect it with a secret so it can't be
// triggered by arbitrary HTTP requests.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: 'Twilio not configured' }, { status: 503 })
  }

  // Find appointments starting in 20–28 hours that haven't had a reminder sent
  const now       = new Date()
  const window24h = new Date(now.getTime() + 20 * 60 * 60 * 1000)
  const window28h = new Date(now.getTime() + 28 * 60 * 60 * 1000)

  const { data: appointments, error: fetchErr } = await supabaseAdmin
    .from('appointments')
    .select('id, owner_id, start_time, service_name, client_id, clients(name, phone)')
    .gte('start_time', window24h.toISOString())
    .lte('start_time', window28h.toISOString())
    .is('reminder_sent_at', null)
    .in('status', ['confirmed', 'pending'])

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  const results = []
  let sent = 0
  let failed = 0

  for (const appt of appointments || []) {
    const client     = appt.clients as any
    const clientPhone = client?.phone
    const clientName  = client?.name || 'there'

    if (!clientPhone) {
      results.push({ id: appt.id, status: 'skipped', reason: 'no phone' })
      continue
    }

    // Get salon name
    const { data: settings } = await supabaseAdmin
      .from('salon_settings')
      .select('salon_name')
      .eq('owner_id', appt.owner_id)
      .maybeSingle()
    const salonName = settings?.salon_name || 'the salon'

    const apptDate = new Date(appt.start_time)
    const dateStr  = apptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const timeStr  = apptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const message  = `Hi ${clientName}! Reminder: you have an appointment at ${salonName} tomorrow, ${dateStr} at ${timeStr} for ${appt.service_name}. Reply STOP to opt out.`

    const digits  = clientPhone.replace(/\D/g, '')
    const e164    = digits.startsWith('1') ? `+${digits}` : `+1${digits}`

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const body      = new URLSearchParams({ To: e164, From: fromNumber, Body: message })

    let status = 'sent'
    try {
      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })
      if (!twilioRes.ok) status = 'failed'
    } catch {
      status = 'failed'
    }

    if (status === 'sent') sent++; else failed++

    // Stamp reminder_sent_at so we don't send again
    await supabaseAdmin
      .from('appointments')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', appt.id)

    // Log it
    await supabaseAdmin.from('reminder_logs').insert({
      owner_id: appt.owner_id,
      appointment_id: appt.id,
      client_id: appt.client_id,
      channel: 'sms',
      phone: e164,
      message,
      status,
    })

    results.push({ id: appt.id, status, phone: e164 })
  }

  return NextResponse.json({
    processed: (appointments || []).length,
    sent,
    failed,
    results,
  })
}
