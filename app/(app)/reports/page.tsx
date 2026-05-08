'use client'

import Topbar from '@/components/topbar'
import { REVENUE_MONTHLY, STYLISTS, CLIENTS } from '@/lib/data'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Download, TrendingUp, Users, Repeat, Star } from 'lucide-react'
import { clsx } from 'clsx'

const RETENTION_DATA = [
  { month: 'Jan', newClients: 22, returning: 78, churnRate: 8 },
  { month: 'Feb', newClients: 18, returning: 82, churnRate: 7 },
  { month: 'Mar', newClients: 25, returning: 88, churnRate: 6 },
  { month: 'Apr', newClients: 30, returning: 91, churnRate: 5 },
  { month: 'May', newClients: 28, returning: 95, churnRate: 4.5 },
]

const SERVICE_MIX = [
  { name: 'Haircut & Style', revenue: 18400, pct: 32 },
  { name: 'Color & Highlights', revenue: 14200, pct: 25 },
  { name: 'Balayage', revenue: 11400, pct: 20 },
  { name: 'Treatments', revenue: 6800, pct: 12 },
  { name: 'Retail Sales', revenue: 3900, pct: 7 },
  { name: 'Other', revenue: 2300, pct: 4 },
]

const REPORT_TILES = [
  { label: 'Revenue Growth (YTD)', val: '+18.4%', sub: 'vs same period 2025', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Client Retention Rate', val: '86.2%', sub: '+4.1pts vs last year', icon: Repeat, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'New Clients (YTD)', val: '123', sub: 'Avg 24.6/month', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Avg Client Rating', val: '4.8★', sub: 'From 312 reviews', icon: Star, color: 'text-gold', bg: 'bg-gold/10' },
]

export default function ReportsPage() {
  return (
    <div>
      <Topbar title="Reports" subtitle="Business analytics & performance" action={{ label: 'Export All' }} />
      <div className="p-6 space-y-6">

        {/* KPI tiles */}
        <div className="grid grid-cols-4 gap-4">
          {REPORT_TILES.map(({ label, val, sub, icon: Icon, color, bg }) => (
            <div key={label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="kpi-label">{label}</p>
                  <p className="kpi-value">{val}</p>
                  <p className="text-xs text-luma-muted mt-1">{sub}</p>
                </div>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
                  <Icon size={18} className={color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-luma-black">Revenue Over Time</h3>
              <p className="text-xs text-luma-muted">2026 YTD with projection</p>
            </div>
            <button className="btn btn-sm text-xs flex items-center gap-1.5"><Download size={12} /> CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_MONTHLY}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#C9A96E" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Two charts side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Retention */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Client Retention</h3>
              <span className="tag tag-green">Improving</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={RETENTION_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="returning" name="Returning %" stroke="#C9A96E" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="churnRate" name="Churn %" stroke="#F4C5C5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Service mix */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Service Mix</h3>
              <button className="btn btn-sm text-xs flex items-center gap-1.5"><Download size={12} /> Export</button>
            </div>
            <div className="space-y-2">
              {SERVICE_MIX.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-luma-black font-medium truncate">{s.name}</span>
                      <span className="text-luma-muted shrink-0 ml-2">${(s.revenue / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="w-full h-2 bg-luma-bg rounded-full">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-luma-black w-8 text-right">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stylist performance table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-luma-black">Stylist Performance Summary</h3>
            <button className="btn btn-sm text-xs flex items-center gap-1.5"><Download size={12} /> Export</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-luma-border">
                <th className="text-left py-2 text-xs font-semibold text-luma-muted">Stylist</th>
                <th className="text-right py-2 text-xs font-semibold text-luma-muted">Revenue</th>
                <th className="text-right py-2 text-xs font-semibold text-luma-muted">Commission</th>
                <th className="text-right py-2 text-xs font-semibold text-luma-muted">Tips</th>
                <th className="text-right py-2 text-xs font-semibold text-luma-muted">Clients</th>
                <th className="text-right py-2 text-xs font-semibold text-luma-muted">Rating</th>
              </tr>
            </thead>
            <tbody>
              {STYLISTS.map((s) => (
                <tr key={s.id} className="border-b border-luma-border/50 last:border-b-0 hover:bg-luma-bg/50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: s.color }}>
                        {s.name[0]}
                      </div>
                      <span className="text-sm font-medium text-luma-black">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-sm font-semibold text-luma-black">${s.revenue.toLocaleString()}</td>
                  <td className="py-3 text-right text-sm text-luma-mid">${Math.round(s.revenue * s.commission / 100).toLocaleString()}</td>
                  <td className="py-3 text-right text-sm text-luma-mid">${s.tips}</td>
                  <td className="py-3 text-right text-sm text-luma-mid">{s.clients}</td>
                  <td className="py-3 text-right">
                    <span className="text-sm font-medium text-gold">{s.rating}★</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
