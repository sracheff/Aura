'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Sparkles, CheckCircle, ChevronRight, ChevronLeft,
  Clock, DollarSign, User, Mail, Phone, CreditCard,
  Calendar, AlertTriangle, Plus, Minus, Lock, Gift
} from 'lucide-react'

type Service = {
  id: string
  owner_id: string
  name: string
  price: number
  duration: number
  category: string
  active: boolean
}

type Staff = {
  id: string
  name: string
  color: string
  bg_color: string
}

type SelectedService = Service & { qty: number }

type TimeSlot = { time: string; hour: number; min: number; available: boolean }

const STEPS = ['Services', 'Date & Time', 'Your Info', 'Confirm']

const CATEGORY_ORDER = ['Haircuts', 'Color', 'Treatments', 'Styling', 'Extensions', 'Other']

function generateSlots(totalDuration: number, bookedSlots: { start: Date; end: Date }[], openTime = '09:00', closeTime = '18:00'): TimeSlot[] {
  const slots: TimeSlot[] = []
  const [oh, om] = openTime.split(':').map(Number)
  const [ch, cm] = closeTime.split(':').map(Number)
  const open  = oh * 60 + om
  const close = ch * 60 + cm

  for (let m = open; m + totalDuration <= close; m += 30) {
    const hour = Math.floor(m / 60)
    const min = m % 60
    const label = `${hour > 12 ? hour - 12 : hour}:${min === 0 ? '00' : min} ${hour >= 12 ? 'PM' : 'AM'}`

    // Check conflicts with existing appointments
    const slotStart = m
    const slotEnd = m + totalDuration
    const conflict = bookedSlots.some(b => {
      const bStart = b.start.getHours() * 60 + b.start.getMinutes()
      const bEnd = bStart + (b.end.getTime() - b.start.getTime()) / 60000
      return slotStart < bEnd && slotEnd > bStart
    })

    slots.push({ time: label, hour, min, available: !conflict })
  }
  return slots
}

function BookingPageInner() {
  const params = useSearchParams()
  const ownerId  = params.get('owner')
  const refParam = params.get('ref')   // ?ref=<client_id> from a stylist's personal share link

  const [step, setStep] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [calMonth, setCalMonth] = useState(new Date())
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [existingClient, setExistingClient] = useState<{ id: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [salonName, setSalonName] = useState('Stewart Hair')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availability, setAvailability] = useState<{ staff_id: string; day_of_week: number; open_time: string; close_time: string }[]>([])

  // Referral tracking
  const [referredBy, setReferredBy] = useState('')
  const [referrerClientId, setReferrerClientId] = useState<string | null>(refParam)
  const [referrerName, setReferrerName] = useState('')
  const [lookingUpReferrer, setLookingUpReferrer] = useState(false)

  // Source tracking
  const [source, setSource] = useState('')

  // Tip
  const [tipPct, setTipPct] = useState(0)
  const [customTipAmt, setCustomTipAmt] = useState('')
  const [useCustomTip, setUseCustomTip] = useState(false)

  const totalPrice = selectedServices.reduce((s, sv) => s + sv.price * sv.qty, 0)
  const totalDuration = selectedServices.reduce((s, sv) => s + sv.duration * sv.qty, 0)
  const totalMins = `${Math.floor(totalDuration / 60) > 0 ? Math.floor(totalDuration / 60) + 'h ' : ''}${totalDuration % 60 > 0 ? (totalDuration % 60) + 'm' : ''}`

  useEffect(() => {
    if (!ownerId) return
    fetchData()
  }, [ownerId])

  // If booking link includes ?ref=<client_id>, resolve that client's name upfront
  useEffect(() => {
    if (!refParam || !ownerId) return
    supabase.from('clients').select('id,name').eq('id', refParam).eq('owner_id', ownerId).single().then(({ data }) => {
      if (data) setReferrerName(data.name)
    })
  }, [refParam, ownerId])

  useEffect(() => {
    if (selectedDate && totalDuration > 0) fetchSlots()
  }, [selectedDate, selectedStaff, totalDuration])

  async function fetchData() {
    const [{ data: svcs }, { data: stf }, { data: avail }] = await Promise.all([
      supabase.from('services').select('*').eq('owner_id', ownerId).eq('active', true).order('category').order('name'),
      supabase.from('staff').select('id,name,color,bg_color').eq('owner_id', ownerId).eq('active', true),
      supabase.from('staff_availability').select('*').eq('owner_id', ownerId),
    ])
    if (svcs) setServices(svcs)
    if (stf && stf.length > 0) {
      setStaff(stf)
      setSelectedStaff(stf[0])
    }
    if (avail) setAvailability(avail)
  }

  async function fetchSlots() {
    if (!selectedDate || !ownerId) return
    setLoadingSlots(true)
    const dayStart = new Date(selectedDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(selectedDate)
    dayEnd.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('appointments')
      .select('start_time, duration')
      .eq('owner_id', ownerId)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .neq('status', 'cancelled')

    const booked = (data || []).map(a => {
      const start = new Date(a.start_time)
      const end = new Date(start.getTime() + a.duration * 60000)
      return { start, end }
    })

    // Get open/close hours from availability for selected staff + day
    const dow = selectedDate.getDay()
    const staffAvail = selectedStaff
      ? availability.find(a => a.staff_id === selectedStaff.id && a.day_of_week === dow)
      : availability.find(a => a.day_of_week === dow)
    const openTime  = staffAvail?.open_time  || '09:00'
    const closeTime = staffAvail?.close_time || '18:00'

    setSlots(generateSlots(totalDuration, booked, openTime, closeTime))
    setSelectedSlot(null)
    setLoadingSlots(false)
  }

  function toggleService(svc: Service) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === svc.id)
      if (exists) return prev.filter(s => s.id !== svc.id)
      return [...prev, { ...svc, qty: 1 }]
    })
  }

  async function lookupClient(email: string) {
    if (!email.includes('@') || !ownerId) return
    const { data } = await supabase.from('clients').select('id,name,phone').eq('owner_id', ownerId).eq('email', email).single()
    if (data) {
      setExistingClient({ id: data.id })
      setForm(f => ({ ...f, name: data.name || f.name, phone: data.phone || f.phone }))
    }
  }

  async function lookupReferrer(value: string) {
    if (!value.trim() || !ownerId) return
    setLookingUpReferrer(true)
    setReferrerClientId(null)
    setReferrerName('')

    // Try phone first: strip to digits and search
    const digits = value.replace(/\D/g, '')
    if (digits.length >= 7) {
      const { data: byPhone } = await supabase
        .from('clients').select('id,name')
        .eq('owner_id', ownerId)
        .ilike('phone', `%${digits.slice(-10)}%`)
        .limit(1)
      if (byPhone && byPhone.length > 0) {
        setReferrerClientId(byPhone[0].id)
        setReferrerName(byPhone[0].name)
        setLookingUpReferrer(false)
        return
      }
    }

    // Fall back to name search
    const { data: byName } = await supabase
      .from('clients').select('id,name')
      .eq('owner_id', ownerId)
      .ilike('name', `%${value.trim()}%`)
      .limit(1)
    if (byName && byName.length > 0) {
      setReferrerClientId(byName[0].id)
      setReferrerName(byName[0].name)
    }
    setLookingUpReferrer(false)
  }

  async function submitBooking() {
    if (!ownerId || !selectedSlot || !selectedDate || selectedServices.length === 0) return
    setSubmitting(true)

    // Build start time
    const startTime = new Date(selectedDate)
    startTime.setHours(selectedSlot.hour, selectedSlot.min, 0, 0)

    // Create or find client
    let clientId = existingClient?.id || null
    if (!clientId) {
      const { data: newClient } = await supabase.from('clients').insert({
        owner_id: ownerId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        source: source || null,
      }).select('id').single()
      clientId = newClient?.id || null
    } else if (source && existingClient?.id) {
      // Update source on existing client only if not already set
      await supabase.from('clients').update({ source }).eq('id', existingClient.id).is('source', null)
    }

    // Create appointment (service_name = joined names, price/duration = totals)
    const serviceSummary = selectedServices.map(s => s.name).join(' + ')
    const { data: appt } = await supabase.from('appointments').insert({
      owner_id: ownerId,
      client_id: clientId,
      staff_id: selectedStaff?.id || null,
      service_name: serviceSummary,
      start_time: startTime.toISOString(),
      duration: totalDuration,
      price: totalPrice,
      status: 'confirmed',
      notes: form.notes || null,
      source: source || null,
      tip_amount: useCustomTip ? (parseFloat(customTipAmt) || 0) : totalPrice * (tipPct / 100),
    }).select('id').single()

    // Insert appointment_services
    if (appt?.id) {
      await supabase.from('appointment_services').insert(
        selectedServices.map(s => ({
          appointment_id: appt.id,
          service_id: s.id,
          service_name: s.name,
          price: s.price,
          duration: s.duration,
        }))
      )
      setBookingRef(appt.id.slice(0, 8).toUpperCase())
    }

    // Record referral if provided
    const hasReferrer = referrerClientId || referredBy.trim()
    if (hasReferrer && clientId) {
      // Attach to first active campaign if one exists
      const { data: campaigns } = await supabase
        .from('referral_campaigns').select('id')
        .eq('owner_id', ownerId).eq('status', 'active').limit(1)

      await supabase.from('referrals').insert({
        owner_id: ownerId,
        campaign_id: campaigns?.[0]?.id || null,
        referrer_client_id: referrerClientId || null,
        referred_client_id: clientId,
        referred_name: null,
        status: 'converted',
        notes: !referrerClientId && referredBy.trim() ? `Self-reported: "${referredBy.trim()}"` : null,
      })
    }

    setSubmitting(false)
    setDone(true)
  }

  // Calendar helpers
  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
  }
  function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay()
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const groupedServices = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = services.filter(s => (s.category || 'Other') === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Service[]>)

  if (!ownerId) return (
    <div className="min-h-screen bg-luma-bg flex items-center justify-center">
      <div className="text-center p-8">
        <Sparkles size={32} className="text-gold mx-auto mb-4" />
        <p className="text-luma-black font-semibold">No salon found.</p>
        <p className="text-luma-muted text-sm mt-1">Please use the booking link provided by your salon.</p>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-luma-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md text-center shadow-2xl">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-luma-black mb-1">You're booked!</h2>
        <p className="text-luma-muted text-sm mb-6">Confirmation #{bookingRef}</p>

        <div className="bg-luma-surface rounded-2xl p-4 text-left space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-luma-muted">Services</span>
            <span className="font-medium text-luma-black text-right max-w-[60%]">{selectedServices.map(s => s.name).join(', ')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-luma-muted">Date & Time</span>
            <span className="font-medium text-luma-black">
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {selectedSlot?.time}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-luma-muted">Duration</span>
            <span className="font-medium text-luma-black">{totalMins}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-luma-muted">Total</span>
            <span className="font-bold text-gold">${totalPrice}</span>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 mb-6 text-left">
          <AlertTriangle size={12} className="inline mr-1" />
          <strong>72-hour cancellation policy.</strong> Cancellations within 72 hours of your appointment may be subject to a fee.
        </div>

        <button onClick={() => { setDone(false); setStep(0); setSelectedServices([]); setSelectedDate(null); setSelectedSlot(null); setForm({ name:'',email:'',phone:'',notes:'' }) }}
          className="w-full py-3 bg-luma-black text-white rounded-xl font-semibold hover:bg-gold transition-colors">
          Book Another Appointment
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-luma-bg">
      {/* Header */}
      <div className="bg-luma-black text-white py-5 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
            <Sparkles size={16} className="text-luma-black" />
          </div>
          <span className="font-bold text-xl">{salonName}</span>
        </div>
        <p className="text-white/60 text-sm">Book your appointment online</p>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-luma-border px-4 py-3">
        <div className="flex items-center justify-center gap-1 max-w-lg mx-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                i === step ? 'bg-luma-black text-white' :
                i < step ? 'bg-gold/20 text-gold' : 'text-luma-muted'
              }`}>
                {i < step && <CheckCircle size={11} />}
                {s}
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-gold' : 'bg-luma-border'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-24">

        {/* ── STEP 1: SERVICES ─────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5 mt-4">
            <div>
              <h2 className="text-xl font-bold text-luma-black">Select Services</h2>
              <p className="text-luma-muted text-sm mt-0.5">Choose one or more services</p>
            </div>

            {Object.entries(groupedServices).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="text-xs font-bold text-luma-muted uppercase tracking-wider mb-2">{cat}</h3>
                <div className="space-y-2">
                  {items.map(svc => {
                    const isSelected = selectedServices.some(s => s.id === svc.id)
                    const dur = `${Math.floor(svc.duration / 60) > 0 ? Math.floor(svc.duration / 60) + 'h ' : ''}${svc.duration % 60 > 0 ? (svc.duration % 60) + 'm' : ''}`
                    return (
                      <button
                        key={svc.id}
                        onClick={() => toggleService(svc)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected ? 'border-gold bg-gold/5 shadow-sm' : 'border-luma-border bg-white hover:border-gold/40'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-gold border-gold' : 'border-luma-border'
                        }`}>
                          {isSelected && <CheckCircle size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-luma-black text-sm">{svc.name}</p>
                          <p className="text-luma-muted text-xs mt-0.5 flex items-center gap-2">
                            <Clock size={10} className="inline" />{dur}
                          </p>
                        </div>
                        <span className="font-bold text-gold shrink-0">${svc.price}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {services.length === 0 && (
              <div className="text-center py-12 text-luma-muted">
                <p>Loading services...</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: DATE & TIME ──────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5 mt-4">
            <div>
              <h2 className="text-xl font-bold text-luma-black">Pick a Date & Time</h2>
              <p className="text-luma-muted text-sm mt-0.5">Total service time: {totalMins}</p>
            </div>

            {/* Staff selector */}
            {staff.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-luma-black mb-2">Stylist</p>
                <div className="flex gap-2 flex-wrap">
                  {staff.map(s => (
                    <button key={s.id} onClick={() => setSelectedStaff(s)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedStaff?.id === s.id ? 'border-gold bg-gold/5' : 'border-luma-border bg-white'}`}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: s.color }}>
                        {s.name.charAt(0)}
                      </div>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-luma-border p-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="p-2 hover:bg-luma-surface rounded-lg">
                  <ChevronLeft size={16} />
                </button>
                <span className="font-semibold text-luma-black">
                  {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="p-2 hover:bg-luma-surface rounded-lg">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-luma-muted py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: getFirstDayOfMonth(calMonth.getFullYear(), calMonth.getMonth()) }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(calMonth.getFullYear(), calMonth.getMonth()) }).map((_, i) => {
                  const day = new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1)
                  const isPast = day < today
                  const dow = day.getDay()
                  // If availability records exist, only allow days covered; otherwise allow Mon–Sat
                  const hasAvailRecords = availability.length > 0
                  const staffAvailOnDay = selectedStaff
                    ? availability.some(a => a.staff_id === selectedStaff.id && a.day_of_week === dow)
                    : availability.some(a => a.day_of_week === dow)
                  const isDayOff = hasAvailRecords ? !staffAvailOnDay : dow === 0
                  const isSelected = selectedDate?.toDateString() === day.toDateString()
                  const disabled = isPast || isDayOff
                  return (
                    <button
                      key={i}
                      disabled={disabled}
                      onClick={() => setSelectedDate(day)}
                      className={`aspect-square rounded-xl text-sm font-medium transition-all ${
                        isSelected ? 'bg-luma-black text-white' :
                        disabled ? 'text-luma-muted/40 cursor-not-allowed' :
                        day.toDateString() === new Date().toDateString() ? 'border-2 border-gold text-gold font-bold' :
                        'hover:bg-luma-surface text-luma-black'
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <p className="text-sm font-semibold text-luma-black mb-2">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                {loadingSlots ? (
                  <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot, i) => (
                      <button
                        key={i}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          selectedSlot?.time === slot.time ? 'bg-luma-black text-white border-luma-black' :
                          !slot.available ? 'bg-luma-surface text-luma-muted/40 border-transparent cursor-not-allowed line-through' :
                          'bg-white border-luma-border hover:border-gold text-luma-black'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                    {slots.length === 0 && <p className="col-span-4 text-center text-luma-muted text-sm py-4">No availability this day</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: YOUR INFO ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4 mt-4">
            <div>
              <h2 className="text-xl font-bold text-luma-black">Your Information</h2>
              <p className="text-luma-muted text-sm mt-0.5">We'll save this for faster booking next time</p>
            </div>
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
                <input className="input pl-9" placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
                <input className="input pl-9" type="email" placeholder="jane@example.com" value={form.email}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  onBlur={() => lookupClient(form.email)}
                />
              </div>
              {existingClient && <p className="text-xs text-green-600 mt-1">✓ Welcome back! Your info has been pre-filled.</p>}
            </div>
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
                <input className="input pl-9" type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="label">Notes for your stylist (optional)</label>
              <textarea className="input min-h-[80px] resize-none" placeholder="Anything your stylist should know..." value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </div>

            {/* How did you find us? */}
            <div className="border-t border-luma-border pt-4">
              <label className="label">How did you find us? (optional)</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'Instagram',  label: 'Instagram',  emoji: '📸', color: source === 'Instagram'  ? 'bg-pink-500 text-white border-pink-500'    : 'bg-white border-luma-border text-luma-muted hover:border-pink-300' },
                  { value: 'Facebook',   label: 'Facebook',   emoji: '👍', color: source === 'Facebook'   ? 'bg-blue-600 text-white border-blue-600'    : 'bg-white border-luma-border text-luma-muted hover:border-blue-300' },
                  { value: 'TikTok',     label: 'TikTok',     emoji: '🎵', color: source === 'TikTok'     ? 'bg-gray-900 text-white border-gray-900'    : 'bg-white border-luma-border text-luma-muted hover:border-gray-400' },
                  { value: 'Threads',    label: 'Threads',    emoji: '🧵', color: source === 'Threads'    ? 'bg-gray-800 text-white border-gray-800'    : 'bg-white border-luma-border text-luma-muted hover:border-gray-400' },
                  { value: 'Google',     label: 'Google',     emoji: '🔍', color: source === 'Google'     ? 'bg-blue-500 text-white border-blue-500'    : 'bg-white border-luma-border text-luma-muted hover:border-blue-300' },
                  { value: 'Referral',   label: 'A Friend',   emoji: '🤝', color: source === 'Referral'   ? 'bg-gold text-luma-black border-gold'       : 'bg-white border-luma-border text-luma-muted hover:border-yellow-300' },
                  { value: 'Walk-by',    label: 'Walked by',  emoji: '🚶', color: source === 'Walk-by'    ? 'bg-green-500 text-white border-green-500'  : 'bg-white border-luma-border text-luma-muted hover:border-green-300' },
                  { value: 'Other',      label: 'Other',      emoji: '💬', color: source === 'Other'      ? 'bg-luma-black text-white border-luma-black': 'bg-white border-luma-border text-luma-muted hover:border-luma-muted' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSource(prev => prev === opt.value ? '' : opt.value)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 text-xs font-semibold transition-all ${opt.color}`}
                  >
                    <span className="text-lg leading-none">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Referral field — only shown when "A Friend" is selected or ?ref= param */}
            <div className={`border-t border-luma-border pt-4 ${source !== 'Referral' && !refParam ? 'hidden' : ''}`}>
              <label className="label">Were you referred by someone? (optional)</label>
              {refParam && referrerName ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm">
                  <CheckCircle size={14} className="text-green-600 shrink-0" />
                  <span className="text-green-700 font-medium">Referred by {referrerName}</span>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Gift size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
                    <input
                      className="input pl-9"
                      placeholder="Their name or phone number"
                      value={referredBy}
                      onChange={e => { setReferredBy(e.target.value); setReferrerClientId(null); setReferrerName('') }}
                      onBlur={() => lookupReferrer(referredBy)}
                    />
                    {lookingUpReferrer && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  {referrerName && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={11} />Found: {referrerName} — we'll make sure they get credit!
                    </p>
                  )}
                  {!referrerName && referredBy.trim().length > 2 && !lookingUpReferrer && (
                    <p className="text-xs text-luma-muted mt-1">We'll note this referral — thank you!</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: CONFIRM ───────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4 mt-4">
            <div>
              <h2 className="text-xl font-bold text-luma-black">Confirm Booking</h2>
              <p className="text-luma-muted text-sm mt-0.5">Review your appointment details</p>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-luma-border p-4 space-y-3">
              <h3 className="font-semibold text-sm text-luma-black border-b border-luma-border pb-2">Appointment Summary</h3>
              {selectedServices.map(s => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-luma-black">{s.name}</span>
                  <span className="font-medium">${s.price}</span>
                </div>
              ))}
              <div className="border-t border-luma-border pt-2 flex justify-between">
                <span className="font-bold text-luma-black">Total</span>
                <span className="font-bold text-gold text-lg">${totalPrice}</span>
              </div>
              <div className="flex gap-4 text-xs text-luma-muted pt-1">
                <span className="flex items-center gap-1"><Clock size={11} />{totalMins}</span>
                <span className="flex items-center gap-1"><Calendar size={11} />
                  {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {selectedSlot?.time}
                </span>
              </div>
            </div>

            {/* Optional tip */}
            <div className="bg-white rounded-2xl border border-luma-border p-4">
              <h3 className="font-semibold text-sm text-luma-black mb-3">Add a Tip? <span className="text-luma-muted font-normal">(optional)</span></h3>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {[0, 15, 18, 20, 25].map(p => (
                  <button key={p} type="button"
                    onClick={() => { setTipPct(p); setUseCustomTip(false); setCustomTipAmt('') }}
                    className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${!useCustomTip && tipPct === p ? 'border-gold bg-gold/10 text-gold' : 'border-luma-border text-luma-muted hover:border-gold/30'}`}>
                    {p === 0 ? 'None' : `${p}%`}
                    {p > 0 && !useCustomTip && tipPct === p && (
                      <span className="block text-xs font-normal">${(totalPrice * p / 100).toFixed(2)}</span>
                    )}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => { setUseCustomTip(true); setTipPct(0) }}
                className={`w-full py-2 rounded-xl border-2 text-xs font-semibold transition-all mb-2 ${useCustomTip ? 'border-gold bg-gold/10 text-gold' : 'border-luma-border text-luma-muted hover:border-gold/30'}`}>
                Custom Amount
              </button>
              {useCustomTip && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-luma-muted">$</span>
                  <input type="number" min="0" step="0.01" autoFocus
                    className="input flex-1 text-sm"
                    placeholder="Enter tip amount"
                    value={customTipAmt}
                    onChange={e => setCustomTipAmt(e.target.value)} />
                </div>
              )}
              <p className="text-xs text-luma-muted mt-2">Tips are collected at time of service</p>
            </div>

            {/* Card on file — Stripe placeholder */}
            <div className="bg-white rounded-2xl border border-luma-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-luma-black flex items-center gap-2">
                  <CreditCard size={15} className="text-gold" />Card on File
                </h3>
                <div className="flex items-center gap-1 text-xs text-luma-muted">
                  <Lock size={11} />Secured by Stripe
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Card Number</label>
                  <div className="input bg-luma-surface text-luma-muted flex items-center gap-2 cursor-not-allowed">
                    <CreditCard size={14} className="text-luma-muted/50 shrink-0" />
                    <span className="text-sm">Payment collected day of appointment</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Expiry</label>
                    <div className="input bg-luma-surface text-luma-muted text-sm cursor-not-allowed">MM / YY</div>
                  </div>
                  <div>
                    <label className="label text-xs">CVC</label>
                    <div className="input bg-luma-surface text-luma-muted text-sm cursor-not-allowed">•••</div>
                  </div>
                </div>
                <p className="text-xs text-luma-muted flex items-center gap-1">
                  <Lock size={10} />Your card will not be charged at booking. Payment is collected at your appointment.
                </p>
              </div>
            </div>

            {/* Cancellation policy */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">72-Hour Cancellation Policy</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Cancellations or reschedules made less than 72 hours before your appointment are subject to a cancellation fee. By confirming this booking you agree to this policy.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-center text-luma-muted">
              By booking you agree to the cancellation policy above.
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-luma-border p-4">
        <div className="max-w-2xl mx-auto">
          {/* Running total */}
          {selectedServices.length > 0 && step < 3 && (
            <div className="flex justify-between text-sm mb-3 px-1">
              <span className="text-luma-muted">{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} · {totalMins}</span>
              <span className="font-bold text-gold">${totalPrice}</span>
            </div>
          )}
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 px-5 py-3 border border-luma-border rounded-xl text-sm font-semibold text-luma-black hover:bg-luma-surface transition-colors">
                <ChevronLeft size={16} />Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={
                  (step === 0 && selectedServices.length === 0) ||
                  (step === 1 && (!selectedDate || !selectedSlot)) ||
                  (step === 2 && (!form.name || !form.email || !form.phone))
                }
                className="flex-1 py-3 bg-luma-black text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-gold transition-colors"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={submitBooking}
                disabled={submitting}
                className="flex-1 py-3 bg-gold text-luma-black rounded-xl font-bold text-sm hover:bg-gold-dark transition-colors disabled:opacity-60"
              >
                {submitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>}>
      <BookingPageInner />
    </Suspense>
  )
}
