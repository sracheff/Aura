'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import { Plus, X, Trash2, Bell, CheckCircle, Clock, User, Phone, AlertCircle, Calendar } from 'lucide-react'

type WaitlistEntry = {
  id: string
  client_name: string
  client_phone: string | null
  client_email: string | null
  service_name: string | null
  preferred_date: string | null
  notes: string | null
  status: string
  notified_at: string | null
  created_at: string
  staff?: { name: string; color: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  waiting:  'bg-yellow-100 text-yellow-700',
  notified: 'bg-blue-100 text-blue-700',
  booked:   'bg-green-100 text-green-700',
  cancelled:'bg-gray-100 text-gray-500',
}

const emptyForm = {
  client_name: '', client_phone: '', client_email: '',
  service_id: '', service_name: '', preferred_staff_id: '',
  preferred_date: '', notes: '',
}

export default function WaitlistPage() {
  const { userId, loading } = useAuth()
  const [entries, setEntries]     = useState<WaitlistEntry[]>([])
  const [services, setServices]   = useState<any[]>([])
  const [staff, setStaff]         = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [filter, setFilter]       = useState<'all' | 'waiting' | 'notified'>('waiting')

  useEffect(() => {
    if (userId) fetchAll()
  }, [userId])

  async function fetchAll() {
    const [wlRes, svcRes, staffRes] = await Promise.all([
      supabase.from('waitlist').select('*, staff:preferred_staff_id(name,color)').eq('owner_id', userId).order('created_at', { ascending: false }),
      supabase.from('services').select('id,name').eq('owner_id', userId).eq('active', true).order('name'),
      supabase.from('staff').select('id,name,color').eq('owner_id', userId).eq('active', true).order('name'),
    ])
    if (wlRes.data) setEntries(wlRes.data)
    if (svcRes.data) setServices(svcRes.data)
    if (staffRes.data) setStaff(staffRes.data)
  }

  async function saveEntry() {
    if (!form.client_name.trim()) { setError('Client name is required'); return }
    setSaving(true)
    setError('')
    const svc = services.find(s => s.id === form.service_id)
    const { error: err } = await supabase.from('waitlist').insert({
      owner_id: userId,
      client_name: form.client_name,
      client_phone: form.client_phone || null,
      client_email: form.client_email || null,
      service_id: form.service_id || null,
      service_name: svc?.name || form.service_name || null,
      preferred_staff_id: form.preferred_staff_id || null,
      preferred_date: form.preferred_date || null,
      notes: form.notes || null,
      status: 'waiting',
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowModal(false)
    setForm(emptyForm)
    fetchAll()
  }

  async function updateStatus(id: string, status: string) {
    const update: any = { status }
    if (status === 'notified') update.notified_at = new Date().toISOString()
    await supabase.from('waitlist').update(update).eq('id', id)
    fetchAll()
  }

  async function deleteEntry(id: string) {
    await supabase.from('waitlist').delete().eq('id', id)
    fetchAll()
  }

  const filtered = entries.filter(e => {
    if (filter === 'all') return true
    if (filter === 'waiting') return e.status === 'waiting'
    if (filter === 'notified') return e.status === 'notified'
    return true
  })

  const waitingCount = entries.filter(e => e.status === 'waiting').length

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Waitlist" action={{ label: 'Add to Waitlist', onClick: () => { setForm(emptyForm); setError(''); setShowModal(true) } }} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Waiting',  count: entries.filter(e => e.status === 'waiting').length,  color: 'text-yellow-600' },
            { label: 'Notified', count: entries.filter(e => e.status === 'notified').length, color: 'text-blue-600'   },
            { label: 'Booked',   count: entries.filter(e => e.status === 'booked').length,   color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-luma-border">
              <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-sm text-luma-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {([['waiting','Waiting'],['notified','Notified'],['all','All']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === val ? 'bg-luma-black text-white' : 'bg-luma-surface text-luma-muted hover:text-luma-black'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Clock size={36} className="mx-auto mb-3 text-luma-muted opacity-20" />
              <p className="font-medium text-luma-black">
                {filter === 'waiting' ? 'No one waiting right now' : 'No entries found'}
              </p>
              <p className="text-sm text-luma-muted mt-1">Add clients who want to be notified when a slot opens</p>
              <button onClick={() => { setForm(emptyForm); setError(''); setShowModal(true) }} className="btn btn-primary mt-4">
                Add to Waitlist
              </button>
            </div>
          ) : (
            <div className="divide-y divide-luma-border">
              {filtered.map(e => (
                <div key={e.id} className="flex items-start px-6 py-4 gap-4">
                  <div className="w-9 h-9 rounded-xl bg-luma-surface flex items-center justify-center shrink-0">
                    <User size={16} className="text-luma-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-luma-black text-sm">{e.client_name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[e.status] || 'bg-gray-100 text-gray-500'}`}>
                        {e.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-luma-muted flex-wrap">
                      {e.client_phone && <span className="flex items-center gap-1"><Phone size={10} />{e.client_phone}</span>}
                      {e.service_name && <span>· {e.service_name}</span>}
                      {e.preferred_date && <span className="flex items-center gap-1"><Calendar size={10} />Prefers {new Date(e.preferred_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      {e.staff && <span style={{ color: e.staff.color }}>· {e.staff.name}</span>}
                    </div>
                    {e.notes && <p className="text-xs text-luma-muted mt-1 italic">{e.notes}</p>}
                    <p className="text-xs text-luma-muted/60 mt-1">Added {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {e.status === 'waiting' && (
                      <button
                        onClick={() => updateStatus(e.id, 'notified')}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Bell size={11} />Notify
                      </button>
                    )}
                    {e.status === 'notified' && (
                      <button
                        onClick={() => updateStatus(e.id, 'booked')}
                        className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle size={11} />Booked
                      </button>
                    )}
                    <button onClick={() => deleteEntry(e.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-luma-muted hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-luma-border">
              <h2 className="text-lg font-bold">Add to Waitlist</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={14} />{error}
                </div>
              )}
              <div>
                <label className="label">Client Name *</label>
                <input className="input" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} placeholder="Jane Smith" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input className="input" type="tel" value={form.client_phone} onChange={e => setForm({...form, client_phone: e.target.value})} placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} placeholder="jane@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Service</label>
                  <select className="input" value={form.service_id} onChange={e => setForm({...form, service_id: e.target.value})}>
                    <option value="">Any service</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Preferred Stylist</label>
                  <select className="input" value={form.preferred_staff_id} onChange={e => setForm({...form, preferred_staff_id: e.target.value})}>
                    <option value="">No preference</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Preferred Date</label>
                <input className="input" type="date" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})} />
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any notes..." />
              </div>
            </div>
            <div className="p-6 border-t border-luma-border flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
              <button onClick={saveEntry} disabled={saving} className="flex-1 btn btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : 'Add to Waitlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
