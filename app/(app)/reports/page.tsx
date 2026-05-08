'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { TrendingUp, Users, Scissors, DollarSign, Star } from 'lucide-react'

type ServiceStat = { name: string; count: number; revenue: number }
type ClientStat = { name: string; spend: number; visits: number }
type StaffStat = { name: string; revenue: number; appointments: number; color: string }
type DayRevenue = { day: string; revenue: number; count: number }

export default function ReportsPage() {
  const { userId, loading } = useAuth()
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [serviceStats, setServiceStats] = useState<ServiceStat[]>([])
  const [clientStats, setClientStats] = useState<ClientStat[]>([])
  const [staffStats, setStaffStats] = useState<StaffStat[]>([])
  const [dayRevenue, setDayRevenue] = useState<DayRevenue[]>([])
  const [summary, setSummary] = useState({ revenue: 0, transactions: 0, avgTicket: 0, newClients: 0 })
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (userId) loadReports()
  }, [userId, period])

  function getPeriodStart() {
    const now = new Date()
    if (period === 'week') return new Date(now.getTime() - 7 * 86400000)
    if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
    return new Date(now.getFullYear(), now.getMonth() - 2, 1)
  }

  async function loadReports() {
    setLoadingData(true)
    const start = getPeriodStart().toISOString()

    // Transactions in period
    const { data: txData } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('owner_id', userId)
      .gte('created_at', start)
      .order('created_at')

    if (!txData) { setLoadingData(false); return }

    // Summary
    const totalRev = txData.reduce((s, t) => s + t.total, 0)
    const avgTicket = txData.length > 0 ? totalRev / txData.length : 0
    setSummary({ revenue: totalRev, transactions: txData.length, avgTicket, newClients: 0 })

    // Daily revenue
    const dayMap: Record<string, { revenue: number; count: number }> = {}
    txData.forEach(t => {
      const day = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!dayMap[day]) dayMap[day] = { revenue: 0, count: 0 }
      dayMap[day].revenue += t.total
      dayMap[day].count += 1
    })
    setDayRevenue(Object.entries(dayMap).map(([day, v]) => ({ day, ...v })))

    // Service stats from line items
    const serviceMap: Record<string, { count: number; revenue: number }> = {}
    txData.forEach(t => {
      (t.transaction_items || []).filter((i: { type: string }) => i.type === 'service').forEach((item: { name: string; price: number; qty: number }) => {
        if (!serviceMap[item.name]) serviceMap[item.name] = { count: 0, revenue: 0 }
        serviceMap[item.name].count += item.qty
        serviceMap[item.name].revenue += item.price * item.qty
      })
    })
    setServiceStats(
      Object.entries(serviceMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)
    )

    // Client stats
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, total_spend, visits')
      .eq('owner_id', userId)
      .order('total_spend', { ascending: false })
      .limit(8)
    if (clientData) setClientStats(clientData.map(c => ({ name: c.name, spend: c.total_spend, visits: c.visits })))

    // Staff stats from appointments
    const { data: apptData } = await supabase
      .from('appointments')
      .select('price, staff(name, color)')
      .eq('owner_id', userId)
      .gte('start_time', start)
      .eq('status', 'completed')
    if (apptData) {
      const staffMap: Record<string, { revenue: number; appointments: number; color: string }> = {}
      apptData.forEach((a: { price: number; staff?: { name: string; color: string } }) => {
        const name = a.staff?.name || 'Unknown'
        const color = a.staff?.color || '#C9A96E'
        if (!staffMap[name]) staffMap[name] = { revenue: 0, appointments: 0, color }
        staffMap[name].revenue += a.price
        staffMap[name].appointments += 1
      })
      setStaffStats(Object.entries(staffMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue))
    }

    setLoadingData(false)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Reports" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          {(['week', 'month', 'quarter'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${period === p ? 'bg-luma-black text-white' : 'bg-luma-surface text-luma-muted hover:text-luma-black'}`}>
              This {p}
            </button>
          ))}
          {loadingData && <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin ml-2" />}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `$${summary.revenue.toFixed(0)}`, icon: <DollarSign size={18} />, color: 'text-gold' },
            { label: 'Transactions', value: summary.transactions, icon: <TrendingUp size={18} />, color: 'text-blue-600' },
            { label: 'Avg Ticket', value: `$${summary.avgTicket.toFixed(0)}`, icon: <Scissors size={18} />, color: 'text-green-600' },
            { label: 'Top Clients', value: clientStats.length, icon: <Users size={18} />, color: 'text-purple-600' },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-luma-border">
              <div className={`${k.color} mb-2`}>{k.icon}</div>
              <div className="text-2xl font-bold text-luma-black">{k.value}</div>
              <div className="text-sm text-luma-muted">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Revenue over time */}
        {dayRevenue.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-luma-border">
            <h3 className="font-bold text-luma-black mb-4">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dayRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E1" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9E9085' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9E9085' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(0)}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid #EDE8E1' }} />
                <Line type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Top Services */}
          <div className="bg-white rounded-2xl p-5 border border-luma-border">
            <h3 className="font-bold text-luma-black mb-4 flex items-center gap-2"><Scissors size={16} className="text-gold" />Top Services</h3>
            {serviceStats.length === 0 ? (
              <p className="text-sm text-luma-muted py-4 text-center">No completed transactions yet</p>
            ) : (
              <div className="space-y-3">
                {serviceStats.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-luma-muted w-4">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-luma-black truncate">{s.name}</div>
                      <div className="text-xs text-luma-muted">{s.count} time{s.count !== 1 ? 's' : ''}</div>
                    </div>
                    <span className="font-bold text-gold text-sm">${s.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Clients */}
          <div className="bg-white rounded-2xl p-5 border border-luma-border">
            <h3 className="font-bold text-luma-black mb-4 flex items-center gap-2"><Star size={16} className="text-gold" />Top Clients</h3>
            {clientStats.length === 0 ? (
              <p className="text-sm text-luma-muted py-4 text-center">No clients yet</p>
            ) : (
              <div className="space-y-3">
                {clientStats.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-luma-muted w-4">#{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-luma-black truncate">{c.name}</div>
                      <div className="text-xs text-luma-muted">{c.visits} visits</div>
                    </div>
                    <span className="font-bold text-gold text-sm">${c.spend.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Staff Performance */}
        {staffStats.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-luma-border">
            <h3 className="font-bold text-luma-black mb-4">Staff Performance</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={staffStats} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9E9085' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#3D3530' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(0)}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid #EDE8E1' }} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {staffStats.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {staffStats.map(s => (
                <div key={s.name} className="bg-luma-surface rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: s.color }}>
                      {s.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-luma-black">{s.name}</span>
                  </div>
                  <div className="text-xl font-bold text-luma-black">${s.revenue.toFixed(0)}</div>
                  <div className="text-xs text-luma-muted">{s.appointments} appointments</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.transactions === 0 && !loadingData && (
          <div className="bg-white rounded-2xl p-12 border border-luma-border text-center">
            <TrendingUp size={40} className="mx-auto mb-3 text-luma-muted opacity-30" />
            <p className="font-medium text-luma-black">No data for this period</p>
            <p className="text-sm text-luma-muted mt-1">Complete transactions in POS to see analytics here</p>
          </div>
        )}
      </div>
    </div>
  )
}
