'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, Loader2, X, Clock, MoreHorizontal } from 'lucide-react'

const HOURS = ['8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM']

export default function CalendarPage() {
  const { userId, loading: authLoading } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list'|'day'>('list')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selected, setSelected] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ client_id:'', staff_id:'', service_name:'', price:'', duration:'60', date:'', time:'09:00', status:'confirmed', notes:'' })

  useEffect(() => { if (userId) fetchAll() }, [userId, selectedDate])

  async function fetchAll() {
    const start = new Date(selectedDate); start.setHours(0,0,0,0)
    const end = new Date(selectedDate); end.setHours(23,59,59,999)
    const [apptRes, staffRes, clientRes, svcRes] = await Promise.all([
      supabase.from('appointments').select('*, clients(name), staff(name,color,bg_color)')
        .eq('owner_id', userId).gte('start_time', start.toISOString()).lte('start_time', end.toISOString()).order('start_time'),
      supabase.from('staff').select('*').eq('owner_id', userId).eq('active', true),
      supabase.from('clients').select('id,name').eq('owner_id', userId).order('name'),
      supabase.from('services').select('*').eq('owner_id', userId).eq('active', true).order('name'),
    ])
    setAppointments(apptRes.data || [])
    setStaff(staffRes.data || [])
    setClients(clientRes.data || [])
    setServices(svcRes.data || [])
    setLoading(false)
  }

  async function saveAppointment(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const start_time = new Date(`${form.date}T${form.time}`).toISOString()
    const { error } = await supabase.from('appointments').insert({
      owner_id: userId,
      client_id: form.client_id || null,
      staff_id: form.staff_id || null,
      service_name: form.service_name,
      price: parseFloat(form.price) || 0,
      duration: parseInt(form.duration),
      start_time,
      status: form.status,
      notes: form.notes,
      loyalty_points: Math.round((parseFloat(form.price)||0) * 1.5),
    })
    if (!error) { setShowModal(false); fetchAll(); setForm({ client_id:'',staff_id:'',service_name:'',price:'',duration:'60',date:'',time:'09:00',status:'confirmed',notes:'' }) }
    setSaving(false)
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

  function onServiceChange(name: string) {
    const svc = services.find(s => s.name === name)
    setForm(f => ({ ...f, service_name: name, price: svc ? String(svc.price) : f.price, duration: svc ? String(svc.duration) : f.duration }))
  }

  if (authLoading || loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-gold" size={32}/></div>

  const dateStr = selectedDate.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })

  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Calendar" subtitle={dateStr} action={{ label:'New Appointment', onClick:() => { setForm(f => ({...f, date: selectedDate.toISOString().split('T')[0]})); setShowModal(true) } }}/>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto p-6">

          {/* Date nav */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={()=>{ const d=new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d) }} className="p-1.5 rounded-lg border border-luma-border hover:bg-white transition-colors"><ChevronLeft size={16}/></button>
              <button onClick={()=>setSelectedDate(new Date())} className="btn btn-sm text-xs">Today</button>
              <button onClick={()=>{ const d=new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d) }} className="p-1.5 rounded-lg border border-luma-border hover:bg-white transition-colors"><ChevronRight size={16}/></button>
            </div>
            <div className="flex gap-1 bg-luma-bg border border-luma-border rounded-xl p-1">
              {(['list','day'] as const).map(v => (
                <button key={v} onClick={()=>setView(v)} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', view===v?'bg-white shadow-sm text-luma-black':'text-luma-muted hover:text-luma-black')}>{v}</button>
              ))}
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="card text-center py-16 text-luma-muted">
              <Clock size={36} className="mx-auto mb-3 text-luma-border"/>
              <p className="font-medium text-luma-black">No appointments for this day</p>
              <p className="text-sm mt-1">Click &quot;New Appointment&quot; to add one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt:any) => (
                <div key={apt.id} onClick={()=>setSelected(apt.id===selected?.id?null:apt)}
                  className={clsx('bg-white rounded-xl border border-luma-border p-4 flex items-center gap-4 cursor-pointer hover:border-gold/40 transition-all', selected?.id===apt.id&&'border-gold')}>
                  <div className="w-1.5 h-10 rounded-full shrink-0" style={{backgroundColor:apt.staff?.color||'#C9A96E'}}/>
                  <div className="flex items-center gap-1.5 text-xs text-luma-muted w-20 shrink-0">
                    <Clock size={11}/>
                    {new Date(apt.start_time).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-luma-black text-sm">{apt.clients?.name||'Walk-in'}</p>
                    <p className="text-xs text-luma-muted">{apt.service_name} · {apt.staff?.name||'Unassigned'} · {apt.duration}min</p>
                  </div>
                  <span className={clsx('tag', apt.status==='confirmed'?'tag-green':apt.status==='arrived'?'tag-gold':apt.status==='completed'?'tag-blue':'tag-gray')}>{apt.status}</span>
                  <span className="text-sm font-semibold text-luma-black">${apt.price}</span>
                  <button onClick={e=>{e.stopPropagation()}} className="p-1 hover:bg-luma-bg rounded-lg"><MoreHorizontal size={15} className="text-luma-muted"/></button>
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
              <button onClick={()=>setSelected(null)} className="text-luma-muted hover:text-luma-black"><X size={16}/></button>
            </div>
            <div className="p-4 rounded-xl mb-4" style={{backgroundColor:selected.staff?.bg_color||'#FBF5E8'}}>
              <p className="font-bold text-luma-black text-lg">{selected.clients?.name||'Walk-in'}</p>
              <p className="text-sm text-luma-mid">{selected.service_name}</p>
              <p className="text-xs text-luma-muted mt-1">{new Date(selected.start_time).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})} · {selected.duration}min</p>
            </div>
            <div className="space-y-2 text-sm mb-4">
              {[['Stylist', selected.staff?.name||'Unassigned'],['Price',`$${selected.price}`],['Status',selected.status],['Loyalty pts',`+${selected.loyalty_points}`]].map(([k,v])=>(
                <div key={k} className="flex justify-between"><span className="text-luma-muted">{k}</span><span className="font-medium text-luma-black">{v}</span></div>
              ))}
              {selected.notes && <div className="pt-2 border-t border-luma-border"><p className="text-xs text-luma-muted">{selected.notes}</p></div>}
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {['confirmed','arrived','completed','cancelled'].map(s => (
                  <button key={s} onClick={()=>updateStatus(selected.id,s)} className={clsx('py-1.5 rounded-lg text-xs font-medium border transition-all capitalize', selected.status===s?'bg-gold border-gold text-luma-black':'border-luma-border text-luma-muted hover:border-gold/40')}>{s}</button>
                ))}
              </div>
              <button onClick={()=>deleteAppointment(selected.id)} className="btn btn-danger btn-sm w-full text-xs mt-2">Cancel Appointment</button>
            </div>
          </div>
        )}
      </div>

      {/* New appointment modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-luma-border">
              <h3 className="font-bold text-luma-black">New Appointment</h3>
              <button onClick={()=>setShowModal(false)} className="text-luma-muted hover:text-luma-black"><X size={18}/></button>
            </div>
            <form onSubmit={saveAppointment} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date *</label>
                  <input type="date" required value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="input w-full"/>
                </div>
                <div>
                  <label className="label">Time *</label>
                  <input type="time" required value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} className="input w-full"/>
                </div>
              </div>
              <div>
                <label className="label">Client</label>
                <select value={form.client_id} onChange={e=>setForm(f=>({...f,client_id:e.target.value}))} className="select w-full">
                  <option value="">Walk-in / No client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Stylist</label>
                <select value={form.staff_id} onChange={e=>setForm(f=>({...f,staff_id:e.target.value}))} className="select w-full">
                  <option value="">Unassigned</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Service *</label>
                <select required value={form.service_name} onChange={e=>onServiceChange(e.target.value)} className="select w-full">
                  <option value="">Select service</option>
                  {services.map(s => <option key={s.id} value={s.name}>{s.name} — ${s.price}</option>)}
                  <option value="__custom">Custom service</option>
                </select>
                {(form.service_name === '__custom' || (!services.find(s=>s.name===form.service_name) && form.service_name)) && (
                  <input className="input w-full mt-2" placeholder="Service name" value={form.service_name==='__custom'?'':form.service_name} onChange={e=>setForm(f=>({...f,service_name:e.target.value}))}/>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Price ($) *</label>
                  <input type="number" required min="0" step="0.01" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} className="input w-full" placeholder="0.00"/>
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input type="number" min="15" step="15" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} className="input w-full"/>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="input w-full resize-none" rows={2} placeholder="Any special requests..."/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="btn flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">{saving?'Saving...':'Book Appointment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
