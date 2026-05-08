'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, CalendarDays, CalendarClock, Users, ShoppingCart,
  DollarSign, Users2, Gift, Package, BarChart3,
  Settings, Sparkles, PanelLeftClose, PanelLeftOpen, CreditCard, ClipboardList,
  TrendingDown, Clock, Bell,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/calendar',   label: 'Calendar',      icon: CalendarDays },
  { href: '/schedule',   label: 'Schedule',      icon: CalendarClock },
  { href: '/clients',    label: 'Clients',       icon: Users },
  { href: '/pos',        label: 'Point of Sale', icon: ShoppingCart },
  { href: '/finance',    label: 'Finance',       icon: DollarSign },
  { href: '/staff',      label: 'Staff',         icon: Users2 },
  { href: '/gift-cards', label: 'Gift Cards',    icon: CreditCard },
  { href: '/referrals',  label: 'Referrals',     icon: Gift },
  { href: '/inventory',  label: 'Inventory',     icon: Package },
  { href: '/expenses',   label: 'Expenses',      icon: TrendingDown },
  { href: '/reports',    label: 'Reports',       icon: BarChart3 },
  { href: '/waitlist',   label: 'Waitlist',      icon: Clock },
  { href: '/reminders',  label: 'Reminders',     icon: Bell },
  { href: '/forms',      label: 'Intake Forms',  icon: ClipboardList },
  { href: '/settings',   label: 'Settings',      icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('luma-sidebar-collapsed')
      if (saved === 'true') setCollapsed(true)
    } catch {}
  }, [])

  function toggle() {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('luma-sidebar-collapsed', String(next)) } catch {}
      return next
    })
  }

  return (
    <aside
      style={{ transition: 'width 0.25s ease' }}
      className={clsx(
        'shrink-0 bg-luma-black flex flex-col h-screen sticky top-0 overflow-hidden',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo row */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-white/10 min-h-[68px]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-luma-black" />
            </div>
            <div>
              <p className="text-white font-bold text-lg tracking-tight leading-none">LUMA</p>
              <p className="text-luma-muted text-xs mt-0.5">Salon Management</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mx-auto">
            <Sparkles size={16} className="text-luma-black" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={toggle}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={15} className="text-white/70" />
          </button>
        )}
      </div>

      {/* Collapse toggle when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-2 border-b border-white/10">
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={15} className="text-white/70" />
          </button>
        </div>
      )}

      {/* Salon selector — only when expanded */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
            <div className="w-6 h-6 rounded bg-gold/20 flex items-center justify-center shrink-0">
              <span className="text-gold text-xs font-bold">L</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">Luminary Salon</p>
              <p className="text-luma-muted text-xs">Pro Plan</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className={clsx('flex-1 overflow-y-auto py-3 space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                'flex items-center rounded-lg text-sm font-medium transition-all',
                collapsed
                  ? 'justify-center w-10 h-10 mx-auto'
                  : 'gap-3 px-3 py-2.5',
                active
                  ? 'bg-gold/15 text-gold'
                  : 'text-luma-muted hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && (
                <>
                  <span>{label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* AI Coach */}
      {!collapsed ? (
        <div className="px-3 pb-3">
          <Link
            href="/coach"
            className="block rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 p-3 hover:border-gold/40 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} className="text-gold" />
              <span className="text-gold text-xs font-semibold">AI Business Coach</span>
            </div>
            <p className="text-luma-muted text-xs mb-2">Get personalized insights to grow your salon</p>
            <div className="w-full text-center bg-gold text-luma-black text-xs font-bold py-1.5 rounded-lg">
              Ask LUMA AI
            </div>
          </Link>
        </div>
      ) : (
        <div className="flex justify-center pb-3">
          <Link
            href="/coach"
            title="AI Business Coach"
            className="w-10 h-10 rounded-xl bg-gold/15 hover:bg-gold/25 flex items-center justify-center transition-colors"
          >
            <Sparkles size={17} className="text-gold" />
          </Link>
        </div>
      )}

      {/* User */}
      <div className={clsx('border-t border-white/10 py-3', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blush to-blush-dark flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">SR</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">Stephen R.</p>
              <p className="text-luma-muted text-xs">Owner</p>
            </div>
            <Link href="/settings">
              <Settings size={14} className="text-luma-muted hover:text-gold transition-colors" />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blush to-blush-dark flex items-center justify-center" title="Stephen R.">
              <span className="text-white text-xs font-bold">SR</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
