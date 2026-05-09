'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie
} from 'recharts'
import { TrendingUp, Users, Scissors, DollarSign, Star, Wallet, TrendingDown, CheckCircle, X, AlertCircle } from 'lucide-react'

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
  const [sourceStats, setSourceStats] = useState<{ source: string; count: number }[]>([])
  const [payrollStats, setPayrollStats] = useState<{ name: string; revenue: number; appointments: number; commission_rate: number; payout: number; color: string }[]>([])
  const [expenseStats, setExpenseStats] = useState<{ category: string; total: number }[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [reportTab, setReportTab] = useState<'analytics' | 'payroll' | 'pnl'>('analytics')
  const [loadingData, setLoadingData] = useState(false)
  // Payroll payments
  const [paidRecords, setPaidRecords] = useState<{ staff_name: string; period: string; amount: number; payment_method: string; paid_at: string }[]>([])
  const [markPaidTarget, setMarkPaidTarget] = useState<{ name: string; payout: number } | null>(null)
  const [payMethod, setPayMethod] = useState('cash')
  const [payNotes, setPayNotes] = useState('')
  const [savingPay, setSavingPay] = useState(false)

  useEffect(() => {
    if (userId) { loadReports(); fetchPaidRecords() }
  }, [userId, period])

  function currentPeriodKey() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  async function fetchPaidRecords() {
    const { data } = await supabase
      .from('payroll_payments')
      .select('staff_name, period, amount, payment_method, paid_at')
      .eq('owner_id', userId)
      .eq('period', currentPeriodKey())
    setPaidRecords(data || [])
  }

  async function markAsPaid() {
    if (!markPaidTarget) return
    setSavingPay(true)
    await supabase.from('payroll_payments').insert({
      owner_id: userId,
      staff_name: markPaidTarget.name,
      period: currentPeriodKey(),
      amount: markPaidTarget.payout,
      payment_method: payMethod,
      notes: payNotes,
    })
    setSavingPay(false)
    setMarkPaidTarget(null)
    setPayNotes('')
    fetchPaidRecords()
  }

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

    // Source stats from appointments
    const { data: sourceData } = await supabase
      .from('appointments')
      .select('source')
      .eq('owner_id', userId)
      .gte('start_time', start)
      .not('source', 'is', null)
    if (sourceData) {
      const srcMap: Record<string, number> = {}
      sourceData.forEach((a: { source: string | null }) => {
        if (a.source) srcMap[a.source] = (srcMap[a.source] || 0) + 1
      })
      setSourceStats(
        Object.entries(srcMap)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count)
      )
    }

    // Payroll stats — join staff commission_rate
    const { data: staffFull } = await supabase
      .from('staff')
      .select('name, color, commission_rate')
      .eq('owner_id', userId)
    if (apptData && staffFull) {
      const staffRevMap: Record<string, { revenue: number; appointments: number; commission_rate: number; color: string }> = {}
      apptData.forEach((a: { price: number; staff?: { name: string; color: string } }) => {
        const name = a.staff?.name || 'Unknown'
        const color = a.staff?.color || '#C9A96E'
        if (!staffRevMap[name]) {
          const sf = staffFull.find((s: { name: string }) => s.name === name)
          staffRevMap[name] = { revenue: 0, appointments: 0, commission_rate: sf?.commission_rate || 0, color }
        }
        staffRevMap[name].revenue += a.price
        staffRevMap[name].appointments += 1
      })
      setPayrollStats(
        Object.entries(staffRevMap).map(([name, v]) => ({
          name, ...v,
          payout: v.revenue * (v.commission_rate / 100)
        })).sort((a, b) => b.revenue - a.revenue)
      )
    }

    // Expense stats
    const { data: expData } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('owner_id', userId)
      .gte('expense_date', start.split('T')[0])
    if (expData) {
      const catMap: Record<string, number> = {}
      expData.forEach((e: { category: string; amount: number }) => {
        catMap[e.category] = (catMap[e.category] || 0) + e.amount
      })
      setExpenseStats(Object.entries(catMap).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total))
      setTotalExpenses(expData.reduce((s: number, e: { amount: number }) => s + e.amount, 0))
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

        {/* Tab switcher */}
        <div className="flex gap-1 bg-luma-surface border border-luma-border rounded-xl p-1 w-fit">
          {([['analytics', 'Analytics'], ['payroll', 'Payroll'], ['pnl', 'P&L']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setReportTab(val)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${reportTab === val ? 'bg-white shadow-sm text-luma-black' : 'text-luma-muted hover:text-luma-black'}`}>
              {label}
            </button>
          ))}
        </div>

        {reportTab === 'payroll' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
              <div className="px-6 py-4 border-b border-luma-border flex items-center gap-2">
                <Wallet size={16} className="text-gold" />
                <h3 className="font-bold text-luma-black">Payroll Summary</h3>
                <span className="text-xs text-luma-muted ml-1">Based on completed appointments · commission rates set in Staff</span>
              </div>
              {payrollStats.length === 0 ? (
                <div className="p-12 text-center text-luma-muted">
                  <Wallet size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-luma-black">No payroll data</p>
                  <p className="text-sm mt-1">Complete appointments and set commission rates in Staff to see payroll here</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 px-6 py-3 border-b border-luma-border bg-luma-surface text-xs font-semibold text-luma-muted uppercase tracking-wide">
                    <span>Stylist</span>
                    <span className="w-28 text-right">Appointments</span>
                    <span className="w-28 text-right">Revenue</span>
                    <span className="w-24 text-center">Commission</span>
                    <span className="w-28 text-right">Payout</span>
                    <span className="w-36 text-right">Status</span>
                  </div>
                  <div className="divide-y divide-luma-border">
                    {payrollStats.map(s => {
                      const paid = paidRecords.find(r => r.staff_name === s.name)
                      return (
                        <div key={s.name} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-0 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: s.color }}>
                              {s.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-luma-black">{s.name}</span>
                          </div>
                          <div className="w-28 text-right text-sm text-luma-muted">{s.appointments} appts</div>
                          <div className="w-28 text-right text-sm font-medium text-luma-black">${s.revenue.toFixed(2)}</div>
                          <div className="w-24 text-center">
                            <span className="text-xs font-bold bg-luma-surface px-2 py-1 rounded-lg">{s.commission_rate}%</span>
                          </div>
                          <div className="w-28 text-right text-lg font-bold text-gold">${s.payout.toFixed(2)}</div>
                          <div className="w-36 text-right pl-4">
                            {paid ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-xs font-semibold">
                                <CheckCircle size={12} />
                                Paid · {paid.payment_method}
                              </div>
                            ) : (
                              <button
                                onClick={() => { setMarkPaidTarget({ name: s.name, payout: s.payout }); setPayMethod('cash'); setPayNotes('') }}
                                disabled={s.payout <= 0}
                                className="px-3 py-1.5 bg-luma-black text-white rounded-xl text-xs font-semibold hover:bg-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] px-6 py-4 border-t-2 border-luma-border bg-luma-surface">
                    <span className="font-bold text-luma-black">Total</span>
                    <span className="w-28 text-right text-sm font-semibold text-luma-black">{payrollStats.reduce((s, p) => s + p.appointments, 0)} appts</span>
                    <span className="w-28 text-right text-sm font-bold text-luma-black">${payrollStats.reduce((s, p) => s + p.revenue, 0).toFixed(2)}</span>
                    <span className="w-24" />
                    <span className="w-28 text-right text-lg font-bold text-gold">${payrollStats.reduce((s, p) => s + p.payout, 0).toFixed(2)}</span>
                    <span className="w-36 text-right text-xs text-luma-muted pr-1">{paidRecords.length}/{payrollStats.length} paid</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {reportTab === 'pnl' && (
          <div className="space-y-6">
            {/* P&L summary */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Revenue', value: `$${summary.revenue.toFixed(0)}`, color: 'text-green-600', icon: <TrendingUp size={18} /> },
                { label: 'Expenses', value: `$${totalExpenses.toFixed(0)}`, color: 'text-red-500', icon: <TrendingDown size={18} /> },
                {
                  label: 'Net Profit',
                  value: `$${(summary.revenue - totalExpenses).toFixed(0)}`,
                  color: summary.revenue - totalExpenses >= 0 ? 'text-green-600' : 'text-red-500',
                  icon: <DollarSign size={18} />
                },
              ].map((k, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-luma-border">
                  <div className={`${k.color} mb-2`}>{k.icon}</div>
                  <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                  <div className="text-sm text-luma-muted">{k.label}</div>
                </div>
              ))}
            </div>

            {/* Margin */}
            {summary.revenue > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-luma-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-luma-black">Profit Margin</h3>
                  <span className={`text-lg font-bold ${((summary.revenue - totalExpenses) / summary.revenue) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {(((summary.revenue - totalExpenses) / summary.revenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-luma-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, ((summary.revenue - totalExpenses) / summary.revenue) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-luma-muted mt-2">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* Expense breakdown */}
            {expenseStats.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-luma-border">
                <h3 className="font-bold text-luma-black mb-4 flex items-center gap-2"><TrendingDown size={16} className="text-red-400" />Expense Breakdown</h3>
                <div className="space-y-3">
                  {expenseStats.map(e => {
                    const pct = totalExpenses > 0 ? (e.total / totalExpenses) * 100 : 0
                    return (
                      <div key={e.category} className="flex items-center gap-3">
                        <div className="w-24 shrink-0 text-sm font-medium text-luma-black capitalize">{e.category}</div>
                        <div className="flex-1 h-2 bg-luma-surface rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-sm font-bold text-luma-black w-20 text-right">${e.total.toFixed(0)}</div>
                        <div className="text-xs text-luma-muted w-10 text-right">{pct.toFixed(0)}%</div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-luma-border flex justify-between text-sm font-bold">
                  <span>Total Expenses</span>
                  <span className="text-red-500">${totalExpenses.toFixed(0)}</span>
                </div>
              </div>
            )}

            {expenseStats.length === 0 && (
              <div className="bg-white rounded-2xl p-10 border border-luma-border text-center text-luma-muted">
                <TrendingDown size={32} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium text-luma-black">No expenses logged yet</p>
                <p className="text-sm mt-1">Add expenses in the Expenses section to see your P&L here</p>
              </div>
            )}
          </div>
        )}

        {reportTab === 'analytics' && <>

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

        {/* Booking Sources */}
        {sourceStats.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-luma-border">
            <h3 className="font-bold text-luma-black mb-4">How Clients Found You</h3>
            <div className="space-y-3">
              {(() => {
                const total = sourceStats.reduce((s, r) => s + r.count, 0)
                const SOURCE_STYLE: Record<string, { emoji: string; bar: string }> = {
                  Instagram: { emoji: '📸', bar: 'bg-pink-400' },
                  Facebook:  { emoji: '👍', bar: 'bg-blue-500' },
                  TikTok:    { emoji: '🎵', bar: 'bg-gray-800' },
                  Threads:   { emoji: '🧵', bar: 'bg-gray-600' },
                  Google:    { emoji: '🔍', bar: 'bg-blue-400' },
                  Referral:  { emoji: '🤝', bar: 'bg-yellow-400' },
                  'Walk-by': { emoji: '🚶', bar: 'bg-green-400' },
                  Other:     { emoji: '💬', bar: 'bg-gray-300' },
                }
                return sourceStats.map(s => {
                  const pct = Math.round((s.count / total) * 100)
                  const style = SOURCE_STYLE[s.source] || { emoji: '💬', bar: 'bg-gray-300' }
                  return (
                    <div key={s.source} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center">{style.emoji}</span>
                      <div className="w-24 shrink-0 text-sm font-medium text-luma-black">{s.source}</div>
                      <div className="flex-1 h-2 bg-luma-surface rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-luma-muted w-20 text-right">{s.count} booking{s.count !== 1 ? 's' : ''} · {pct}%</div>
                    </div>
                  )
                })
              })()}
            </div>
            <p className="text-xs text-luma-muted mt-4">Based on {sourceStats.reduce((s, r) => s + r.count, 0)} bookings where clients answered "How did you find us?"</p>
          </div>
        )}

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
        </>}
      </div>
    </div>

    {/* Mark as Paid modal */}
    {markPaidTarget && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-luma-border">
            <h2 className="text-lg font-bold">Mark Payroll as Paid</h2>
            <button onClick={() => setMarkPaidTarget(null)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted"><X size={18} /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 bg-gold/10 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-luma-black">{markPaidTarget.name}</p>
                <p className="text-xs text-luma-muted mt-0.5">Payout for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              <span className="text-2xl font-bold text-gold">${markPaidTarget.payout.toFixed(2)}</span>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'check', 'venmo', 'zelle', 'bank', 'other'].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${payMethod === m ? 'border-gold bg-gold/10 text-luma-black' : 'border-luma-border text-luma-muted hover:border-gold/40'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input className="input" placeholder="e.g. Paid via Venmo on 5/8" value={payNotes} onChange={e => setPayNotes(e.target.value)} />
            </div>
          </div>
          <div className="p-6 border-t border-luma-border flex gap-3">
            <button onClick={() => setMarkPaidTarget(null)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
            <button onClick={markAsPaid} disabled={savingPay}
              className="flex-1 btn btn-primary disabled:opacity-60 flex items-center justify-center gap-2">
              <CheckCircle size={15} />{savingPay ? 'Saving...' : 'Confirm Paid'}
            </button>
          </div>
        </div>
      </div>
    )}
  )
}
