'use client'

import Topbar from '@/components/topbar'
import { STYLISTS, APPOINTMENTS, REVENUE_MONTHLY, REVENUE_WEEKLY } from '@/lib/data'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Users, DollarSign, CalendarDays, Star, ArrowRight, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

const KPIs = [
  { label: "Today's Revenue", value: '$1,284', delta: '+12%', up: true, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Appointments Today', value: '9', delta: '2 remaining', up: true, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Active Clients', value: '312', delta: '+18 this month', up: true, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Avg Ticket', value: '$142', delta: '+$8 vs last mo', up: true, icon: Star, color: 'text-gold', bg: 'bg-gold/10' },
]

const todayAppts = APPOINTMENTS.filter((a) => a.status !== 'cancelled').slice(0, 6)

export default function DashboardPage() {
  return (
    <div>
      <Topbar title="Dashboard" subtitle="Good morning, Stephen 👋" action={{ label: 'New Appointment' }} />
      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIs.map(({ label, value, delta, up, icon: Icon, color, bg }) => (
            <div key={label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="kpi-label">{label}</p>
                  <p className="kpi-value">{value}</p>
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

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue trend */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-luma-black">Monthly Revenue</h3>
                <p className="text-xs text-luma-muted">Jan – May 2026</p>
              </div>
              <span className="tag tag-green">+18% YTD</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={REVENUE_MONTHLY}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #E5DFD3', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly bar */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-luma-black">Weekly Breakdown</h3>
                <p className="text-xs text-luma-muted">Last 7 weeks</p>
              </div>
              <span className="tag tag-gold">Services + Retail</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={REVENUE_WEEKLY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name === 'services' ? 'Services' : 'Retail']} contentStyle={{ borderRadius: 8, border: '1px solid #E5DFD3', fontSize: 12 }} />
                <Bar dataKey="services" fill="#C9A96E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="retail" fill="#F4C5C5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments + Stylists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Today's schedule */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Today's Appointments</h3>
              <Link href="/calendar" className="text-xs text-gold hover:underline flex items-center gap-1">
                View calendar <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {todayAppts.map((apt) => {
                const stylist = STYLISTS.find((s) => s.name.split(' ')[0] === apt.col)
                return (
                  <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-luma-bg hover:bg-gold/5 transition-colors cursor-pointer">
                    <div className="flex items-center gap-1.5 text-xs text-luma-muted w-16 shrink-0">
                      <Clock size={11} />
                      {apt.start}
                    </div>
                    <div
                      className="w-1.5 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: stylist?.color || '#C9A96E' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-luma-black truncate">{apt.client}</p>
                      <p className="text-xs text-luma-muted truncate">{apt.svc} · {apt.col}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-luma-black">${apt.price}</p>
                      <span className={clsx('tag text-xs', apt.status === 'confirmed' ? 'tag-green' : apt.status === 'arrived' ? 'tag-gold' : 'tag-gray')}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stylist leaderboard */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Stylist Performance</h3>
              <Link href="/staff" className="text-xs text-gold hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {STYLISTS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-xs text-luma-muted w-4 text-right">{i + 1}</span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-luma-black truncate">{s.name}</p>
                    <div className="w-full h-1.5 bg-luma-border rounded-full mt-1">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${(s.revenue / STYLISTS[0].revenue) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-luma-black shrink-0">${(s.revenue / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="rounded-2xl bg-luma-black p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-gold text-xs font-semibold mb-1">AI Business Coach</p>
            <p className="text-white text-sm leading-relaxed">
              <strong>You have 4 clients who haven't visited in 60+ days.</strong> Based on their history, a targeted "We miss you" campaign with a 15% service discount could recover an estimated <strong className="text-gold">$840 in revenue</strong> this month. Want me to draft the campaign?
            </p>
          </div>
          <button className="btn btn-primary btn-sm shrink-0 whitespace-nowrap">Draft campaign</button>
        </div>

      </div>
    </div>
  )
}
