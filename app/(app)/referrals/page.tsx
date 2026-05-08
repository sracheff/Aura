'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { CLIENTS } from '@/lib/data'
import { Gift, Users, DollarSign, Trophy, QrCode, Share2, Copy, CheckCircle2, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'

const CAMPAIGNS = [
  { id: 'c1', name: 'Spring Glow-Up', status: 'active', reward: '$25 credit', referred: 18, converted: 12, revenue: '$1,440', ends: 'Jun 1' },
  { id: 'c2', name: 'Friends & Family', status: 'active', reward: '15% off', referred: 31, converted: 24, revenue: '$2,880', ends: 'Ongoing' },
  { id: 'c3', name: 'Holiday Glam', status: 'ended', reward: '$30 credit', referred: 45, converted: 38, revenue: '$4,560', ends: 'Jan 1' },
]

const TOP_REFERRERS = CLIENTS.filter((c) => c.referrals > 0).sort((a, b) => b.referrals - a.referrals).slice(0, 5)

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'leaderboard'>('campaigns')

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <Topbar title="Referrals" subtitle="Grow your salon through word-of-mouth" action={{ label: 'New Campaign' }} />
      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Referrals', val: '94', delta: '+28 this month', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Converted Clients', val: '74', delta: '78.7% conversion', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Revenue from Referrals', val: '$8,880', delta: '+$1,200 this month', icon: DollarSign, color: 'text-gold', bg: 'bg-gold/10' },
            { label: 'Active Advocates', val: '31', delta: '10% of client base', icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, val, delta, icon: Icon, color, bg }) => (
            <div key={label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="kpi-label">{label}</p>
                  <p className="kpi-value">{val}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><TrendingUp size={10} />{delta}</p>
                </div>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
                  <Icon size={18} className={color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Share link */}
        <div className="rounded-2xl bg-luma-black p-6">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <p className="text-gold text-xs font-semibold mb-1">Your Referral Link</p>
              <h3 className="text-white font-bold text-lg mb-2">Share & earn rewards together</h3>
              <p className="text-white/60 text-sm mb-4">When your clients refer a friend, both get rewarded. Send via SMS, email, or QR code.</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white/80 text-sm font-mono">
                  app.getluma.com/join/luminary-salon
                </div>
                <button
                  onClick={handleCopy}
                  className={clsx('px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5', copied ? 'bg-green-500 text-white' : 'bg-gold text-luma-black hover:bg-gold-light')}
                >
                  {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            </div>
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shrink-0">
              <QrCode size={52} className="text-luma-black" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-sm text-xs flex items-center gap-1.5 bg-white/10 text-white border border-white/20 hover:bg-white/20">
              <Share2 size={12} /> Share via SMS
            </button>
            <button className="btn btn-sm text-xs flex items-center gap-1.5 bg-white/10 text-white border border-white/20 hover:bg-white/20">
              <Share2 size={12} /> Email Clients
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 bg-luma-bg border border-luma-border rounded-xl p-1 mb-4 w-fit">
            {(['campaigns', 'leaderboard'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', activeTab === t ? 'bg-white shadow-sm text-luma-black' : 'text-luma-muted hover:text-luma-black')}
              >
                {t === 'campaigns' ? 'Campaigns' : 'Top Advocates'}
              </button>
            ))}
          </div>

          {activeTab === 'campaigns' && (
            <div className="space-y-3">
              {CAMPAIGNS.map((c) => (
                <div key={c.id} className="card hover:border-gold/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                        <Gift size={18} className="text-gold" />
                      </div>
                      <div>
                        <p className="font-semibold text-luma-black">{c.name}</p>
                        <p className="text-xs text-luma-muted">Reward: {c.reward} · Ends: {c.ends}</p>
                      </div>
                    </div>
                    <span className={clsx('tag text-xs', c.status === 'active' ? 'tag-green' : 'tag-gray')}>{c.status}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Referred', val: c.referred },
                      { label: 'Converted', val: c.converted },
                      { label: 'Conv. Rate', val: `${Math.round((c.converted / c.referred) * 100)}%` },
                      { label: 'Revenue', val: c.revenue },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-luma-bg rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-luma-black">{val}</p>
                        <p className="text-xs text-luma-muted">{label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Conv rate bar */}
                  <div className="mt-3">
                    <div className="w-full h-2 bg-luma-bg rounded-full">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${(c.converted / c.referred) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="card">
              <h3 className="font-semibold text-luma-black mb-4">Top Referral Advocates</h3>
              <div className="space-y-3">
                {TOP_REFERRERS.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-4 p-3 bg-luma-bg rounded-xl">
                    <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0', i === 0 ? 'bg-gold text-luma-black' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-white border border-luma-border text-luma-muted')}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-luma-black text-sm">{c.name}</p>
                      <p className="text-xs text-luma-muted">{c.tier} Member · {c.referrals} referrals</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-luma-black">{c.referrals} refs</p>
                      <p className="text-xs text-gold">{c.points} pts</p>
                    </div>
                    <button className="btn btn-sm text-xs">Reward</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
