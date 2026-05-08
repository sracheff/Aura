'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, DollarSign, CalendarDays, Clock, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

export default function DashboardPage() {
  const { userId, loading: authLoading } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [kpis, setKpis] = useState({ todayRevenue: 0, todayAppts: 0, totalClients: 0, avgTicket: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (userId) fetchData() }, [userId])

  async function fetchData() {
    const today = new Date(); today.setHours(0,0,0,0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1)

    const [apptRes, staffRes, clientRes, txRes] = await Promise.all([
      supabase.from('appointments').select('*, clients(name), staff(name,color)')
        .eq('owner_id', userId).gte('start_time', today.toISOString()).lt('start_time', tomorrow.toISOString()).order('start_time'),
      supabase.from('staff').select('*').eq('owner_id', userId).eq('active', true),
      supabase.from('clients').select('id', { count: 'exact' }).eq('owner_id', userId),
      supabase.from('transactions').select('total, created_at').eq('owner_id', userId),
    ])

    const appts = apptRes.data || []
    const txList = txRes.data || []
    const todayRevenue = appts.filter((a:any) => a.status === 'completed').reduce((s:number,a:any) => s + a.price, 0)
    const avgTicket = txList.length ? txList.reduce((s:number,t:any) => s + t.total, 0) / txList.length : 0

    setAppointments(appts)
    setStaff(staffRes.data || [])
    setKpis({ todayRevenue, todayAppts: appts.length, totalClients: clientRes.count || 0, avgTicket })

    const monthlyMap: Record<string,number> = {}
    txList.forEach((t:any) => {
      const m = new Date(t.created_at).toLocaleString('default',{month:'short'})
      monthlyMap[m] = (monthlyMap[m]||0) + t.total
    })
    setRevenueData(Object.entries(monthlyMap).map(([month,revenue]) => ({ month, revenue })))
    setLoading(false)
  }

  if (authLoading || loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-gold" size={32} /></div>

  const KPIs = [
    { label:"Today's Revenue", value:`$${kpis.todayRevenue.toFixed(0)}`, icon:DollarSign, color:'text-green-600', bg:'bg-green-50' },
    { label:'Appointments Today', value:String(kpis.todayAppts), icon:CalendarDays, color:'text-blue-600', bg:'bg-blue-50' },
    { label:'Total Clients', value:String(kpis.totalClients), icon:Users, color:'text-purple-600', bg:'bg-purple-50' },
    { label:'Avg Ticket', value:`$${kpis.avgTicket.toFixed(0)}`, icon:TrendingUp, color:'text-gold', bg:'bg-gold/10' },
  ]

  return (
    <div>
      <Topbar title="Dashboard" subtitle="Good morning, Stephen 👋" action={{ label:'New Appointment' }} />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIs.map(({ label, value, icon:Icon, color, bg }) => (
            <div key={label} className="card">
              <div className="flex items-start justify-between">
                <div><p className="kpi-label">{label}</p><p className="kpi-value">{value}</p></div>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', bg)}><Icon size={18} className={color} /></div>
              </div>
            </div>
          ))}
        </div>

        {revenueData.length > 0 ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Revenue History</h3>
              <span className="tag tag-green">Live data</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueData}>
                <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3}/><stop offset="95%" stopColor="#C9A96E" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3"/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#888'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'#888'}} axisLine={false} tickLine={false} tickFormatter={(v)=>`$${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={(v:number)=>`$${v.toLocaleString()}`} contentStyle={{borderRadius:8,fontSize:12}}/>
                <Area type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={2} fill="url(#grad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="card text-center py-10 text-luma-muted">
            <DollarSign size={32} className="mx-auto mb-2 text-luma-border"/>
            <p className="text-sm font-medium">No revenue data yet</p>
            <p className="text-xs mt-1">Complete a checkout in Point of Sale to see revenue here</p>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-luma-black">Today's Appointments</h3>
            <Link href="/calendar" className="text-xs text-gold hover:underline flex items-center gap-1">View calendar <ArrowRight size={12}/></Link>
          </div>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-luma-muted">
              <CalendarDays size={28} className="mx-auto mb-2 text-luma-border"/>
              <p className="text-sm">No appointments scheduled for today</p>
              <Link href="/calendar" className="btn btn-primary btn-sm mt-3 inline-flex">Book an appointment</Link>
            </div>
          ) : appointments.map((apt:any) => (
            <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-luma-bg hover:bg-gold/5 transition-colors mb-2">
              <div className="flex items-center gap-1.5 text-xs text-luma-muted w-16 shrink-0">
                <Clock size={11}/>
                {new Date(apt.start_time).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}
              </div>
              <div className="w-1.5 h-8 rounded-full shrink-0" style={{backgroundColor: apt.staff?.color||'#C9A96E'}}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-luma-black truncate">{apt.clients?.name||'Walk-in'}</p>
                <p className="text-xs text-luma-muted truncate">{apt.service_name} · {apt.staff?.name||'Unassigned'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-luma-black">${apt.price}</p>
                <span className={clsx('tag text-xs', apt.status==='confirmed'?'tag-green':apt.status==='arrived'?'tag-gold':apt.status==='completed'?'tag-blue':'tag-gray')}>{apt.status}</span>
              </div>
            </div>
          ))}
        </div>

        {staff.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Your Team</h3>
              <Link href="/staff" className="text-xs text-gold hover:underline">Manage staff</Link>
            </div>
            <div className="flex gap-3 flex-wrap">
              {staff.map((s:any) => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-2 bg-luma-bg rounded-xl">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:s.color}}>
                    {s.name.split(' ').map((n:string)=>n[0]).join('')}
                  </div>
                  <span className="text-sm font-medium text-luma-black">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-luma-black p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center shrink-0"><Sparkles size={20} className="text-gold"/></div>
          <div>
            <p className="text-gold text-xs font-semibold mb-1">AI Business Coach</p>
            <p className="text-white text-sm leading-relaxed">Add clients, staff, and complete transactions to unlock personalized AI growth insights for your salon.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
