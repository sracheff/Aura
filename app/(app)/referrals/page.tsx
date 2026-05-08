'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/topbar'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'
import {
  Gift, Users, DollarSign, Trophy, Copy, CheckCircle2,
  TrendingUp, Plus, X, Trash2, Star, ChevronDown,
} from 'lucide-react'

type Campaign = {
  id: string
  name: string
  description: string | null
  status: string
  reward_description: string
  new_client_offer: string | null
  ends_at: string | null
  created_at: string
}

type Referral = {
  id: string
  campaign_id: string | null
  referrer_client_id: string | null
  referred_client_id: string | null
  referred_name: string | null
  status: string
  notes: string | null
  created_at: string
  referrer?: { name: string } | null
  referred?: { name: string } | null
  campaign?: { name: string } | null
}

type Client = { id: string; name: string }

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  converted: 'bg-blue-100 text-blue-700',
  rewarded:  'bg-green-100 text-green-700',
}

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  ended:  'bg-gray-100 text-gray-500',
}

export default function ReferralsPage() {
  const { userId, loading: authLoading } = useAuth()
  const [campaigns, setCampaigns]   = useState<Campaign[]>([])
  const [referrals, setReferrals]   = useState<Referral[]>([])
  const [clients, setClients]       = useState<Client[]>([])
  const [activeTab, setActiveTab]   = useState<'campaigns' | 'advocates' | 'all'>('campaigns')
  const [copied, setCopied]         = useState(false)
  const [loading, setLoading]       = useState(true)

  // Modals
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [showAddReferral, setShowAddReferral] = useState(false)
  const [savingC, setSavingC] = useState(false)
  const [savingR, setSavingR] = useState(false)

  const [campaignForm, setCampaignForm] = useState({
    name: '', description: '', reward_description: '$25 credit',
    new_client_offer: '', ends_at: '',
  })
  const [referralForm, setReferralForm] = useState({
    referrer_client_id: '', referred_name: '', referred_client_id: '',
    campaign_id: '', status: 'pending', notes: '',
  })

  useEffect(() => { if (userId) fetchAll() }, [userId])

  async function fetchAll() {
    setLoading(true)
    const [cRes, rRes, clRes] = await Promise.all([
      supabase.from('referral_campaigns').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
      supabase.from('referrals').select(`
        *,
        referrer:referrer_client_id(name),
        referred:referred_client_id(name),
        campaign:campaign_id(name)
      `).eq('owner_id', userId).order('created_at', { ascending: false }),
      supabase.from('clients').select('id,name').eq('owner_id', userId).order('name'),
    ])
    setCampaigns(cRes.data || [])
    setReferrals(rRes.data || [])
    setClients(clRes.data || [])
    setLoading(false)
  }

  // ── KPIs ─────────────────────────────────────────────────────────────
  const totalReferrals    = referrals.length
  const converted         = referrals.filter(r => r.status === 'converted' || r.status === 'rewarded').length
  const rewarded          = referrals.filter(r => r.status === 'rewarded').length
  const activeCampaigns   = campaigns.filter(c => c.status === 'active').length
  const convRate          = totalReferrals > 0 ? Math.round((converted / totalReferrals) * 100) : 0

  // ── Top advocates ─────────────────────────────────────────────────────
  const advocateMap = new Map<string, { name: string; count: number; converted: number; rewarded: number }>()
  for (const r of referrals) {
    if (!r.referrer_client_id) continue
    const key = r.referrer_client_id
    const name = (r.referrer as any)?.name || 'Unknown'
    const cur = advocateMap.get(key) || { name, count: 0, converted: 0, rewarded: 0 }
    cur.count++
    if (r.status === 'converted' || r.status === 'rewarded') cur.converted++
    if (r.status === 'rewarded') cur.rewarded++
    advocateMap.set(key, cur)
  }
  const topAdvocates = Array.from(advocateMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)

  // ── Campaign stats ────────────────────────────────────────────────────
  function campaignStats(campaignId: string) {
    const cr = referrals.filter(r => r.campaign_id === campaignId)
    const conv = cr.filter(r => r.status !== 'pending').length
    return { total: cr.length, converted: conv, rate: cr.length > 0 ? Math.round((conv / cr.length) * 100) : 0 }
  }

  // ── Referral link ─────────────────────────────────────────────────────
  const bookingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/book?owner=${userId}`
    : ''

  function copyLink() {
    navigator.clipboard.writeText(bookingLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Save campaign ─────────────────────────────────────────────────────
  async function saveCampaign(e: React.FormEvent) {
    e.preventDefault()
    setSavingC(true)
    await supabase.from('referral_campaigns').insert({
      owner_id: userId,
      name: campaignForm.name,
      description: campaignForm.description || null,
      reward_description: campaignForm.reward_description,
      new_client_offer: campaignForm.new_client_offer || null,
      ends_at: campaignForm.ends_at || null,
      status: 'active',
    })
    setSavingC(false)
    setShowNewCampaign(false)
    setCampaignForm({ name: '', description: '', reward_description: '$25 credit', new_client_offer: '', ends_at: '' })
    fetchAll()
  }

  // ── Save referral ─────────────────────────────────────────────────────
  async function saveReferral(e: React.FormEvent) {
    e.preventDefault()
    if (!referralForm.referrer_client_id) return
    setSavingR(true)
    await supabase.from('referrals').insert({
      owner_id: userId,
      campaign_id: referralForm.campaign_id || null,
      referrer_client_id: referralForm.referrer_client_id,
      referred_client_id: referralForm.referred_client_id || null,
      referred_name: referralForm.referred_name || null,
      status: referralForm.status,
      notes: referralForm.notes || null,
    })
    setSavingR(false)
    setShowAddReferral(false)
    setReferralForm({ referrer_client_id: '', referred_name: '', referred_client_id: '', campaign_id: '', status: 'pending', notes: '' })
    fetchAll()
  }

  async function updateReferralStatus(id: string, status: string) {
    await supabase.from('referrals').update({ status }).eq('id', id)
    fetchAll()
  }

  async function deleteReferral(id: string) {
    await supabase.from('referrals').delete().eq('id', id)
    fetchAll()
  }

  async function updateCampaignStatus(id: string, status: string) {
    await supabase.from('referral_campaigns').update({ status }).eq('id', id)
    fetchAll()
  }

  async function deleteCampaign(id: string) {
    await supabase.from('referral_campaigns').delete().eq('id', id)
    fetchAll()
  }

  async function rewardAdvocate(clientId: string) {
    // Mark all converted referrals for this advocate as rewarded
    await supabase.from('referrals')
      .update({ status: 'rewarded' })
      .eq('owner_id', userId)
      .eq('referrer_client_id', clientId)
      .eq('status', 'converted')
    fetchAll()
  }

  if (authLoading || loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Referrals"
        subtitle="Grow your salon through word-of-mouth"
        action={{ label: 'New Campaign', onClick: () => setShowNewCampaign(true) }}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Referrals',   val: totalReferrals,        sub: `${activeCampaigns} active campaign${activeCampaigns !== 1 ? 's' : ''}`, icon: Users,         color: 'text-blue-600',   bg: 'bg-blue-50' },
            { label: 'Converted',         val: converted,              sub: `${convRate}% conversion rate`,                                          icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50' },
            { label: 'Rewards Issued',    val: rewarded,               sub: `${totalReferrals - rewarded} pending reward`,                           icon: Gift,          color: 'text-gold',       bg: 'bg-gold/10' },
            { label: 'Top Advocates',     val: topAdvocates.length,    sub: topAdvocates[0] ? `#1: ${topAdvocates[0].name}` : 'No referrals yet',    icon: Trophy,        color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, val, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-luma-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-luma-muted font-medium">{label}</p>
                  <p className="text-2xl font-bold text-luma-black mt-0.5">{val}</p>
                  <p className="text-xs text-luma-muted mt-1 flex items-center gap-1">
                    <TrendingUp size={10} />{sub}
                  </p>
                </div>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
                  <Icon size={18} className={color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Referral link card */}
        <div className="rounded-2xl bg-luma-black p-6">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <p className="text-gold text-xs font-semibold mb-1 uppercase tracking-wide">Referral Link</p>
              <h3 className="text-white font-bold text-lg mb-1">Share & earn rewards together</h3>
              <p className="text-white/60 text-sm mb-4">Send your booking link to clients — when they refer a friend who books, you can track and reward them here.</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white/70 text-sm font-mono truncate">
                  {bookingLink || 'Loading...'}
                </div>
                <button
                  onClick={copyLink}
                  className={clsx(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0',
                    copied ? 'bg-green-500 text-white' : 'bg-gold text-luma-black hover:opacity-90'
                  )}
                >
                  {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => setShowAddReferral(true)}
                className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-semibold transition-colors"
              >
                <Plus size={15} />Log Referral
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 bg-luma-surface border border-luma-border rounded-xl p-1 mb-5 w-fit">
            {([
              ['campaigns', 'Campaigns'],
              ['advocates', 'Top Advocates'],
              ['all',       'All Referrals'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setActiveTab(val)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === val ? 'bg-white shadow-sm text-luma-black' : 'text-luma-muted hover:text-luma-black'
                )}
              >
                {label}
                {val === 'all' && referrals.length > 0 && (
                  <span className="ml-1.5 text-xs bg-luma-surface text-luma-muted px-1.5 py-0.5 rounded-full">{referrals.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Campaigns tab ── */}
          {activeTab === 'campaigns' && (
            <div className="space-y-3">
              {campaigns.length === 0 ? (
                <div className="bg-white rounded-2xl border border-luma-border p-12 text-center text-luma-muted">
                  <Gift size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-luma-black">No campaigns yet</p>
                  <p className="text-sm mt-1">Create your first referral campaign to start rewarding advocates</p>
                  <button onClick={() => setShowNewCampaign(true)} className="mt-4 px-4 py-2 bg-luma-black text-white rounded-xl text-sm font-semibold hover:bg-gold transition-colors">
                    + New Campaign
                  </button>
                </div>
              ) : (
                campaigns.map(c => {
                  const stats = campaignStats(c.id)
                  return (
                    <div key={c.id} className="bg-white rounded-2xl border border-luma-border p-5 hover:border-gold/40 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                            <Gift size={18} className="text-gold" />
                          </div>
                          <div>
                            <p className="font-bold text-luma-black">{c.name}</p>
                            {c.description && <p className="text-xs text-luma-muted mt-0.5">{c.description}</p>}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-luma-muted">Referrer gets: <span className="font-semibold text-luma-black">{c.reward_description}</span></span>
                              {c.new_client_offer && <span className="text-xs text-luma-muted">· New client: <span className="font-semibold text-luma-black">{c.new_client_offer}</span></span>}
                              {c.ends_at && <span className="text-xs text-luma-muted">· Ends {new Date(c.ends_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', CAMPAIGN_STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-500')}>{c.status}</span>
                          <div className="relative group">
                            <button className="p-1.5 rounded-lg hover:bg-luma-surface text-luma-muted">
                              <ChevronDown size={14} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-luma-border rounded-xl shadow-lg py-1 w-36 z-10 hidden group-hover:block">
                              {c.status !== 'active'  && <button onClick={() => updateCampaignStatus(c.id, 'active')}  className="w-full text-left px-3 py-2 text-xs hover:bg-luma-surface">Set Active</button>}
                              {c.status !== 'paused'  && <button onClick={() => updateCampaignStatus(c.id, 'paused')}  className="w-full text-left px-3 py-2 text-xs hover:bg-luma-surface">Pause</button>}
                              {c.status !== 'ended'   && <button onClick={() => updateCampaignStatus(c.id, 'ended')}   className="w-full text-left px-3 py-2 text-xs hover:bg-luma-surface">End Campaign</button>}
                              <button onClick={() => deleteCampaign(c.id)} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50">Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                          { label: 'Referred',   val: stats.total },
                          { label: 'Converted',  val: stats.converted },
                          { label: 'Conv. Rate', val: `${stats.rate}%` },
                        ].map(({ label, val }) => (
                          <div key={label} className="bg-luma-surface rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-luma-black">{val}</p>
                            <p className="text-xs text-luma-muted">{label}</p>
                          </div>
                        ))}
                      </div>
                      {stats.total > 0 && (
                        <div className="mt-3">
                          <div className="w-full h-1.5 bg-luma-surface rounded-full">
                            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${stats.rate}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── Top Advocates tab ── */}
          {activeTab === 'advocates' && (
            <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
              {topAdvocates.length === 0 ? (
                <div className="p-12 text-center text-luma-muted">
                  <Trophy size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-luma-black">No advocates yet</p>
                  <p className="text-sm mt-1">Log your first referral to start building your leaderboard</p>
                </div>
              ) : (
                <div className="divide-y divide-luma-border">
                  {topAdvocates.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                      <div className={clsx(
                        'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                        i === 0 ? 'bg-gold text-luma-black' :
                        i === 1 ? 'bg-gray-200 text-gray-700' :
                        i === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-luma-surface border border-luma-border text-luma-muted'
                      )}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-luma-black text-sm">{a.name}</p>
                        <p className="text-xs text-luma-muted">
                          {a.count} referral{a.count !== 1 ? 's' : ''} · {a.converted} converted · {a.rewarded} rewarded
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-gold">
                          <Star size={12} fill="currentColor" />
                          <span className="text-xs font-bold">{a.count}</span>
                        </div>
                        {a.converted > a.rewarded && (
                          <button
                            onClick={() => rewardAdvocate(a.id)}
                            className="px-3 py-1.5 bg-gold text-luma-black rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                          >
                            Issue Reward
                          </button>
                        )}
                        {a.converted > 0 && a.converted === a.rewarded && (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} />All rewarded
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── All Referrals tab ── */}
          {activeTab === 'all' && (
            <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
              <div className="px-5 py-3 border-b border-luma-border flex items-center justify-between">
                <h3 className="font-semibold text-luma-black text-sm">All Referrals</h3>
                <button
                  onClick={() => setShowAddReferral(true)}
                  className="flex items-center gap-1 text-xs text-gold font-semibold hover:text-gold-dark"
                >
                  <Plus size={13} />Log Referral
                </button>
              </div>
              {referrals.length === 0 ? (
                <div className="p-12 text-center text-luma-muted">
                  <Users size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-luma-black">No referrals logged</p>
                  <p className="text-sm mt-1">Log referrals manually or they'll appear here automatically when clients use your referral link</p>
                </div>
              ) : (
                <div className="divide-y divide-luma-border">
                  {referrals.map(r => {
                    const referrerName = (r.referrer as any)?.name || 'Unknown'
                    const referredName = (r.referred as any)?.name || r.referred_name || 'Unnamed'
                    const campaignName = (r.campaign as any)?.name
                    return (
                      <div key={r.id} className="flex items-center gap-4 px-5 py-3 group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-luma-black">
                            {referrerName} <span className="text-luma-muted font-normal">referred</span> {referredName}
                          </p>
                          <p className="text-xs text-luma-muted">
                            {campaignName && `${campaignName} · `}
                            {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {r.notes && ` · ${r.notes}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={r.status}
                            onChange={e => updateReferralStatus(r.id, e.target.value)}
                            className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer appearance-none text-center', STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500')}
                          >
                            <option value="pending">pending</option>
                            <option value="converted">converted</option>
                            <option value="rewarded">rewarded</option>
                          </select>
                          <button
                            onClick={() => deleteReferral(r.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg text-luma-muted hover:text-red-500 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── New Campaign modal ── */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-luma-border">
              <h3 className="font-bold text-luma-black">New Campaign</h3>
              <button onClick={() => setShowNewCampaign(false)} className="text-luma-muted hover:text-luma-black"><X size={18} /></button>
            </div>
            <form onSubmit={saveCampaign} className="p-5 space-y-4">
              <div>
                <label className="label">Campaign Name *</label>
                <input
                  required className="input w-full"
                  value={campaignForm.name}
                  onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Spring Glow-Up, Friends & Family"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  className="input w-full"
                  value={campaignForm.description}
                  onChange={e => setCampaignForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details about the campaign"
                />
              </div>
              <div>
                <label className="label">Referrer Reward *</label>
                <input
                  required className="input w-full"
                  value={campaignForm.reward_description}
                  onChange={e => setCampaignForm(f => ({ ...f, reward_description: e.target.value }))}
                  placeholder="e.g. $25 credit, 15% off next visit"
                />
              </div>
              <div>
                <label className="label">New Client Offer (optional)</label>
                <input
                  className="input w-full"
                  value={campaignForm.new_client_offer}
                  onChange={e => setCampaignForm(f => ({ ...f, new_client_offer: e.target.value }))}
                  placeholder="e.g. 10% off first visit"
                />
              </div>
              <div>
                <label className="label">End Date (optional)</label>
                <input
                  type="date" className="input w-full"
                  value={campaignForm.ends_at}
                  onChange={e => setCampaignForm(f => ({ ...f, ends_at: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNewCampaign(false)} className="flex-1 py-2.5 border border-luma-border rounded-xl text-sm font-semibold hover:bg-luma-surface">Cancel</button>
                <button type="submit" disabled={savingC} className="flex-1 py-2.5 bg-luma-black text-white rounded-xl text-sm font-semibold hover:bg-gold transition-colors disabled:opacity-60">
                  {savingC ? 'Saving...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Referral modal ── */}
      {showAddReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-luma-border">
              <h3 className="font-bold text-luma-black">Log Referral</h3>
              <button onClick={() => setShowAddReferral(false)} className="text-luma-muted hover:text-luma-black"><X size={18} /></button>
            </div>
            <form onSubmit={saveReferral} className="p-5 space-y-4">
              <div>
                <label className="label">Referring Client *</label>
                <select
                  required className="input w-full"
                  value={referralForm.referrer_client_id}
                  onChange={e => setReferralForm(f => ({ ...f, referrer_client_id: e.target.value }))}
                >
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Person Referred</label>
                <p className="text-xs text-luma-muted mb-1.5">Select if they're already a client, or enter their name</p>
                <select
                  className="input w-full mb-2"
                  value={referralForm.referred_client_id}
                  onChange={e => setReferralForm(f => ({ ...f, referred_client_id: e.target.value }))}
                >
                  <option value="">Not a client yet...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!referralForm.referred_client_id && (
                  <input
                    className="input w-full"
                    value={referralForm.referred_name}
                    onChange={e => setReferralForm(f => ({ ...f, referred_name: e.target.value }))}
                    placeholder="Their name (if not a client yet)"
                  />
                )}
              </div>
              <div>
                <label className="label">Campaign (optional)</label>
                <select
                  className="input w-full"
                  value={referralForm.campaign_id}
                  onChange={e => setReferralForm(f => ({ ...f, campaign_id: e.target.value }))}
                >
                  <option value="">No campaign</option>
                  {campaigns.filter(c => c.status === 'active').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input w-full"
                  value={referralForm.status}
                  onChange={e => setReferralForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="pending">Pending — they haven't booked yet</option>
                  <option value="converted">Converted — they've booked</option>
                  <option value="rewarded">Rewarded — reward has been issued</option>
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input
                  className="input w-full"
                  value={referralForm.notes}
                  onChange={e => setReferralForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any notes about this referral"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddReferral(false)} className="flex-1 py-2.5 border border-luma-border rounded-xl text-sm font-semibold hover:bg-luma-surface">Cancel</button>
                <button type="submit" disabled={savingR || !referralForm.referrer_client_id} className="flex-1 py-2.5 bg-luma-black text-white rounded-xl text-sm font-semibold hover:bg-gold transition-colors disabled:opacity-60">
                  {savingR ? 'Saving...' : 'Log Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
