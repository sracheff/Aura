'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import {
  Clock, Plus, Trash2, X, CheckCircle,
  ChevronLeft, ChevronRight, AlertCircle, Calendar
} from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Schedule = {
  id?: string
  day_of_week: number
  is_working: boolean
  start_time: string
  end_time: string
}

type TimeBlock = {
  id: string
  staff_id: string
  date: string
  start_time: string | null
  end_time: string | null
  reason: string | null
  type: string
}

type Staff = { id: string; name: string; color: string; bg_color: string }

const DEFAULT_SCHEDULE: Schedule[] = [
  { day_of_week: 0, is_working: false, start_time: '09:00', end_time: '17:00' },
  { day_of_week: 1, is_working: true,  start_time: '09:00', end_time: '17:00' },
  { day_of_week: 2, is_working: true,  start_time: '09:00', end_time: '17:00' },
  { day_of_week: 3, is_working: true,  start_time: '09:00', end_time: '17:00' },
  { day_of_week: 4, is_working: true,  start_time: '09:00', end_time: '17:00' },
  { day_of_week: 5, is_working: true,  start_time: '09:00', end_time: '17:00' },
  { day_of_week: 6, is_working: true,  start_time: '09:00', end_time: '14:00' },
]

const BLOCK_TYPES = [
  { value: 'block',          label: 'Time Block',      desc: 'Block a specific time slot',        color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'day_off',        label: 'Day Off',          desc: 'Full day unavailable',              color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'vacation',       label: 'Vacation',         desc: 'Out of office',                     color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'exception_open', label: 'Special Opening',  desc: 'Open on a normally closed day',     color: 'text-green-600 bg-green-50 border-green-200' },
]

function typeConfig(type: string) {
  return BLOCK_TYPES.find(t => t.value === type) || BLOCK_TYPES[0]
}

export default function SchedulePage() {
  const { userId, loading } = useAuth()
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [schedule, setSchedule] = useState<Schedule[]>(DEFAULT_SCHEDULE.map(d => ({ ...d })))
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date())
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockForm, setBlockForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'block',
    start_time: '12:00',
    end_time: '14:00',
    reason: '',
    full_day: false,
  })

  useEffect(() => { if (userId) fetchStaff() }, [userId])
  useEffect(() => { if (selectedStaff) { fetchSchedule(); fetchBlocks() } }, [selectedStaff])

  async function fetchStaff() {
    const { data } = await supabase.from('staff').select('id,name,color,bg_color').eq('owner_id', userId).eq('active', true).order('name')
    if (data && data.length > 0) { setStaff(data); setSelectedStaff(data[0]) }
  }

  async function fetchSchedule() {
    if (!selectedStaff) return
    const { data } = await supabase.from('staff_schedules').select('*').eq('staff_id', selectedStaff.id).order('day_of_week')
    if (data && data.length === 7) {
      setSchedule(data.map(d => ({ id: d.id, day_of_week: d.day_of_week, is_working: d.is_working, start_time: d.start_time, end_time: d.end_time })))
    } else {
      setSchedule(DEFAULT_SCHEDULE.map(d => ({ ...d })))
    }
  }

  async function fetchBlocks() {
    if (!selectedStaff) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('time_blocks').select('*').eq('staff_id', selectedStaff.id).gte('date', today).order('date')
    if (data) setBlocks(data)
  }

  async function saveSchedule() {
    if (!selectedStaff) return
    setSaving(true)
    for (const day of schedule) {
      const payload = {
        owner_id: userId,
        staff_id: selectedStaff.id,
        day_of_week: day.day_of_week,
        is_working: day.is_working,
        start_time: day.start_time,
        end_time: day.end_time,
      }
      if (day.id) {
        await supabase.from('staff_schedules').update(payload).eq('id', day.id)
      } else {
        await supabase.from('staff_schedules').upsert(payload, { onConflict: 'staff_id,day_of_week' })
      }
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    fetchSchedule()
  }

  async function addBlock() {
    if (!selectedStaff || !blockForm.date) return
    const payload = {
      owner_id: userId,
      staff_id: selectedStaff.id,
      date: blockForm.date,
      start_time: blockForm.full_day ? null : blockForm.start_time,
      end_time: blockForm.full_day ? null : blockForm.end_time,
      reason: blockForm.reason || null,
      type: blockForm.type,
    }
    await supabase.from('time_blocks').insert(payload)
    setShowBlockModal(false)
    setBlockForm({ date: new Date().toISOString().split('T')[0], type: 'block', start_time: '12:00', end_time: '14:00', reason: '', full_day: false })
    fetchBlocks()
  }

  async function deleteBlock(id: string) {
    await supabase.from('time_blocks').delete().eq('id', id)
    fetchBlocks()
  }

  function updateDay(dayIdx: number, field: keyof Schedule, value: any) {
    setSchedule(prev => prev.map((d, i) => i === dayIdx ? { ...d, [field]: value } : d))
  }

  // Calendar helpers
  function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
  function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay() }

  const blockedDates = new Set(blocks.map(b => b.date))
  const today = new Date(); today.setHours(0, 0, 0, 0)

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Schedule" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Staff selector */}
        {staff.length === 0 ? (
          <div className="bg-white rounded-2xl border border-luma-border p-8 text-center text-luma-muted">
            <Clock size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No staff added yet</p>
            <p className="text-sm mt-1">Add staff members first from the Staff page</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 flex-wrap">
              {staff.map(s => (
                <button key={s.id} onClick={() => setSelectedStaff(s)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${selectedStaff?.id === s.id ? 'border-gold shadow-sm' : 'border-luma-border bg-white hover:border-gold/40'}`}
                  style={selectedStaff?.id === s.id ? { backgroundColor: s.bg_color } : {}}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: s.color }}>
                    {s.name.charAt(0)}
                  </div>
                  {s.name}
                </button>
              ))}
            </div>

            {selectedStaff && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Weekly schedule — left */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-luma-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-luma-border flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-luma-black">Weekly Schedule</h2>
                      <p className="text-xs text-luma-muted mt-0.5">Set {selectedStaff.name}'s regular working hours</p>
                    </div>
                    <button onClick={saveSchedule} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-luma-black text-white rounded-xl text-sm font-semibold hover:bg-gold transition-colors disabled:opacity-60">
                      {saved ? <><CheckCircle size={14} />Saved!</> : saving ? 'Saving...' : 'Save Schedule'}
                    </button>
                  </div>

                  <div className="divide-y divide-luma-border">
                    {schedule.map((day, i) => (
                      <div key={day.day_of_week} className={`flex items-center gap-4 px-5 py-3 transition-colors ${!day.is_working ? 'bg-luma-surface/50' : ''}`}>
                        {/* Day toggle */}
                        <div className="w-24 shrink-0">
                          <button
                            onClick={() => updateDay(i, 'is_working', !day.is_working)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${day.is_working ? 'bg-gold' : 'bg-luma-border'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${day.is_working ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                        <span className={`w-20 text-sm font-semibold shrink-0 ${day.is_working ? 'text-luma-black' : 'text-luma-muted'}`}>
                          {DAYS[day.day_of_week]}
                        </span>

                        {day.is_working ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={day.start_time}
                              onChange={e => updateDay(i, 'start_time', e.target.value)}
                              className="input py-1.5 text-sm w-28"
                            />
                            <span className="text-luma-muted text-xs">to</span>
                            <input
                              type="time"
                              value={day.end_time}
                              onChange={e => updateDay(i, 'end_time', e.target.value)}
                              className="input py-1.5 text-sm w-28"
                            />
                            <span className="text-xs text-luma-muted ml-1">
                              {(() => {
                                const [sh, sm] = day.start_time.split(':').map(Number)
                                const [eh, em] = day.end_time.split(':').map(Number)
                                const mins = (eh * 60 + em) - (sh * 60 + sm)
                                return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`
                              })()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-luma-muted italic">Day off</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Time blocks */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Mini calendar */}
                  <div className="bg-white rounded-2xl border border-luma-border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="p-1 hover:bg-luma-surface rounded-lg">
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-sm font-semibold text-luma-black">
                        {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="p-1 hover:bg-luma-surface rounded-lg">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {DAYS_SHORT.map(d => <div key={d} className="text-center text-xs text-luma-muted py-1">{d.charAt(0)}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: getFirstDay(calMonth.getFullYear(), calMonth.getMonth()) }).map((_, i) => <div key={`e${i}`} />)}
                      {Array.from({ length: getDaysInMonth(calMonth.getFullYear(), calMonth.getMonth()) }).map((_, i) => {
                        const d = new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1)
                        const dateStr = d.toISOString().split('T')[0]
                        const hasBlock = blockedDates.has(dateStr)
                        const isPast = d < today
                        const isToday = d.toDateString() === new Date().toDateString()
                        return (
                          <button
                            key={i}
                            disabled={isPast}
                            onClick={() => { setBlockForm(f => ({ ...f, date: dateStr })); setShowBlockModal(true) }}
                            className={`aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center ${
                              hasBlock ? 'bg-orange-100 text-orange-700 font-bold' :
                              isPast ? 'text-luma-muted/30 cursor-not-allowed' :
                              isToday ? 'border-2 border-gold text-gold font-bold' :
                              'hover:bg-gold/10 text-luma-black'
                            }`}
                          >
                            {i + 1}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-luma-muted mt-2 text-center">Click a date to add a block</p>
                  </div>

                  {/* Upcoming blocks */}
                  <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
                    <div className="px-4 py-3 border-b border-luma-border flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-luma-black">Upcoming Blocks</h3>
                      <button onClick={() => setShowBlockModal(true)} className="flex items-center gap-1 text-xs text-gold font-semibold hover:text-gold-dark">
                        <Plus size={13} />Add
                      </button>
                    </div>
                    {blocks.length === 0 ? (
                      <div className="py-8 text-center text-luma-muted text-xs">
                        <Calendar size={20} className="mx-auto mb-1 opacity-30" />
                        No blocks scheduled
                      </div>
                    ) : (
                      <div className="divide-y divide-luma-border max-h-64 overflow-y-auto">
                        {blocks.map(b => {
                          const tc = typeConfig(b.type)
                          const dateLabel = new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                          return (
                            <div key={b.id} className="flex items-center gap-3 px-4 py-3 group">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${b.type === 'exception_open' ? 'bg-green-500' : b.type === 'vacation' ? 'bg-purple-500' : b.type === 'day_off' ? 'bg-red-500' : 'bg-orange-500'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-luma-black">{dateLabel}</p>
                                <p className="text-xs text-luma-muted">
                                  {b.start_time ? `${formatTime(b.start_time)} – ${formatTime(b.end_time || '')}` : 'Full day'}
                                  {b.reason ? ` · ${b.reason}` : ` · ${tc.label}`}
                                </p>
                              </div>
                              <button onClick={() => deleteBlock(b.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg text-luma-muted hover:text-red-500 transition-all">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add block modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-luma-border">
              <h3 className="font-bold text-luma-black">Add Time Block</h3>
              <button onClick={() => setShowBlockModal(false)} className="text-luma-muted hover:text-luma-black"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Block type */}
              <div>
                <label className="label">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {BLOCK_TYPES.map(t => (
                    <button key={t.value} onClick={() => setBlockForm(f => ({ ...f, type: t.value }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${blockForm.type === t.value ? `border-current ${t.color}` : 'border-luma-border bg-white'}`}>
                      <p className="text-xs font-bold">{t.label}</p>
                      <p className="text-xs text-luma-muted mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={blockForm.date} onChange={e => setBlockForm(f => ({ ...f, date: e.target.value }))} />
              </div>

              {/* Full day toggle */}
              <div className="flex items-center gap-3">
                <button onClick={() => setBlockForm(f => ({ ...f, full_day: !f.full_day }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${blockForm.full_day ? 'bg-gold' : 'bg-luma-border'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${blockForm.full_day ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm font-medium text-luma-black">Full day</span>
              </div>

              {/* Time range */}
              {!blockForm.full_day && blockForm.type !== 'day_off' && blockForm.type !== 'vacation' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Start Time</label>
                    <input type="time" className="input" value={blockForm.start_time} onChange={e => setBlockForm(f => ({ ...f, start_time: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">End Time</label>
                    <input type="time" className="input" value={blockForm.end_time} onChange={e => setBlockForm(f => ({ ...f, end_time: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="label">Reason (optional)</label>
                <input className="input" value={blockForm.reason} onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))} placeholder="Lunch, personal errand, training..." />
              </div>

              {/* Preview */}
              <div className={`p-3 rounded-xl border text-sm ${typeConfig(blockForm.type).color}`}>
                <AlertCircle size={13} className="inline mr-1.5" />
                {blockForm.type === 'exception_open'
                  ? `${selectedStaff?.name} will be available on ${new Date(blockForm.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
                  : `${selectedStaff?.name} will be unavailable${!blockForm.full_day && blockForm.type === 'block' ? ` from ${formatTime(blockForm.start_time)} to ${formatTime(blockForm.end_time)}` : ' all day'} on ${new Date(blockForm.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
                }
              </div>
            </div>
            <div className="p-5 border-t border-luma-border flex gap-3">
              <button onClick={() => setShowBlockModal(false)} className="flex-1 py-2.5 border border-luma-border rounded-xl text-sm font-semibold text-luma-black hover:bg-luma-surface">Cancel</button>
              <button onClick={addBlock} className="flex-1 py-2.5 bg-luma-black text-white rounded-xl text-sm font-semibold hover:bg-gold transition-colors">
                Add Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
