'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { clsx } from 'clsx'
import { Building2, Bell, CreditCard, Lock, Palette, Users, Globe, Sparkles, ChevronRight } from 'lucide-react'

const SECTIONS = [
  { id: 'salon', label: 'Salon Profile', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'team', label: 'Team & Roles', icon: Users },
  { id: 'booking', label: 'Booking Page', icon: Globe },
  { id: 'ai', label: 'AI Features', icon: Sparkles },
]

export default function SettingsPage() {
  const [section, setSection] = useState('salon')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Settings" subtitle="Manage your salon configuration" />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar nav */}
        <div className="w-56 shrink-0 border-r border-luma-border bg-white p-4 space-y-0.5">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                section === id ? 'bg-gold/10 text-gold' : 'text-luma-muted hover:text-luma-black hover:bg-luma-bg'
              )}
            >
              <Icon size={15} />
              {label}
              {section === id && <ChevronRight size={13} className="ml-auto" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {section === 'salon' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-luma-black mb-1">Salon Profile</h2>
                <p className="text-sm text-luma-muted">Basic information about your salon displayed to clients.</p>
              </div>

              {/* Logo */}
              <div className="card">
                <h3 className="font-medium text-luma-black mb-3 text-sm">Salon Logo</h3>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-luma-black flex items-center justify-center">
                    <span className="text-gold font-bold text-2xl">L</span>
                  </div>
                  <div>
                    <button className="btn btn-sm text-xs mb-2">Upload New Logo</button>
                    <p className="text-xs text-luma-muted">PNG or JPG, max 2MB. Recommended 512×512px.</p>
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="card space-y-4">
                <h3 className="font-medium text-luma-black text-sm">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Salon Name</label>
                    <input className="input w-full" defaultValue="Luminary Salon" />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input className="input w-full" defaultValue="(305) 555-0142" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Address</label>
                    <input className="input w-full" defaultValue="1421 Ocean Drive, Miami Beach, FL 33139" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="input w-full" type="email" defaultValue="hello@luminarysalon.com" />
                  </div>
                  <div>
                    <label className="label">Website</label>
                    <input className="input w-full" defaultValue="www.luminarysalon.com" />
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="card space-y-3">
                <h3 className="font-medium text-luma-black text-sm">Business Hours</h3>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="text-sm text-luma-black w-24">{day}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={i < 6} className="rounded" />
                      <span className="text-xs text-luma-muted">Open</span>
                    </label>
                    {i < 6 ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <select className="select text-xs py-1" defaultValue={i < 5 ? '9:00' : '10:00'}>
                          {['8:00', '9:00', '10:00'].map((t) => <option key={t}>{t} AM</option>)}
                        </select>
                        <span className="text-luma-muted text-xs">to</span>
                        <select className="select text-xs py-1" defaultValue={i < 5 ? '7:00' : '5:00'}>
                          {['5:00', '6:00', '7:00'].map((t) => <option key={t}>{t} PM</option>)}
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs text-luma-muted ml-auto">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'billing' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-luma-black mb-1">Billing & Plan</h2>
                <p className="text-sm text-luma-muted">Manage your subscription and payment methods.</p>
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="tag tag-gold text-xs font-bold mb-2 inline-block">GROWTH PLAN</span>
                    <p className="text-2xl font-bold text-luma-black">$129<span className="text-base font-normal text-luma-muted">/month</span></p>
                  </div>
                  <button className="btn btn-sm text-xs">Upgrade Plan</button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Next billing date', val: 'Jun 1, 2026' },
                    { label: 'Stylists included', val: 'Up to 8' },
                    { label: 'Payment method', val: 'Visa ····4242' },
                    { label: 'Plan status', val: 'Active' },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-luma-bg rounded-xl p-3">
                      <p className="text-xs text-luma-muted">{label}</p>
                      <p className="font-semibold text-luma-black mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-luma-black mb-1">Notifications</h2>
                <p className="text-sm text-luma-muted">Control when and how you receive alerts.</p>
              </div>
              <div className="card space-y-4">
                {[
                  { label: 'New appointment booked', sub: 'Get notified when a client books online', on: true },
                  { label: 'Appointment cancellation', sub: 'Alert when a booking is cancelled', on: true },
                  { label: 'Daily revenue summary', sub: 'End-of-day summary email', on: true },
                  { label: 'Low inventory alert', sub: 'When products drop below reorder level', on: true },
                  { label: 'New client referral', sub: 'When a client refers someone', on: false },
                  { label: 'Weekly performance report', sub: 'Every Monday morning digest', on: false },
                ].map(({ label, sub, on }, i) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-luma-border/50 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-luma-black">{label}</p>
                      <p className="text-xs text-luma-muted">{sub}</p>
                    </div>
                    <button className={clsx('w-10 h-6 rounded-full transition-all relative', on ? 'bg-gold' : 'bg-luma-border')}>
                      <div className={clsx('w-4 h-4 bg-white rounded-full absolute top-1 transition-all', on ? 'left-5' : 'left-1')} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'ai' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-luma-black mb-1">AI Features</h2>
                <p className="text-sm text-luma-muted">Powered by GPT-4o — configure AI-assisted features.</p>
              </div>
              <div className="card space-y-4">
                {[
                  { label: 'AI Business Coach', sub: 'Personalized insights and growth recommendations', on: true },
                  { label: 'Smart Scheduling', sub: 'AI fills gaps and suggests optimal appointment times', on: true },
                  { label: 'Churn Prediction', sub: 'Flag at-risk clients before they leave', on: true },
                  { label: 'Auto Win-Back Campaigns', sub: 'Automatically draft campaigns for lapsed clients', on: false },
                  { label: 'AI Service Recommendations', sub: 'Suggest upsells based on client history', on: false },
                ].map(({ label, sub, on }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-luma-border/50 last:border-b-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-luma-black">{label}</p>
                        {on && <span className="tag tag-gold text-xs">Active</span>}
                      </div>
                      <p className="text-xs text-luma-muted">{sub}</p>
                    </div>
                    <button className={clsx('w-10 h-6 rounded-full transition-all relative', on ? 'bg-gold' : 'bg-luma-border')}>
                      <div className={clsx('w-4 h-4 bg-white rounded-full absolute top-1 transition-all', on ? 'left-5' : 'left-1')} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!['salon', 'billing', 'notifications', 'ai'].includes(section) && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-luma-black mb-1 capitalize">{SECTIONS.find((s) => s.id === section)?.label}</h2>
              <p className="text-sm text-luma-muted mb-6">Configure your {section} settings.</p>
              <div className="card text-center py-12 text-luma-muted">
                <p className="text-sm">This section is coming soon in the next release.</p>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="mt-6 max-w-2xl flex justify-end">
            <button
              onClick={handleSave}
              className={clsx('btn btn-primary', saved && 'bg-green-500 hover:bg-green-500')}
            >
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
