'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, Loader2, X, Clock, Plus, Trash2, RefreshCw, AlertTriangle, Timer, Bell, CheckCircle2, Star, FileText, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'

type CalView = 'day' | 'week' | 'month'

const HOUR_START = 7
const HOUR_END   = 21
const HOUR_H     = 64
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const { userId, loading: authLoading } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff]       = useState<any[]>([])
  const [clients, setClients]   = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calView, setCalView]   = useState<CalView>('week')
  const [selected, setSelected] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [reminderSent, setReminderSent]       = useState<string | null>(null)
  const [sendingReview, setSendingReview]     = useState(false)
  const [reviewSent, setReviewSent]           = useState<string | null>(null)
  const [visitNotes, setVisitNotes]           = useState('')
  const [savingNotes, setSavingNotes]         = useState(false)

  const [formBase, setFormBase] = useState({
    client_id: '', staff_id: '', date: '', time: '09:00', status: 'confirmed', notes: '', recurring_rule: 'none', buffer_minutes: '0',
  })
  const [formServices, setFormServices] = useState<
    { service_id: string; service_name: string; price: string; duration: string }[]
  >([{ service_id: '', service_name: '', price: '', duration: '60' }])

  const totalPrice    = formServices.reduce((s, sv) => s + (parseFloat(sv.price) || 0), 0)
  const totalDuration = formServices.reduce((s, sv) => s + (parseInt(sv.duration) || 0), 0)

  useEffect(() => { if (userId) fetchAll() }, [userId, selectedDate, calView])

  function getRange(): [Date, Date] {
    if (calView === 'day') {
      const s = new Date(selectedDate); s.setHours(0, 0, 0, 0)
      const e = new Date(selectedDate); e.setHours(23, 59, 59, 999)
      return [s, e]
    } else if (calView === 'week') {
      const dow = selectedDate.getDay()
      const s = new Date(selectedDate); s.setDate(s.getDate() - dow); s.setHours(0, 0, 0, 0)
      const e = new Date(s); e.setDate(e.getDate() + 6); e.setHours(23, 59, 59, 999)
      return [s, e]
    } else {
      const s = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      const e = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999)
      return [s, e]
    }
  }

  async function fetchAll() {
    setLoading(true)
    const [start, end] = getRange()
    const [apptRes, staffRes, clientRes, svcRes] = await Promise.all([
      supabase.from('appointments')
        .select('*, clients(name), staff(name,color,bg_color)')
        .eq('owner_id', userId)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time'),
      supabase.from('staff').select('*').eq('owner_id', userId).eq('active', true),
      supabase.from('clients').select('id,name').eq('owner_id', userId).order('name'),
      supabase.from('services').select('*').eq('owner_id', userId).eq('active', true).order('category').order('name'),
    ])
    setAppointments(apptRes.data || [])
    setStaff(staffRes.data || [])
    setClients(clientRes.data || [])
    setServices(svcRes.data || [])
    setLoading(false)
  }

  function navigate(dir: number) {
    const d = new Date(selectedDate)
    if (calView === 'day')       d.setDate(d.getDate() + dir)
    else if (calView === 'week') d.setDate(d.getDate() + dir * 7)
    else                         d.setMonth(d.getMonth() + dir)
    setSelectedDate(d)
  }

  function getSubtitle() {
    if (calView === 'day') {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
    if (calView === 'week') {
      const [s] = getRange()
      const e = new Date(s); e.setDate(e.getDate() + 6)
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  function pickService(idx: number, serviceId: string) {
    const svc = services.find(s => s.id === serviceId)
    setFormServices(prev => prev.map((s, i) => i === idx ? {
      service_id: serviceId,
      service_name: svc?.name || '',
      price: svc ? String(svc.price) : '',
      duration: svc ? String(svc.duration) : '60',
    } : s))
  }

  function addServiceRow() {
    setFormServices(prev => [...prev, { service_id: '', service_name: '', price: '', duration: '60' }])
  }

  function removeServiceRow(idx: number) {
    if (formServices.length === 1) return
    setFormServices(prev => prev.filter((_, i) => i !== idx))
  }

  async function saveAppointment(e: React.FormEvent) {
    e.preventDefault()
    if (!formBase.date || !formBase.time) return
    setSaving(true)
    const start_time = new Date(`${formBase.date}T${formBase.time}`).toISOString()
    const serviceSummary = formServices.filter(s => s.service_name).map(s => s.service_name).join(' + ')
    const bufferMins = parseInt(formBase.buffer_minutes) || 0
    const baseAppt = {
      owner_id: userId,
      client_id: formBase.client_id || null,
      staff_id: formBase.staff_id || null,
      service_name: serviceSummary || 'Custom',
      price: totalPrice,
      duration: totalDuration,
      status: formBase.status,
      notes: formBase.notes,
      loyalty_points: Math.round(totalPrice * 1.5),
      recurring_rule: formBase.recurring_rule,
      buffer_minutes: bufferMins,
    }
    const { data: appt, error } = await supabase.from('appointments').insert({
      ...baseAppt, start_time,
    }).select('id').single()
    if (!error && appt?.id) {
      const rows = formServices.filter(s => s.service_name).map(s => ({
        appointment_id: appt.id,
        service_id: s.service_id || null,
        service_name: s.service_name,
        price: parseFloat(s.price) || 0,
        duration: parseInt(s.duration) || 60,
      }))
      if (rows.length > 0) await supabase.from('appointment_services').insert(rows)

      // Create recurring instances (up to 8 weeks out)
      if (formBase.recurring_rule !== 'none') {
        const intervals: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30 }
        const days = intervals[formBase.recurring_rule] || 7
        const recurringInserts = []
        for (let i = 1; i <= 8; i++) {
          const d = new Date(start_time)
          if (formBase.recurring_rule === 'monthly') d.setMonth(d.getMonth() + i)
          else d.setDate(d.getDate() + days * i)
          recurringInserts.push({ ...baseAppt, start_time: d.toISOString(), recurring_parent: appt.id })
        }
        await supabase.from('appointments').insert(recurringInserts)
      }

      setShowModal(false)
      resetForm()
      fetchAll()
    }
    setSaving(false)
  }

  function resetForm() {
    setFormBase({ client_id: '', staff_id: '', date: selectedDate.toISOString().split('T')[0], time: '09:00', status: 'confirmed', notes: '', recurring_rule: 'none', buffer_minutes: '0' })
    setFormServices([{ service_id: '', service_name: '', price: '', duration: '60' }])
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    fetchAll()
    setSelected((prev: any) => prev ? { ...prev, status } : null)
  }

  function selectAppointment(apt: any) {
    if (selected?.id === apt.id) {
      setSelected(null)
    } else {
      setSelected(apt)
      setVisitNotes(apt.visit_notes || '')
    }
  }

  async function deleteAppointment(id: string) {
    await supabase.from('appointments').delete().eq('id', id)
    setSelected(null)
    fetchAll()
  }

  async function sendReminder(apptId: string) {
    setSendingReminder(true)
    try {
      const res = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId, ownerId: userId }),
      })
      const data = await res.json()
      if (res.ok) {
        setReminderSent(apptId)
        setTimeout(() => setReminderSent(null), 4000)
      } else {
        alert(data.error || 'Failed to send reminder')
      }
    } catch {
      alert('Network error sending reminder')
    }
    setSendingReminder(false)
  }

  async function sendReview(apptId: string) {
    setSendingReview(true)
    try {
      // Get google review URL from user metadata
      const { data: { user } } = await supabase.auth.getUser()
      const reviewUrl = user?.user_metadata?.google_review_url || ''
      const res = await fetch('/api/send-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId, ownerId: userId, reviewUrl }),
      })
      const data = await res.json()
      if (res.ok) {
        setReviewSent(apptId)
        setTimeout(() => setReviewSent(null), 4000)
      } else {
        alert(data.error || 'Failed to send review request')
      }
    } catch {
      alert('Network error sending review request')
    }
    setSendingReview(false)
  }

  async function saveVisitNotes(apptId: string) {
    setSavingNotes(true)
    await supabase.from('appointments').update({ visit_notes: visitNotes }).eq('id', apptId)
    setSelected((prev: any) => prev ? { ...prev, visit_notes: visitNotes } : null)
    setSavingNotes(false)
  }

  // ── Day view ─────────────────────────────────────────────────────────
  function renderDayView() {
    const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
    const now = new Date()
    const isToday = selectedDate.toDateString() === now.toDateString()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const nowOffset = ((nowMin - HOUR_START * 60) / 60) * HOUR_H
    const gridHeight = (HOUR_END - HOUR_START) * HOUR_H

    return (
      <div className="flex-1 overflow-auto">
        <div className="relative" style={{ height: `${gridHeight}px` }}>
          {hours.map(h => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-luma-border"
              style={{ top: `${(h - HOUR_START) * HOUR_H}px`, height: `${HOUR_H}px` }}
            >
              <div className="flex h-full">
                <div className="w-16 shrink-0 flex items-start pt-1.5 justify-end pr-3">
                  <span className="text-xs text-luma-muted whitespace-nowrap">
                    {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                  </span>
                </div>
                <div className="flex-1 border-l border-luma-border" />
              </div>
            </div>
          ))}

          {isToday && nowOffset >= 0 && nowOffset <= gridHeight && (
            <div
              className="absolute left-16 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: `${nowOffset}px` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
              <div className="flex-1 border-t-2 border-red-500" />
            </div>
          )}

          {appointments.map(apt => {
            const d = new Date(apt.start_time)
            const startMin = d.getHours() * 60 + d.getMinutes()
            const offsetMin = startMin - HOUR_START * 60
            if (offsetMin < 0 || offsetMin >= (HOUR_END - HOUR_START) * 60) return null
            const top    = (offsetMin / 60) * HOUR_H
            const height = Math.max((apt.duration / 60) * HOUR_H, 28)
            return (
              <div
                key={apt.id}
                onClick={() => setSelected(apt.id === selected?.id ? null : apt)}
                className="absolute cursor-pointer rounded-lg px-2 py-1 border-l-4 hover:opacity-90 transition-opacity z-10 overflow-hidden"
                style={{
                  top: `${top + 1}px`,
                  height: `${height - 2}px`,
                  left: '68px',
                  right: '12px',
                  backgroundColor: apt.staff?.bg_color || '#FBF5E8',
                  borderColor: apt.staff?.color || '#C9A96E',
                  outline: selected?.id === apt.id ? `2px solid ${apt.staff?.color || '#C9A96E'}` : 'none',
                }}
              >
                <p className="text-xs font-bold text-luma-black truncate leading-tight">
                  {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} &middot; {apt.clients?.name || 'Walk-in'}
                </p>
                {height > 40 && <p className="text-xs text-luma-muted truncate leading-tight">{apt.service_name}</p>}
                {height > 56 && <p className="text-xs text-luma-muted/70 truncate leading-tight">{apt.staff?.name || 'Unassigned'}</p>}
              </div>
            )
          })}

          {appointments.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-luma-muted ml-16">
                <Clock size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No appointments this day</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Week view ─────────────────────────────────────────────────────────
  function renderWeekView() {
    const [weekStart] = getRange()
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(d.getDate() + i); return d
    })
    const todayStr = new Date().toDateString()

    return (
      <div className="flex-1 overflow-auto flex flex-col">
        <div className="grid grid-cols-7 border-b border-luma-border shrink-0 bg-luma-surface sticky top-0 z-10">
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === todayStr
            return (
              <button
                key={i}
                onClick={() => { setSelectedDate(day); setCalView('day') }}
                className={clsx(
                  'py-3 text-center hover:bg-white transition-colors border-r border-luma-border last:border-r-0',
                  isToday && 'bg-gold/5'
                )}
              >
                <p className="text-xs text-luma-muted font-medium">{DAYS_SHORT[i]}</p>
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 text-sm font-bold',
                  isToday ? 'bg-gold text-white' : 'text-luma-black'
                )}>
                  {day.getDate()}
                </div>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-7 divide-x divide-luma-border flex-1">
          {weekDays.map((day, i) => {
            const dayStr   = day.toDateString()
            const isToday  = dayStr === todayStr
            const dayAppts = appointments.filter(a => new Date(a.start_time).toDateString() === dayStr)
            return (
              <div key={i} className={clsx('p-2 space-y-1.5', isToday && 'bg-gold/5')}>
                {dayAppts.length === 0 ? (
                  <div className="flex items-center justify-center h-20">
                    <span className="text-xs text-luma-muted/30">—</span>
                  </div>
                ) : (
                  dayAppts.map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => setSelected(apt.id === selected?.id ? null : apt)}
                      className={clsx(
                        'cursor-pointer rounded-lg p-1.5 border-l-2 hover:opacity-80 transition-opacity',
                        selected?.id === apt.id && 'ring-1 ring-offset-1 ring-gold'
                      )}
                      style={{
                        backgroundColor: apt.staff?.bg_color || '#FBF5E8',
                        borderColor: apt.staff?.color || '#C9A96E',
                      }}
                    >
                      <p className="text-xs font-bold text-luma-black truncate leading-tight">
                        {new Date(apt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                      <p className="text-xs text-luma-muted truncate leading-tight">{apt.clients?.name || 'Walk-in'}</p>
                      <p className="text-xs text-luma-muted/70 truncate leading-tight">{apt.service_name}</p>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Month view ────────────────────────────────────────────────────────
  function renderMonthView() {
    const year      = selectedDate.getFullYear()
    const month     = selectedDate.getMonth()
    const firstDay  = new Date(year, month, 1).getDay()
    const daysInMon = new Date(year, month + 1, 0).getDate()
    const todayStr  = new Date().toDateString()

    const cells: (Date | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMon }, (_, i) => new Date(year, month, i + 1)),
    ]
    while (cells.length < 42) cells.push(null)

    return (
      <div className="flex-1 overflow-auto p-3">
        <div className="grid grid-cols-7 mb-1">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-luma-muted py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} className="min-h-[90px]" />
            const dayStr   = day.toDateString()
            const isToday  = dayStr === todayStr
            const dayAppts = appointments.filter(a => new Date(a.start_time).toDateString() === dayStr)
            const extra    = dayAppts.length - 3

            return (
              <div
                key={idx}
                onClick={() => { setSelectedDate(day); setCalView('day') }}
                className={clsx(
                  'min-h-[90px] rounded-xl p-2 cursor-pointer transition-all border',
                  isToday
                    ? 'border-gold bg-gold/5 shadow-sm'
                    : 'border-transparent hover:border-luma-border hover:bg-white'
                )}
              >
                <span className={clsx(
                  'text-sm font-bold block mb-1 leading-none',
                  isToday ? 'text-gold' : 'text-luma-black'
                )}>
                  {day.getDate()}
                </span>
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 3).map(apt => (
                    <div
                      key={apt.id}
                      onClick={e => { e.stopPropagation(); setSelected(apt.id === selected?.id ? null : apt) }}
                      className="text-xs rounded px-1 py-0.5 truncate font-medium hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: apt.staff?.bg_color || '#FBF5E8', color: apt.staff?.color || '#9a7a4a' }}
                    >
                      {new Date(apt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} {apt.clients?.name || 'Walk-in'}
                    </div>
                  ))}
                  {extra > 0 && (
                    <p className="text-xs text-luma-muted px-1">+{extra} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (authLoading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin text-gold" size={32} />
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      <Topbar
        title="Calendar"
        subtitle={getSubtitle()}
        action={{ label: 'New Appointment', onClick: () => { resetForm(); setShowModal(true) } }}
      />

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Navigation bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-luma-border bg-luma-surface shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg border border-luma-border hover:bg-white transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1.5 text-xs font-semibold border border-luma-border rounded-lg hover:bg-white transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigate(1)}
                className="p-1.5 rounded-lg border border-luma-border hover:bg-white transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Day / Week / Month toggle */}
            <div className="flex items-center gap-0.5 bg-white border border-luma-border rounded-xl p-1">
              {(['day', 'week', 'month'] as CalView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setCalView(v)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
                    calView === v
                      ? 'bg-luma-black text-white shadow-sm'
                      : 'text-luma-muted hover:text-luma-black'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-gold" size={28} />
            </div>
          ) : (
            <>
              {calView === 'day'   && renderDayView()}
              {calView === 'week'  && renderWeekView()}
              {calView === 'month' && renderMonthView()}
            </>
          )}
        </div>

        {/* Appointment detail panel */}
        {selected && (
          <div className="w-72 shrink-0 border-l border-luma-border bg-white p-5 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Appointment</h3>
              <button onClick={() => setSelected(null)} className="text-luma-muted hover:text-luma-black">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: selected.staff?.bg_color || '#FBF5E8' }}>
              <p className="font-bold text-luma-black text-lg">{selected.clients?.name || 'Walk-in'}</p>
              <p className="text-sm text-luma-muted">{selected.service_name}</p>
              <p className="text-xs text-luma-muted mt-1">
                {new Date(selected.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' · '}
                {new Date(selected.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                {' · '}{selected.duration}min
              </p>
            </div>
            <div className="space-y-2 text-sm mb-4">
              {[
                ['Stylist', selected.staff?.name || 'Unassigned'],
                ['Price',   `$${selected.price}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-luma-muted">{k}</span>
                  <span className="font-medium text-luma-black capitalize">{v}</span>
                </div>
              ))}
              {/* Status badge */}
              <div className="flex justify-between items-center">
                <span className="text-luma-muted">Status</span>
                <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full capitalize', {
                  'bg-green-100 text-green-700': selected.status === 'confirmed' || selected.status === 'arrived',
                  'bg-blue-100 text-blue-700': selected.status === 'completed',
                  'bg-red-100 text-red-600': selected.status === 'cancelled' || selected.status === 'no_show',
                  'bg-yellow-100 text-yellow-700': selected.status === 'pending',
                })}>
                  {selected.status === 'no_show' ? 'No-show' : selected.status}
                </span>
              </div>
              {/* Recurring badge */}
              {selected.recurring_rule && selected.recurring_rule !== 'none' && (
                <div className="flex justify-between items-center">
                  <span className="text-luma-muted">Repeats</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-gold capitalize">
                    <RefreshCw size={10} />{selected.recurring_rule}
                  </span>
                </div>
              )}
              {/* Buffer badge */}
              {selected.buffer_minutes > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-luma-muted">Buffer</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-luma-muted">
                    <Timer size={10} />{selected.buffer_minutes}min cleanup
                  </span>
                </div>
              )}
              {selected.notes && (
                <div className="pt-2 border-t border-luma-border">
                  <p className="text-xs text-luma-muted">{selected.notes}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-luma-muted mb-1">Update status</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { val: 'confirmed', label: 'Confirmed' },
                  { val: 'arrived',   label: 'Arrived' },
                  { val: 'completed', label: 'Completed' },
                  { val: 'cancelled', label: 'Cancelled' },
                  { val: 'no_show',   label: 'No-show' },
                  { val: 'pending',   label: 'Pending' },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => updateStatus(selected.id, val)}
                    className={clsx(
                      'py-1.5 rounded-lg text-xs font-medium border transition-all',
                      selected.status === val
                        ? 'bg-gold border-gold text-luma-black'
                        : 'border-luma-border text-luma-muted hover:border-gold/40'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Send reminder */}
              {selected.client_id && (
                <button
                  onClick={() => sendReminder(selected.id)}
                  disabled={sendingReminder}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    reminderSent === selected.id
                      ? 'bg-green-50 text-green-600'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {reminderSent === selected.id
                    ? <><CheckCircle2 size={14} />Reminder Sent!</>
                    : sendingReminder
                    ? <><Loader2 size={14} className="animate-spin" />Sending…</>
                    : <><Bell size={14} />Send Reminder</>
                  }
                </button>
              )}
              {/* Send review request — only for completed appointments with a client */}
              {selected.client_id && selected.status === 'completed' && (
                <button
                  onClick={() => sendReview(selected.id)}
                  disabled={sendingReview || !!selected.review_sent_at}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    reviewSent === selected.id || selected.review_sent_at
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  {reviewSent === selected.id
                    ? <><CheckCircle2 size={14} />Review Sent!</>
                    : selected.review_sent_at
                    ? <><Star size={14} />Review Requested</>
                    : sendingReview
                    ? <><Loader2 size={14} className="animate-spin" />Sending…</>
                    : <><Star size={14} />Request Google Review</>
                  }
                </button>
              )}

              {/* Visit notes */}
              <div className="border-t border-luma-border pt-3 mt-1">
                <label className="text-xs font-semibold text-luma-muted flex items-center gap-1 mb-1.5">
                  <FileText size={11} />Visit Notes / Formula
                </label>
                <textarea
                  rows={3}
                  className="input w-full text-xs resize-none"
                  placeholder="Color formula, client preferences, notes for next visit..."
                  value={visitNotes}
                  onChange={e => setVisitNotes(e.target.value)}
                />
                <button
                  onClick={() => saveVisitNotes(selected.id)}
                  disabled={savingNotes}
                  className="mt-1.5 w-full py-1.5 bg-luma-surface border border-luma-border rounded-lg text-xs font-semibold text-luma-black hover:bg-luma-border transition-colors disabled:opacity-60"
                >
                  {savingNotes ? 'Saving…' : 'Save Notes'}
                </button>
              </div>

              {/* Checkout button — sends appointment to POS */}
              <button
                onClick={() => {
                  const params = new URLSearchParams()
                  if (selected.client_id) params.set('clientId', selected.client_id)
                  if (selected.clients?.name) params.set('clientName', selected.clients.name)
                  // Pass all services as JSON
                  const services = Array.isArray(selected.services)
                    ? selected.services
                    : [{ name: selected.service_name, price: selected.price }]
                  params.set('services', JSON.stringify(services))
                  if (selected.staff_id) params.set('staffId', selected.staff_id)
                  params.set('appointmentId', selected.id)
                  router.push(`/pos?${params.toString()}`)
                }}
                className="w-full py-2.5 bg-gold text-luma-black rounded-xl text-sm font-bold hover:bg-gold-dark transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={15} /> Checkout
              </button>

              <button
                onClick={() => deleteAppointment(selected.id)}
                className="w-full py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                Delete Appointment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New appointment modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-luma-border sticky top-0 bg-white z-10">
              <h3 className="font-bold text-luma-black">New Appointment</h3>
              <button onClick={() => setShowModal(false)} className="text-luma-muted hover:text-luma-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveAppointment} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date" required
                    value={formBase.date}
                    onChange={e => setFormBase(f => ({ ...f, date: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Time *</label>
                  <input
                    type="time" required
                    value={formBase.time}
                    onChange={e => setFormBase(f => ({ ...f, time: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Client</label>
                  <select
                    value={formBase.client_id}
                    onChange={e => setFormBase(f => ({ ...f, client_id: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="">Walk-in</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Stylist</label>
                  <select
                    value={formBase.staff_id}
                    onChange={e => setFormBase(f => ({ ...f, staff_id: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="">Unassigned</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Services *</label>
                  <button type="button" onClick={addServiceRow} className="flex items-center gap-1 text-xs text-gold font-semibold hover:text-gold-dark">
                    <Plus size={13} />Add service
                  </button>
                </div>
                <div className="space-y-2">
                  {formServices.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <select
                          value={row.service_id}
                          onChange={e => pickService(idx, e.target.value)}
                          className="input w-full text-sm"
                        >
                          <option value="">Select service...</option>
                          {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name} — ${s.price} ({s.duration}min)</option>
                          ))}
                        </select>
                        {row.service_id && (
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <input
                                type="number" min="0" step="0.01"
                                value={row.price}
                                onChange={e => setFormServices(prev => prev.map((s, i) => i === idx ? { ...s, price: e.target.value } : s))}
                                className="input w-full text-sm" placeholder="Price $"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="number" min="5" step="5"
                                value={row.duration}
                                onChange={e => setFormServices(prev => prev.map((s, i) => i === idx ? { ...s, duration: e.target.value } : s))}
                                className="input w-full text-sm" placeholder="Mins"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {formServices.length > 1 && (
                        <button type="button" onClick={() => removeServiceRow(idx)} className="p-2 text-luma-muted hover:text-red-500 mt-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {formServices.some(s => s.price) && (
                  <div className="mt-3 flex justify-between text-sm bg-luma-surface rounded-xl px-4 py-2">
                    <span className="text-luma-muted">Total &middot; {totalDuration}min</span>
                    <span className="font-bold text-gold">${totalPrice.toFixed(0)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formBase.notes}
                  onChange={e => setFormBase(f => ({ ...f, notes: e.target.value }))}
                  className="input w-full resize-none" rows={2}
                  placeholder="Special requests, color formula reminders..."
                />
              </div>

              {/* Recurring + Buffer + Status row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label flex items-center gap-1"><RefreshCw size={11} />Repeat</label>
                  <select
                    value={formBase.recurring_rule}
                    onChange={e => setFormBase(f => ({ ...f, recurring_rule: e.target.value }))}
                    className="input w-full text-sm"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every 2 weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Timer size={11} />Buffer (min)</label>
                  <input
                    type="number" min="0" step="5"
                    value={formBase.buffer_minutes}
                    onChange={e => setFormBase(f => ({ ...f, buffer_minutes: e.target.value }))}
                    className="input w-full text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><AlertTriangle size={11} />Status</label>
                  <select
                    value={formBase.status}
                    onChange={e => setFormBase(f => ({ ...f, status: e.target.value }))}
                    className="input w-full text-sm"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No-show</option>
                  </select>
                </div>
              </div>

              {formBase.recurring_rule !== 'none' && (
                <div className="flex items-center gap-2 p-3 bg-gold/5 border border-gold/20 rounded-xl text-xs text-luma-muted">
                  <RefreshCw size={12} className="text-gold shrink-0" />
                  Creates 8 recurring appointments. You can cancel individual ones from the calendar.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-luma-border rounded-xl text-sm font-semibold text-luma-black hover:bg-luma-surface">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formBase.date || !formBase.time}
                  className="flex-1 py-2.5 bg-luma-black text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-gold transition-colors"
                >
                  {saving ? 'Saving...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
