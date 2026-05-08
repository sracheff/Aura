'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import { Users, Plus, Edit2, Trash2, X, AlertCircle, Star, DollarSign, UserCheck, Clock, Check } from 'lucide-react'

type Staff = {
  id: string
  owner_id: string
  name: string
  email: string
  phone: string
  color: string
  bg_color: string
  commission_rate: number
  active: boolean
  tips: number
  rating: number
  created_at: string
}

const COLOR_PRESETS = [
  { color: '#C9A96E', bg: '#FBF5E8' },
  { color: '#E8A598', bg: '#FDF0EE' },
  { color: '#7EC8C8', bg: '#EEF8F8' },
  { color: '#A598E8', bg: '#F0EEF8' },
  { color: '#98C87E', bg: '#EEF5E8' },
  { color: '#E8C898', bg: '#FBF5E8' },
  { color: '#C87E98', bg: '#F5EEF1' },
  { color: '#7E98C8', bg: '#EEF1F8' },
]

const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const emptyForm = {
  name: '', email: '', phone: '',
  color: '#C9A96E', bg_color: '#FBF5E8',
  commission_rate: 40, active: true
}

export default function StaffPage() {
  const { userId, loading } = useAuth()
  const [staff, setStaff] = useState<Staff[]>([])
  const [selected, setSelected] = useState<Staff | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [staffTab, setStaffTab] = useState<'details' | 'availability'>('details')
  const [availability, setAvailability] = useState<{ day_of_week: number; open_time: string; close_time: string; enabled: boolean }[]>(
    DAYS_OF_WEEK.map((_, i) => ({ day_of_week: i, open_time: '09:00', close_time: '18:00', enabled: i >= 1 && i <= 5 }))
  )
  const [savingAvail, setSavingAvail] = useState(false)
  const [availSaved, setAvailSaved] = useState(false)

  useEffect(() => {
    if (userId) fetchStaff()
  }, [userId])

  async function fetchStaff() {
    const { data } = await supabase
      .from('staff')
      .select('*')
      .eq('owner_id', userId)
      .order('name')
    if (data) setStaff(data)
  }

  async function fetchAvailability(staffId: string) {
    const { data } = await supabase
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staffId)
    const base = DAYS_OF_WEEK.map((_, i) => {
      const existing = data?.find(a => a.day_of_week === i)
      return existing
        ? { day_of_week: i, open_time: existing.open_time, close_time: existing.close_time, enabled: true }
        : { day_of_week: i, open_time: '09:00', close_time: '18:00', enabled: i >= 1 && i <= 5 }
    })
    setAvailability(base)
  }

  async function saveAvailability() {
    if (!selected) return
    setSavingAvail(true)
    // Delete existing then re-insert enabled days
    await supabase.from('staff_availability').delete().eq('staff_id', selected.id)
    const rows = availability
      .filter(a => a.enabled)
      .map(a => ({
        owner_id: userId,
        staff_id: selected.id,
        day_of_week: a.day_of_week,
        open_time: a.open_time,
        close_time: a.close_time,
      }))
    if (rows.length > 0) await supabase.from('staff_availability').insert(rows)
    setSavingAvail(false)
    setAvailSaved(true)
    setTimeout(() => setAvailSaved(false), 2500)
  }

  function openAdd() {
    setForm(emptyForm)
    setEditMode(false)
    setError('')
    setShowModal(true)
  }

  function openEdit(s: Staff) {
    setForm({
      name: s.name, email: s.email || '', phone: s.phone || '',
      color: s.color, bg_color: s.bg_color,
      commission_rate: s.commission_rate, active: s.active
    })
    setSelected(s)
    setEditMode(true)
    setError('')
    setShowModal(true)
  }

  async function saveStaff() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const payload = { ...form, owner_id: userId }
    if (editMode && selected) {
      const { error: err } = await supabase.from('staff').update(payload).eq('id', selected.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('staff').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setShowModal(false)
    fetchStaff()
  }

  async function toggleActive(s: Staff) {
    await supabase.from('staff').update({ active: !s.active }).eq('id', s.id)
    fetchStaff()
    if (selected?.id === s.id) setSelected({ ...s, active: !s.active })
  }

  async function deleteStaff() {
    if (!selected) return
    await supabase.from('staff').delete().eq('id', selected.id)
    setSelected(null)
    setDeleteConfirm(false)
    fetchStaff()
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Staff" action={{ label: 'Add Staff', onClick: openAdd }} />

      <div className="flex-1 flex min-h-0">
        {/* Grid list */}
        <div className={`flex-1 overflow-y-auto p-6`}>
          {staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-luma-muted">
              <Users size={40} className="mb-3 opacity-30" />
              <p className="font-medium">No staff yet</p>
              <p className="text-sm mt-1">Add your stylists and team members</p>
              <button onClick={openAdd} className="btn btn-primary mt-4">Add Staff Member</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {staff.map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    const next = selected?.id === s.id ? null : s
                    setSelected(next)
                    setStaffTab('details')
                    if (next) fetchAvailability(next.id)
                  }}
                  className={`relative rounded-2xl p-5 border-2 cursor-pointer transition-all ${
                    selected?.id === s.id ? 'border-gold shadow-lg' : 'border-luma-border hover:border-gold/40'
                  } ${!s.active ? 'opacity-60' : ''}`}
                  style={{ backgroundColor: s.bg_color }}
                >
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-3"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-luma-black text-base">{s.name}</h3>
                  <p className="text-sm text-luma-muted mb-3">{s.email || s.phone || 'No contact info'}</p>

                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold" style={{ color: s.color }}>
                      {s.commission_rate}% commission
                    </div>
                    <div className="flex items-center gap-1 text-xs text-luma-muted">
                      <Star size={11} fill="currentColor" className="text-gold" />
                      {s.rating?.toFixed(1) || '5.0'}
                    </div>
                  </div>

                  {!s.active && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-500 font-medium">
                      Inactive
                    </div>
                  )}
                </div>
              ))}

              {/* Add card */}
              <button
                onClick={openAdd}
                className="rounded-2xl p-5 border-2 border-dashed border-luma-border hover:border-gold/40 flex flex-col items-center justify-center gap-2 text-luma-muted hover:text-gold transition-colors min-h-[160px]"
              >
                <Plus size={24} />
                <span className="text-sm font-medium">Add Staff</span>
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 border-l border-luma-border flex flex-col">
            <div className="p-5 border-b border-luma-border flex items-center justify-between">
              <h2 className="font-bold text-luma-black">Staff Details</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(selected)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted hover:text-luma-black transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setDeleteConfirm(true)} className="p-2 hover:bg-red-50 rounded-lg text-luma-muted hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 px-5 py-3 border-b border-luma-border bg-luma-surface/50">
              {(['details','availability'] as const).map(tab => (
                <button key={tab} onClick={() => setStaffTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${staffTab === tab ? 'bg-white shadow-sm text-luma-black' : 'text-luma-muted hover:text-luma-black'}`}>
                  {tab === 'availability' ? '📅 Availability' : '👤 Details'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {staffTab === 'availability' && (
              <div className="space-y-3">
                <p className="text-xs text-luma-muted">Set which days and hours {selected.name} is available. This controls the online booking calendar.</p>
                {availability.map((a, i) => (
                  <div key={i} className={`rounded-xl border transition-all ${a.enabled ? 'border-luma-border bg-white' : 'border-dashed border-luma-border bg-luma-surface opacity-60'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => setAvailability(prev => prev.map((d, idx) => idx === i ? { ...d, enabled: !d.enabled } : d))}
                        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${a.enabled ? 'bg-gold' : 'bg-luma-border'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${a.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-sm font-medium text-luma-black w-24">{DAYS_OF_WEEK[i]}</span>
                      {a.enabled && (
                        <div className="flex items-center gap-2 ml-auto">
                          <input type="time" value={a.open_time}
                            onChange={e => setAvailability(prev => prev.map((d, idx) => idx === i ? { ...d, open_time: e.target.value } : d))}
                            className="text-xs border border-luma-border rounded-lg px-2 py-1 focus:outline-none focus:border-gold" />
                          <span className="text-xs text-luma-muted">–</span>
                          <input type="time" value={a.close_time}
                            onChange={e => setAvailability(prev => prev.map((d, idx) => idx === i ? { ...d, close_time: e.target.value } : d))}
                            className="text-xs border border-luma-border rounded-lg px-2 py-1 focus:outline-none focus:border-gold" />
                        </div>
                      )}
                      {!a.enabled && <span className="text-xs text-luma-muted ml-auto">Day off</span>}
                    </div>
                  </div>
                ))}
                <button onClick={saveAvailability} disabled={savingAvail}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${availSaved ? 'bg-green-100 text-green-700' : 'btn btn-primary'} disabled:opacity-60`}>
                  {availSaved ? <><Check size={14} className="inline mr-1" />Saved!</> : savingAvail ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            )}

            {staffTab === 'details' && <>
              {/* Avatar + name */}
              <div className="flex flex-col items-center text-center py-4" style={{ backgroundColor: selected.bg_color, borderRadius: '16px' }}>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-3"
                  style={{ backgroundColor: selected.color }}>
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-luma-black">{selected.name}</h3>
                {selected.email && <p className="text-sm text-luma-muted mt-1">{selected.email}</p>}
                {selected.phone && <p className="text-sm text-luma-muted">{selected.phone}</p>}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: <DollarSign size={14} />, label: 'Commission', value: `${selected.commission_rate}%` },
                  { icon: <Star size={14} />, label: 'Rating', value: selected.rating?.toFixed(1) || '5.0' },
                  { icon: <DollarSign size={14} />, label: 'Tips', value: `$${selected.tips?.toFixed(0) || '0'}` },
                ].map((s, i) => (
                  <div key={i} className="bg-luma-surface rounded-xl p-3 text-center">
                    <div className="text-gold flex justify-center mb-1">{s.icon}</div>
                    <div className="text-base font-bold text-luma-black">{s.value}</div>
                    <div className="text-xs text-luma-muted">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between bg-luma-surface rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-gold" />
                  <span className="text-sm font-medium text-luma-black">Active Status</span>
                </div>
                <button
                  onClick={() => toggleActive(selected)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${selected.active ? 'bg-gold' : 'bg-luma-border'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${selected.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </>}
            </div>

            {deleteConfirm && (
              <div className="p-4 border-t border-luma-border bg-red-50">
                <p className="text-sm font-medium text-red-700 mb-3">Remove {selected.name}? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={deleteStaff} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Remove</button>
                  <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 bg-white border border-luma-border rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-luma-border">
              <h2 className="text-lg font-bold">{editMode ? 'Edit Staff Member' : 'New Staff Member'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={14} />{error}
                </div>
              )}
              <div>
                <label className="label">Full Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Alex Johnson" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="alex@salon.com" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(555) 000-0000" />
                </div>
              </div>
              <div>
                <label className="label">Commission Rate (%)</label>
                <input className="input" type="number" min="0" max="100" value={form.commission_rate} onChange={e => setForm({...form, commission_rate: parseInt(e.target.value)||0})} />
              </div>
              <div>
                <label className="label">Color Theme</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {COLOR_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setForm({...form, color: p.color, bg_color: p.bg})}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === p.color ? 'border-luma-black scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: p.color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm({...form, active: !form.active})}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? 'bg-gold' : 'bg-luma-border'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-luma-black font-medium">{form.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div className="p-6 border-t border-luma-border flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 btn bg-luma-surface text-luma-black hover:bg-luma-border">Cancel</button>
              <button onClick={saveStaff} disabled={saving} className="flex-1 btn btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
