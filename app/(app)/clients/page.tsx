'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { CLIENTS } from '@/lib/data'
import { clsx } from 'clsx'
import { Search, Mail, Phone, Star, Gift, MoreHorizontal, TrendingUp, Users, Crown } from 'lucide-react'

const TIERS = ['All', 'Diamond', 'Gold', 'Silver', 'Bronze']

function tierColor(tier: string) {
  switch (tier) {
    case 'Diamond': return 'bg-blue-100 text-blue-700'
    case 'Gold': return 'bg-yellow-100 text-yellow-700'
    case 'Silver': return 'bg-gray-100 text-gray-600'
    default: return 'bg-orange-100 text-orange-600'
  }
}

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('All')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = CLIENTS.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchTier = tierFilter === 'All' || c.tier === tierFilter
    return matchSearch && matchTier
  })

  const client = selected ? CLIENTS.find((c) => c.id === selected) : null

  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Clients" subtitle={`${CLIENTS.length} total clients`} action={{ label: 'Add Client' }} />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto p-6">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Clients', val: '312', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Avg Lifetime Value', val: '$1,840', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Diamond Members', val: '28', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Referrals This Month', val: '14', icon: Gift, color: 'text-gold', bg: 'bg-gold/10' },
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

          {/* Search + filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="input pl-9 w-full"
              />
            </div>
            <div className="flex gap-1.5">
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all', tierFilter === t ? 'bg-gold text-luma-black border-gold' : 'border-luma-border text-luma-muted hover:border-gold/40 bg-white')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-luma-border bg-luma-bg">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-luma-muted">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-luma-muted hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-luma-muted">Tier</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-luma-muted">Total Spend</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-luma-muted hidden lg:table-cell">Visits</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-luma-muted hidden lg:table-cell">Points</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-luma-muted">Last Visit</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c.id === selected ? null : c.id)}
                    className={clsx('border-b border-luma-border/50 last:border-b-0 hover:bg-luma-bg/50 cursor-pointer transition-colors', selected === c.id && 'bg-gold/5')}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/30 to-blush flex items-center justify-center shrink-0">
                          <span className="text-luma-black text-xs font-bold">{c.name.split(' ').map((n) => n[0]).join('')}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-luma-black">{c.name}</p>
                          <p className="text-xs text-luma-muted hidden sm:block">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-luma-mid">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('tag text-xs font-semibold', tierColor(c.tier))}>{c.tier}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-luma-black">${c.totalSpend.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm text-luma-mid">{c.visits}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-xs font-medium text-gold">{c.points.toLocaleString()} pts</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-luma-muted">{c.lastVisit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-luma-bg rounded-lg" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal size={15} className="text-luma-muted" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client detail */}
        {client && (
          <div className="w-72 shrink-0 border-l border-luma-border bg-white p-5 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Client Profile</h3>
              <button onClick={() => setSelected(null)} className="text-luma-muted hover:text-luma-black text-xs">✕</button>
            </div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/30 to-blush flex items-center justify-center mx-auto mb-3">
                <span className="text-luma-black text-xl font-bold">{client.name.split(' ').map((n) => n[0]).join('')}</span>
              </div>
              <p className="font-bold text-luma-black text-lg">{client.name}</p>
              <span className={clsx('tag text-xs font-semibold inline-flex mt-1', tierColor(client.tier))}>{client.tier} Member</span>
            </div>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex items-center gap-2 text-luma-mid">
                <Mail size={13} className="text-luma-muted" />
                {client.email}
              </div>
              <div className="flex items-center gap-2 text-luma-mid">
                <Phone size={13} className="text-luma-muted" />
                {client.phone}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-luma-bg rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-luma-black">{client.visits}</p>
                <p className="text-xs text-luma-muted">Visits</p>
              </div>
              <div className="bg-luma-bg rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-luma-black">${(client.totalSpend / 1000).toFixed(1)}k</p>
                <p className="text-xs text-luma-muted">Spent</p>
              </div>
              <div className="bg-luma-bg rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gold">{client.points}</p>
                <p className="text-xs text-luma-muted">Points</p>
              </div>
            </div>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-luma-muted">Last Visit</span>
                <span className="text-luma-black font-medium">{client.lastVisit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-luma-muted">Referrals Made</span>
                <span className="text-luma-black font-medium">{client.referrals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-luma-muted">Avg Ticket</span>
                <span className="text-luma-black font-medium">${Math.round(client.totalSpend / client.visits)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-sm text-xs flex items-center justify-center gap-1"><Mail size={12} /> Email</button>
              <button className="btn btn-primary btn-sm text-xs">Book Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
