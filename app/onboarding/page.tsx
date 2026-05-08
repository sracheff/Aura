'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sparkles, Building2, Users, Scissors, Clock, CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Your Salon',   icon: Building2,  title: 'Tell us about your salon',        subtitle: 'This info appears on your booking page' },
  { id: 2, label: 'Your Team',    icon: Users,      title: 'Add your first staff member',     subtitle: 'You can add more team members later' },
  { id: 3, label: 'Services',     icon: Scissors,   title: 'Add your core services',          subtitle: 'Set up the services you offer' },
  { id: 4, label: 'Hours',        icon: Clock,      title: 'Set your business hours',         subtitle: 'Clients will see these on your booking page' },
  { id: 5, label: 'All Set!',     icon: CheckCircle2, title: 'You\'re ready to go! 🎉',       subtitle: 'Your 14-day free trial has started' },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_HOURS = DAYS.map((d, i) => ({
  day: d,
  enabled: i < 5, // Mon–Fri on by default
  open: '09:00',
  close: '18:00',
}))

const SERVICE_PRESETS = ['Haircut', 'Color', 'Highlights', 'Blowout', 'Treatment', 'Trim']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [salonId, setSalonId] = useState<string | null>(null)

  // Step 1 – Salon info
  const [salonName, setSalonName] = useState('')
  const [salonAddress, setSalonAddress] = useState('')
  const [salonPhone, setSalonPhone] = useState('')

  // Step 2 – Staff
  const [staffName, setStaffName] = useState('')
  const [staffRole, setStaffRole] = useState('Stylist')

  // Step 3 – Services
  const [services, setServices] = useState([
    { name: 'Haircut', price: '45', duration: '60' },
  ])

  // Step 4 – Hours
  const [hours, setHours] = useState(DEFAULT_HOURS)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      // Load existing salon if any
      supabase.from('salons').select('id, name, address, phone, onboarding_complete')
        .eq('owner_id', data.user.id).single()
        .then(({ data: salon }) => {
          if (salon) {
            setSalonId(salon.id)
            if (salon.onboarding_complete) router.push('/dashboard')
            if (salon.name) setSalonName(salon.name)
            if (salon.address) setSalonAddress(salon.address)
            if (salon.phone) setSalonPhone(salon.phone)
          }
        })
    })
  }, [router])

  const addService = () => setServices(s => [...s, { name: '', price: '', duration: '60' }])
  const removeService = (i: number) => setServices(s => s.filter((_, idx) => idx !== i))
  const updateService = (i: number, field: string, val: string) =>
    setServices(s => s.map((svc, idx) => idx === i ? { ...svc, [field]: val } : svc))

  const toggleDay = (i: number) =>
    setHours(h => h.map((d, idx) => idx === i ? { ...d, enabled: !d.enabled } : d))
  const updateHour = (i: number, field: 'open' | 'close', val: string) =>
    setHours(h => h.map((d, idx) => idx === i ? { ...d, [field]: val } : d))

  const canNext = () => {
    if (step === 1) return salonName.trim().length > 0
    if (step === 2) return staffName.trim().length > 0
    if (step === 3) return services.some(s => s.name.trim())
    return true
  }

  const handleNext = async () => {
    if (step === 1) await saveStep1()
    else if (step === 2) await saveStep2()
    else if (step === 3) await saveStep3()
    else if (step === 4) await saveStep4()
    if (step < 5) setStep(s => s + 1)
  }

  const handleFinish = () => router.push('/dashboard')

  async function saveStep1() {
    if (!userId) return
    setSaving(true)
    const slug = salonName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data } = await supabase.from('salons')
      .upsert({ owner_id: userId, name: salonName, address: salonAddress, phone: salonPhone, slug, onboarding_step: 1 }, { onConflict: 'owner_id' })
      .select('id').single()
    if (data) setSalonId(data.id)
    setSaving(false)
  }

  async function saveStep2() {
    if (!userId) return
    setSaving(true)
    const COLORS = ['#C9A84C', '#E8A0BF', '#8B7355', '#A8D8B9', '#B0C4DE', '#DDA0DD']
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    await supabase.from('staff').upsert({
      owner_id: userId, name: staffName, role: staffRole,
      color, bg_color: color + '20', active: true, commission_rate: 50,
    }, { onConflict: 'owner_id,name' })
    setSaving(false)
  }

  async function saveStep3() {
    if (!userId) return
    setSaving(true)
    const validServices = services.filter(s => s.name.trim())
    const rows = validServices.map(s => ({
      owner_id: userId,
      name: s.name,
      price: parseFloat(s.price) || 0,
      duration: parseInt(s.duration) || 60,
      commission_rate: 50,
      active: true,
    }))
    if (rows.length > 0) {
      await supabase.from('services').upsert(rows, { onConflict: 'owner_id,name' })
    }
    setSaving(false)
  }

  async function saveStep4() {
    if (!userId) return
    setSaving(true)
    // Get first staff member id
    const { data: staffRow } = await supabase.from('staff')
      .select('id').eq('owner_id', userId).limit(1).single()
    if (staffRow) {
      const enabledDays = hours
        .map((h, i) => ({ day: i + 1 === 7 ? 0 : i + 1, ...h })) // 0=Sun, 1=Mon...
        .filter(h => h.enabled)
        .map(h => ({ staff_id: staffRow.id, owner_id: userId, day_of_week: h.day, open_time: h.open, close_time: h.close }))
      if (enabledDays.length > 0) {
        await supabase.from('staff_availability').upsert(enabledDays, { onConflict: 'staff_id,day_of_week' })
      }
    }
    // Mark onboarding complete
    await supabase.from('salons').update({ onboarding_complete: true, onboarding_step: 4 }).eq('owner_id', userId)
    setSaving(false)
  }

  const StepIcon = STEPS[step - 1].icon
  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-luma-black flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
          <Sparkles size={18} className="text-luma-black" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight">LUMA</span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex justify-between mb-2">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s.id < step ? 'bg-gold text-luma-black' :
                s.id === step ? 'bg-gold/30 text-gold border-2 border-gold' :
                'bg-white/10 text-luma-muted'
              }`}>
                {s.id < step ? '✓' : s.id}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${s.id === step ? 'text-gold' : 'text-luma-muted'}`}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-luma-card rounded-2xl p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
            <StepIcon size={20} className="text-gold" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">{STEPS[step - 1].title}</h2>
            <p className="text-luma-muted text-sm">{STEPS[step - 1].subtitle}</p>
          </div>
        </div>

        {/* STEP 1: Salon Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">Salon name <span className="text-red-400">*</span></label>
              <input className="input" value={salonName} onChange={e => setSalonName(e.target.value)} placeholder="e.g. Luminary Salon" />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={salonAddress} onChange={e => setSalonAddress(e.target.value)} placeholder="123 Main St, New York, NY" />
            </div>
            <div>
              <label className="label">Phone number</label>
              <input className="input" value={salonPhone} onChange={e => setSalonPhone(e.target.value)} placeholder="(212) 555-0100" />
            </div>
          </div>
        )}

        {/* STEP 2: Staff */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-gold/10 rounded-xl border border-gold/20 text-sm text-gold mb-2">
              You can add your full team after setup — just add yourself or your lead stylist for now.
            </div>
            <div>
              <label className="label">Staff member name <span className="text-red-400">*</span></label>
              <input className="input" value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="e.g. Jessica" />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={staffRole} onChange={e => setStaffRole(e.target.value)}>
                {['Owner', 'Stylist', 'Colorist', 'Assistant', 'Manager'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: Services */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {SERVICE_PRESETS.map(p => (
                <button key={p} onClick={() => { if (!services.find(s => s.name === p)) setServices(s => [...s, { name: p, price: '45', duration: '60' }]) }}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-luma-muted text-xs hover:border-gold hover:text-gold transition-colors">
                  + {p}
                </button>
              ))}
            </div>
            {services.map((svc, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="input flex-1" value={svc.name} onChange={e => updateService(i, 'name', e.target.value)} placeholder="Service name" />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted text-sm">$</span>
                  <input className="input w-20 pl-6" value={svc.price} onChange={e => updateService(i, 'price', e.target.value)} placeholder="45" />
                </div>
                <select className="input w-24 text-sm" value={svc.duration} onChange={e => updateService(i, 'duration', e.target.value)}>
                  {['30','45','60','75','90','120'].map(d => <option key={d} value={d}>{d}m</option>)}
                </select>
                {services.length > 1 && <button onClick={() => removeService(i)} className="text-luma-muted hover:text-red-400 transition-colors"><Trash2 size={15} /></button>}
              </div>
            ))}
            <button onClick={addService} className="flex items-center gap-2 text-gold text-sm hover:opacity-80 transition-opacity mt-2">
              <Plus size={15} /> Add service
            </button>
          </div>
        )}

        {/* STEP 4: Hours */}
        {step === 4 && (
          <div className="space-y-2">
            {hours.map((h, i) => (
              <div key={h.day} className="flex items-center gap-3">
                <button onClick={() => toggleDay(i)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${h.enabled ? 'bg-gold border-gold text-luma-black' : 'border-white/20 text-transparent'}`}>
                  ✓
                </button>
                <span className={`w-24 text-sm ${h.enabled ? 'text-white' : 'text-luma-muted'}`}>{h.day}</span>
                {h.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={h.open} onChange={e => updateHour(i, 'open', e.target.value)}
                      className="input py-1 text-sm flex-1" />
                    <span className="text-luma-muted text-xs">to</span>
                    <input type="time" value={h.close} onChange={e => updateHour(i, 'close', e.target.value)}
                      className="input py-1 text-sm flex-1" />
                  </div>
                ) : (
                  <span className="text-luma-muted text-sm">Closed</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP 5: Done */}
        {step === 5 && (
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-gold" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Welcome to LUMA!</h3>
            <p className="text-luma-muted text-sm mb-6">Your salon is set up and your <span className="text-gold font-semibold">14-day free trial</span> has started. No credit card needed yet.</p>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              {['Booking page live', 'SMS reminders ready', 'Reports & analytics'].map(f => (
                <div key={f} className="p-3 bg-gold/10 rounded-xl border border-gold/20">
                  <div className="text-gold font-semibold text-xs">✓ {f}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 && step < 5 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-luma-muted hover:text-white transition-colors text-sm">
              <ChevronLeft size={16} /> Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button onClick={handleNext} disabled={!canNext() || saving}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
              {saving ? 'Saving...' : 'Continue'} <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleFinish} className="btn btn-primary w-full">
              Go to my dashboard →
            </button>
          )}
        </div>
      </div>

      <p className="text-luma-muted text-xs mt-6">© 2026 LUMA Technologies</p>
    </div>
  )
}
