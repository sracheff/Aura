'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { STYLISTS } from '@/lib/data'
import { clsx } from 'clsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Star, DollarSign, Award } from 'lucide-react'

export default function StaffPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const stylist = selected ? STYLISTS.find((s) => s.id === selected) : null

  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Staff" subtitle="Stylist performance & commissions" action={{ label: 'Add Staff' }} />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto p-6">

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Stylists', val: '4', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Total Payroll (YTD)', val: '$89.2k', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Avg Commission Rate', val: '42%', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Top Earner Tips (Mo)', val: '$840', icon: Star, color: 'text-gold', bg: 'bg-gold/10' },
            ].map(({ label, val, icon: Icon, color, bg }) => (
              <div key={label} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="kpi-label">{label}</p>
                    <p className="kpi-value">{val}</p>
                  </div>
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                    <Icon size={18} className={color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="card mb-6">
            <h3 className="font-semibold text-luma-black mb-4">Revenue by Stylist (YTD)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={STYLISTS.map((s) => ({ name: s.name.split(' ')[0], revenue: s.revenue, tips: s.tips }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#C9A96E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tips" name="Tips" fill="#F4C5C5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stylist cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STYLISTS.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelected(s.id === selected ? null : s.id)}
                className={clsx('card cursor-pointer hover:border-gold/40 hover:shadow-md transition-all', selected === s.id && 'border-gold')}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-luma-black">{s.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < Math.floor(s.rating) ? 'fill-gold text-gold' : 'text-luma-border'} />
                      ))}
                      <span className="text-xs text-luma-muted ml-1">{s.rating}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-luma-black">${(s.revenue / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-luma-muted">YTD revenue</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Clients', val: s.clients },
                    { label: 'Comm %', val: `${s.commission}%` },
                    { label: 'Tips', val: `$${s.tips}` },
                    { label: 'Rating', val: s.rating },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-luma-bg rounded-lg p-2">
                      <p className="text-sm font-semibold text-luma-black">{val}</p>
                      <p className="text-xs text-luma-muted">{label}</p>
                    </div>
                  ))}
                </div>
                {/* Commission bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-luma-muted mb-1">
                    <span>Monthly target</span>
                    <span>{Math.round((s.revenue / (STYLISTS[0].revenue * 1.1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-luma-bg rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (s.revenue / (STYLISTS[0].revenue * 1.1)) * 100)}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {stylist && (
          <div className="w-72 shrink-0 border-l border-luma-border bg-white p-5 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Staff Profile</h3>
              <button onClick={() => setSelected(null)} className="text-luma-muted hover:text-luma-black text-xs">✕</button>
            </div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3" style={{ backgroundColor: stylist.color }}>
                {stylist.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <p className="font-bold text-luma-black text-lg">{stylist.name}</p>
              <p className="text-luma-muted text-xs">Senior Stylist</p>
            </div>
            <div className="space-y-3 text-sm mb-6">
              {[
                { label: 'YTD Revenue', val: `$${stylist.revenue.toLocaleString()}` },
                { label: 'Commission Rate', val: `${stylist.commission}%` },
                { label: 'Estimated Payout', val: `$${Math.round(stylist.revenue * stylist.commission / 100).toLocaleString()}` },
                { label: 'Total Tips', val: `$${stylist.tips}` },
                { label: 'Active Clients', val: stylist.clients },
                { label: 'Rating', val: `${stylist.rating} / 5.0` },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-luma-muted">{label}</span>
                  <span className="font-semibold text-luma-black">{val}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-sm text-xs">Schedule</button>
              <button className="btn btn-primary btn-sm text-xs">Pay Report</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
