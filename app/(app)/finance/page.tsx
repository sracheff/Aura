'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { REVENUE_MONTHLY, EXPENSES } from '@/lib/data'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, Download } from 'lucide-react'
import { clsx } from 'clsx'

const totalRevenue = REVENUE_MONTHLY.reduce((s, m) => s + m.revenue, 0)
const totalExpenses = EXPENSES.reduce((s, e) => s + e.amount, 0)
const netProfit = totalRevenue - totalExpenses
const margin = ((netProfit / totalRevenue) * 100).toFixed(1)

const PIE_COLORS = ['#C9A96E', '#F4C5C5', '#6E9BC9', '#7BC96E', '#C96EB8']

export default function FinancePage() {
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly')

  return (
    <div>
      <Topbar title="Finance" subtitle="Revenue, expenses & profit overview" action={{ label: 'Export Report' }} />
      <div className="p-6 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue (YTD)', val: `$${totalRevenue.toLocaleString()}`, delta: '+18% vs 2025', up: true, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Total Expenses', val: `$${totalExpenses.toLocaleString()}`, delta: '+5% vs 2025', up: false, icon: Receipt, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Net Profit', val: `$${netProfit.toLocaleString()}`, delta: '+22% vs 2025', up: true, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Profit Margin', val: `${margin}%`, delta: '+2.1pts vs 2025', up: true, icon: CreditCard, color: 'text-gold', bg: 'bg-gold/10' },
          ].map(({ label, val, delta, up, icon: Icon, color, bg }) => (
            <div key={label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="kpi-label">{label}</p>
                  <p className="kpi-value">{val}</p>
                </div>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                  <Icon size={18} className={color} />
                </div>
              </div>
              <div className={clsx('flex items-center gap-1 mt-2 text-xs font-medium', up ? 'text-green-600' : 'text-red-500')}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {delta}
              </div>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-luma-black">Revenue vs Expenses</h3>
              <p className="text-xs text-luma-muted">Jan–May 2026</p>
            </div>
            <div className="flex gap-1 bg-luma-bg border border-luma-border rounded-lg p-0.5">
              {(['monthly', 'weekly'] as const).map((v) => (
                <button key={v} onClick={() => setPeriod(v)} className={clsx('px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize', period === v ? 'bg-white shadow-sm text-luma-black' : 'text-luma-muted')}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_MONTHLY}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F4C5C5" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#F4C5C5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: '1px solid #E5DFD3', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#C9A96E" strokeWidth={2} fill="url(#rev)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#F4C5C5" strokeWidth={2} fill="url(#exp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses + Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expense table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Expense Breakdown</h3>
              <button className="btn btn-sm text-xs flex items-center gap-1"><Download size={12} /> Export</button>
            </div>
            <div className="space-y-2">
              {EXPENSES.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 bg-luma-bg rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-luma-black">{e.category}</p>
                    <p className="text-xs text-luma-muted">{e.vendor}</p>
                  </div>
                  <span className={clsx('tag text-xs', e.type === 'fixed' ? 'tag-blue' : 'tag-gold')}>{e.type}</span>
                  <span className="text-sm font-bold text-luma-black">${e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie chart */}
          <div className="card">
            <h3 className="font-semibold text-luma-black mb-4">Revenue Sources</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Hair Services', value: 62 },
                    { name: 'Color', value: 18 },
                    { name: 'Treatments', value: 10 },
                    { name: 'Retail', value: 7 },
                    { name: 'Other', value: 3 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {PIE_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by service type bar */}
        <div className="card">
          <h3 className="font-semibold text-luma-black mb-4">Monthly Profit Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={REVENUE_MONTHLY.map((m) => ({ ...m, profit: m.revenue - m.expenses }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="profit" name="Net Profit" fill="#C9A96E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
