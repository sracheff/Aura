'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sparkles, CalendarDays, Clock, Star, Gift, ChevronRight, Phone, Mail, Cake } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

type ClientData = {
  id: string; name: string; email: string | null; phone: string | null
  points: number; total_spend: number; visits: number; tier: string; birthday: string | null
}
type Appointment = {
  id: string; service_name: string; start_time: string; status: string; price: number
  staff?: { name: string; color: string } | null
}

const TIER_COLORS: Record<string, string> = {
  Bronze:   'from-orange-200 to-orange-400',
  Silver:   'from-gray-300 to-gray-500',
  Gold:     'from-yellow-300 to-yellow-500',
  Platinum: 'from-purple-300 to-purple-500',
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-500',
  no_show:   'bg-red-100 text-red-500',
  arrived:   'bg-teal-100 text-teal-700',
}

function PortalContent() {
  const params = useSearchParams()
  const clientId = params.get('client')
  const ownerId  = params.get('owner')

  const [client, setClient]   = useState<ClientData | null>(null)
  const [upcoming, setUpcoming] = useState<Appointment[]>([])
  const [history, setHistory]  = useState<Appointment[]>([])
  const [salonName, setSalonName] = useState('Your Salon')
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'rewards'>('upcoming')

  useEffect(() => {
    if (clientId && ownerId) loadData()
    else { setError('Invalid link. Please ask your salon for a new portal link.'); setLoading(false) }
  }, [clientId, ownerId])

  async function loadData() {
    setLoading(true)
    const [cRes, settingsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).eq('owner_id', ownerId).single(),
      supabase.from('salon_settings').select('salon_name').eq('owner_id', ownerId).single(),
    ])
    if (!cRes.data) { setError('Client not found.'); setLoading(false); return }
    setClient(cRes.data)
    setSalonName(settingsRes.data?.salon_name || 'Your Salon')

    const now = new Date().toISOString()
    const [upRes, histRes] = await Promise.all([
      supabase.from('appointments')
        .select('id,service_name,start_time,status,price,staff:staff_id(name,color)')
        .eq('client_id', clientId).eq('owner_id', ownerId)
        .gte('start_time', now).order('start_time').limit(5),
      supabase.from('appointments')
        .select('id,service_name,start_time,status,price,staff:staff_id(name,color)')
        .eq('client_id', clientId).eq('owner_id', ownerId)
        .lt('start_time', now).order('start_time', { ascending: false }).limit(10),
    ])
    setUpcoming(upRes.data || [])
    setHistory(histRes.data || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1410] to-[#2D2420] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1410] to-[#2D2420] flex items-center justify-center p-4">
      <div className="text-center">
        <Sparkles size={40} className="text-[#C9A96E] mx-auto mb-4" />
        <p className="text-white font-bold text-xl mb-2">Oops!</p>
        <p className="text-white/60 text-sm">{error}</p>
      </div>
    </div>
  )

  if (!client) return null

  const nextAppt = upcoming[0]
  const tierPct  = { Bronze: 20, Silver: 45, Gold: 75, Platinum: 100 }[client.tier] || 20

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A1410] to-[#2D2420] pt-8 pb-16 px-5">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A96E] to-[#B8934A] flex items-center justify-center">
              <Sparkles size={16} className="text-[#1A1410]" />
            </div>
            <span className="text-white/80 text-sm font-semibold">{salonName}</span>
          </div>
          <p className="text-white/60 text-sm mb-1">Welcome back,</p>
          <h1 className="text-white text-3xl font-bold mb-4">{client.name.split(' ')[0]} ✨</h1>

          {/* Tier card */}
          <div className={`rounded-2xl bg-gradient-to-r ${TIER_COLORS[client.tier] || TIER_COLORS.Bronze} p-0.5 mb-4`}>
            <div className="bg-[#1A1410] rounded-[14px] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/60 text-xs">Loyalty Tier</p>
                  <p className="text-white font-bold text-lg">{client.tier} Member</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs">Points Balance</p>
                  <p className="text-[#C9A96E] font-bold text-2xl">{client.points.toLocaleString()}</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full">
                <div className="h-full rounded-full bg-gradient-to-r from-[#C9A96E] to-[#E8C87E] transition-all" style={{ width: `${tierPct}%` }} />
              </div>
              <p className="text-white/40 text-xs mt-1">{client.visits} visits · ${client.total_spend.toFixed(0)} lifetime spend</p>
            </div>
          </div>

          {/* Next appointment teaser */}
          {nextAppt ? (
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-white/60 text-xs mb-1">Your next appointment</p>
              <p className="text-white font-bold">{nextAppt.service_name}</p>
              <p className="text-[#C9A96E] text-sm font-semibold mt-0.5">
                {new Date(nextAppt.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                {' · '}
                {new Date(nextAppt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
              {(nextAppt.staff as any)?.name && (
                <p className="text-white/50 text-xs mt-0.5">with {(nextAppt.staff as any).name}</p>
              )}
            </div>
          ) : (
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-white/60 text-xs mb-1">No upcoming appointments</p>
              <Link href={`/book?owner=${ownerId}`}
                className="text-[#C9A96E] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Book now <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-5 -mt-6">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Visits', val: client.visits, icon: CalendarDays },
            { label: 'Points', val: client.points.toLocaleString(), icon: Star },
            { label: 'Spent', val: `$${client.total_spend.toFixed(0)}`, icon: Gift },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-[#EDE8E1]">
              <Icon size={16} className="text-[#C9A96E] mx-auto mb-1" />
              <p className="font-bold text-[#3D3530] text-lg">{val}</p>
              <p className="text-xs text-[#9E9085]">{label}</p>
            </div>
          ))}
        </div>

        {/* Client info chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {client.phone && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs text-[#9E9085] border border-[#EDE8E1]">
              <Phone size={11} />{client.phone}
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs text-[#9E9085] border border-[#EDE8E1]">
              <Mail size={11} />{client.email}
            </div>
          )}
          {client.birthday && (
            <div className="flex items-center gap-1.5 bg-pink-50 px-3 py-1.5 rounded-full text-xs text-pink-600 border border-pink-100">
              <Cake size={11} />
              {new Date(client.birthday + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#EDE8E1] rounded-xl p-1 mb-5">
          {([
            ['upcoming', 'Upcoming'],
            ['history',  'Visit History'],
            ['rewards',  'Rewards'],
          ] as const).map(([val, label]) => (
            <button key={val} onClick={() => setActiveTab(val)}
              className={clsx('flex-1 py-2 rounded-lg text-xs font-semibold transition-all',
                activeTab === val ? 'bg-white text-[#3D3530] shadow-sm' : 'text-[#9E9085]'
              )}>
              {label}
            </button>
          ))}
        </div>

        {/* Upcoming */}
        {activeTab === 'upcoming' && (
          <div className="space-y-3 pb-8">
            {upcoming.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#EDE8E1]">
                <CalendarDays size={32} className="mx-auto mb-3 text-[#C9A96E] opacity-40" />
                <p className="font-semibold text-[#3D3530]">No upcoming appointments</p>
                <p className="text-sm text-[#9E9085] mt-1 mb-4">Book your next visit below</p>
                <Link href={`/book?owner=${ownerId}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1A1410] text-white rounded-xl text-sm font-semibold">
                  Book Appointment <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <>
                {upcoming.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl p-4 border border-[#EDE8E1] shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#3D3530]">{a.service_name}</p>
                        <p className="text-sm text-[#C9A96E] font-semibold mt-0.5">
                          {new Date(a.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' · '}
                          {new Date(a.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        {(a.staff as any)?.name && (
                          <p className="text-xs text-[#9E9085] mt-0.5 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: (a.staff as any).color }} />
                            with {(a.staff as any).name}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[#3D3530]">${a.price}</p>
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full capitalize mt-1 inline-block', STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-500')}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <Link href={`/book?owner=${ownerId}`}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#C9A96E]/40 rounded-2xl text-[#C9A96E] text-sm font-semibold hover:border-[#C9A96E] transition-colors">
                  <CalendarDays size={15} />Book another appointment
                </Link>
              </>
            )}
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="space-y-3 pb-8">
            {history.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#EDE8E1]">
                <Clock size={32} className="mx-auto mb-3 text-[#9E9085] opacity-40" />
                <p className="font-semibold text-[#3D3530]">No visit history yet</p>
              </div>
            ) : history.map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-4 border border-[#EDE8E1] shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#3D3530] text-sm">{a.service_name}</p>
                    <p className="text-xs text-[#9E9085] mt-0.5">
                      {new Date(a.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {(a.staff as any)?.name && ` · ${(a.staff as any).name}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[#3D3530] text-sm">${a.price}</p>
                    <span className={clsx('text-xs px-1.5 py-0.5 rounded-full capitalize', STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-500')}>
                      {a.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rewards */}
        {activeTab === 'rewards' && (
          <div className="space-y-4 pb-8">
            <div className={`rounded-2xl bg-gradient-to-r ${TIER_COLORS[client.tier] || TIER_COLORS.Bronze} p-0.5`}>
              <div className="bg-white rounded-[14px] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-[#9E9085]">Current Tier</p>
                    <p className="text-2xl font-bold text-[#3D3530]">{client.tier}</p>
                  </div>
                  <p className="text-4xl font-bold text-[#C9A96E]">{client.points.toLocaleString()}<span className="text-sm font-normal text-[#9E9085]"> pts</span></p>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { tier: 'Bronze',   min: 0,    max: 499 },
                    { tier: 'Silver',   min: 500,  max: 999 },
                    { tier: 'Gold',     min: 1000, max: 2499 },
                    { tier: 'Platinum', min: 2500, max: Infinity },
                  ].map(({ tier, min, max }) => (
                    <div key={tier} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 bg-gradient-to-r ${TIER_COLORS[tier]}`} />
                      <span className={clsx('font-semibold', tier === client.tier ? 'text-[#3D3530]' : 'text-[#9E9085]')}>{tier}</span>
                      <span className="text-[#9E9085] text-xs">{min}–{max === Infinity ? '∞' : max} pts</span>
                      {tier === client.tier && <span className="ml-auto text-xs text-[#C9A96E] font-bold">← You are here</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#1A1410] rounded-2xl p-5 text-center">
              <Star size={28} className="text-[#C9A96E] mx-auto mb-2" fill="currentColor" />
              <p className="text-white font-bold mb-1">Earn points on every visit</p>
              <p className="text-white/60 text-sm">$1 spent = 1 point. Ask your stylist about bonus point promotions!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#1A1410] to-[#2D2420] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PortalContent />
    </Suspense>
  )
}
