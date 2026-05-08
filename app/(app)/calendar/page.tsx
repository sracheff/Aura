'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, Loader2, X, Clock, Plus, Trash2 } from 'lucide-react'

export default function CalendarPage() {
  const { userId, loading: authLoading } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selected, setSelected] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Multi-service form
  const [formBase, setFormBase] = useState({ client_id: '', staff_id: '', date: '', time: '09:00', status: 'confirmed', notes: '' })
  const [formServices, setFormServices] = useState<{ service_id: string; service_name: string; price: string; duration: string }[]>([
    { service_id: '', service_name: '', price: '', duration: '60' }
  ])

  const totalPrice = formServices.reduce((s, sv) => s + (parseFloat(sv.price) || 0), 0)
  const totalDuration = formServices.reduce((s, sv) => s + (parseInt(sv.duration) || 0), 0)

  useEffect(() => { if (userId) fetchAll() }, [userId, selectedDate])

  async function fetchAll() {
    const start = new Date(selectedDate); start.setHours(0, 0, 0, 0)
    const end = new Date(selectedDate); end.setHours(23, 59, 59, 999)
    const [apptRes, staffRes, clientRes, svcRes] = await Promise.all([
      supabase.from('appointments').select('*, clients(name), staff(name,color,bg_color)')
        .eq('owner_id', userId).gte('start_time', start.toISOString()).lte('start_time', end.toISOString()).order('start_time'),
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

    const { data: appt, error } = await supabase.from('appointments').insert({
      owner_id: userId,
      client_id: formBase.client_id || null,
      staff_id: formBase.staff_id || null,
      service_name: serviceSummary || 'Custom',
      price: totalPrice,
      duration: totalDuration,
      start_time,
      status: formBase.status,
      notes: formBase.notes,
      loyalty_points: Math.round(totalPrice * 1.5),
    }).select('id').single()

    if (!error && appt?.id) {
      // Insert appointment_services for each selected service
      const rows = formServices
        .filter(s => s.service_name)
        .map(s => ({
          appointment_id: appt.id,
          service_id: s.service_id || null,
          service_name: s.service_name,
          price: parseFloat(s.price) || 0,
          duration: parseInt(s.duration) || 60,
        }))
      if (rows.length > 0) await supabase.from('appointment_services').insert(rows)

      setShowModal(false)
      resetForm()
      fetchAll()
    }
    setSaving(false)
  }

  function resetForm() {
    setFormBase({ client_id: '', staff_id: '', date: selectedDate.toISOString().split('T')[0], time: '09:00', status: 'confirmed', notes: '' })
    setFormServices([{ service_id: '', service_name: '', price: '', duration: '60' }])
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    fetchAll()
    setSelected((prev: any) => prev ? { ...prev, status } : null)
  }

  async function deleteAppointment(id: string) {
    await supabase.from('appointments').delete().eq('id', id)
    setSelected(null)
    fetchAll()
  }

  if (authLoading || loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-gold" size={32} /></div>

  const dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Calendar" subtitle={dateStr} action={{ label: 'New Appointment', onClick: () => { resetForm(); setShowModal(true) } }} />

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto p-6">

          {/* Date nav */}
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d) }} className="p-1.5 rounded-lg border border-luma-border hover:bg-white transition-colors"><ChevronLeft size={16} /></button>
            <button onClick={() => setSelectedDate(new Date())} className="btn btn-sm text-xs">Today</button>
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d) }} className="p-1.5 rounded-lg border border-luma-border hover:bg-white transition-colors"><ChevronRight size={16} /></button>
          </div>

          {appointments.length === 0 ? (
            <div className="card text-center py-16 text-luma-muted">
              <Clock size={36} className="mx-auto mb-3 text-luma-border" />
              <p className="font-medium text-luma-black">No appointments for this day</p>
              <p className="text-sm mt-1">Click "New Appointment" to add one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt: any) => (
                <div key={apt.id} onClick={() => setSelected(apt.id === selected?.id ? null : apt)}
                  className={clsx('bg-white rounded-xl border border-luma-border p-4 flex items-center gap-4 cursor-pointer hover:border-gold/40 transition-all', selected?.id === apt.id && 'border-gold')}>
                  <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: apt.staff?.color || '#C9A96E' }} />
                  <div className="flex items-center gap-1.5 text-xs text-luma-muted w-20 shrink-0">
                    <Clock size={11} />
                    {new Date(apt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-luma-black text-sm">{apt.clients?.name || 'Walk-in'}</p>
                    <p className="text-xs text-luma-muted truncate">{apt.service_name} · {apt.staff?.name || 'Unassigned'} · {apt.duration}min</p>
                  </div>
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold',
                    apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    apt.status === 'arrived' ? 'bg-gold/20 text-gold' :
                    apt.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  )}>{apt.status}</span>
                  <span className="text-sm font-semibold text-luma-black">${apt.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 border-l border-luma-border bg-white p-5 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Appointment</h3>
              <button onClick={() => setSelected(null)} className="text-luma-muted hover:text-luma-black"><X size={16} /></button>
            </div>
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: selected.staff?.bg_color || '#FBF5E8' }}>
              <p className="font-bold text-luma-black text-lg">{selected.clients?.name || 'Walk-in'}</p>
              <p className="text-sm text-luma-muted">{selected.service_name}</p>
              <p className="text-xs text-luma-muted mt-1">
                {new Date(selected.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} · {selected.duration}min
              </p>
            </div>
            <div className="space-y-2 text-sm mb-4">
              {[['Stylist', selected.staff?.name || 'Unassigned'], ['Price', `$${selected.price}`], ['Status', selected.status]].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-luma-muted">{k}</span>
                  <span className="font-medium text-luma-black capitalize">{v}</span>
                </div>
              ))}
              {selected.notes && <div className="pt-2 border-t border-luma-border"><p className="text-xs text-luma-muted">{selected.notes}</p></div>}
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {['confirmed', 'arrived', 'completed', 'cancelled'].map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={clsx('py-1.5 rounded-lg text-xs font-medium border transition-all capitalize',
                      selected.status === s ? 'bg-gold border-gold text-luma-black' : 'border-luma-border text-luma-muted hover:border-gold/40'
                    )}>{s}</button>
                ))}
              </div>
              <button onClick={() => deleteAppointment(selected.id)} className="w-full py-2 mt-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                Cancel Appointment
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
              <button onClick={() => setShowModal(false)} className="text-luma-muted hover:text-luma-black"><X size={18} /></button>
            </div>

            <form onSubmit={saveAppointment} className="p-5 space-y-4">
              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date *</label>
                  <input type="date" required value={formBase.date} onChange={e => setFormBase(f => ({ ...f, date: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="label">Time *</label>
                  <input type="time" required value={formBase.time} onChange={e => setFormBase(f => ({ ...f, time: e.target.value }))} className="input w-full" />
                </div>
              </div>

              {/* Client + Staff */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Client</label>
                  <select value={formBase.client_id} onChange={e => setFormBase(f => ({ ...f, client_id: e.target.value }))} className="input w-full">
                    <option value="">Walk-in</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Stylist</label>
                  <select value={formBase.staff_id} onChange={e => setFormBase(f => ({ ...f, staff_id: e.target.value }))} className="input w-full">
                    <option value="">Unassigned</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Services — multi-select */}
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
                              <input type="number" min="0" step="0.01" value={row.price}
                                onChange={e => setFormServices(prev => prev.map((s, i) => i === idx ? { ...s, price: e.target.value } : s))}
                                className="input w-full text-sm" placeholder="Price $" />
                            </div>
                            <div className="flex-1">
                              <input type="number" min="5" step="5" value={row.duration}
                                onChange={e => setFormServices(prev => prev.map((s, i) => i === idx ? { ...s, duration: e.target.value } : s))}
                                className="input w-full text-sm" placeholder="Mins" />
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

                {/* Running total */}
                {formServices.some(s => s.price) && (
                  <div className="mt-3 flex justify-between text-sm bg-luma-surface rounded-xl px-4 py-2">
                    <span className="text-luma-muted">Total · {totalDuration}min</span>
                    <span className="font-bold text-gold">${totalPrice.toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notes</label>
                <textarea value={formBase.notes} onChange={e => setFormBase(f => ({ ...f, notes: e.target.value }))}
                  className="input w-full resize-none" rows={2} placeholder="Special requests, color formula reminders..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-luma-border rounded-xl text-sm font-semibold text-luma-black hover:bg-luma-surface">Cancel</button>
                <button type="submit" disabled={saving || !formBase.date || !formBase.time} className="flex-1 py-2.5 bg-luma-black text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-gold transition-colors">
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
