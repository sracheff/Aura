'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ShoppingCart,
  DollarSign,
  Users2,
  Gift,
  Package,
  BarChart3,
  Settings,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/pos', label: 'Point of Sale', icon: ShoppingCart },
  { href: '/finance', label: 'Finance', icon: DollarSign },
  { href: '/staff', label: 'Staff', icon: Users2 },
  { href: '/referrals', label: 'Referrals', icon: Gift },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 bg-luma-black flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
            <Sparkles size={16} className="text-luma-black" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">LUMA</span>
        </div>
        <p className="text-luma-muted text-xs mt-1">Salon Management</p>
      </div>

      {/* Salon selector */}
      <div className="px-4 py-3 border-b border-white/10">
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gold/20 flex items-center justify-center">
              <span className="text-gold text-xs font-bold">L</span>
            </div>
            <div className="text-left">
              <p className="text-white text-xs font-medium">Luminary Salon</p>
              <p className="text-luma-muted text-xs">Pro Plan</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-luma-muted group-hover:text-gold transition-colors" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-gold/15 text-gold'
                  : 'text-luma-muted hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={17} />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
            </Link>
          )
        })}
      </nav>

      {/* AI Coach CTA */}
      <div className="px-4 pb-4">
        <Link href="/coach" className="block rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 p-4 hover:border-gold/40 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-gold" />
            <span className="text-gold text-xs font-semibold">AI Business Coach</span>
          </div>
          <p className="text-luma-muted text-xs mb-3">Get personalized insights to grow your salon</p>
          <div className="w-full text-center bg-gold text-luma-black text-xs font-bold py-1.5 rounded-lg">Ask LUMA AI</div>
        </Link>
      </div>

      {/* User */}
      <div className="px-4 pb-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blush to-blush-dark flex items-center justify-center">
            <span className="text-white text-xs font-bold">SR</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">Stephen R.</p>
            <p className="text-luma-muted text-xs truncate">Owner</p>
          </div>
          <Settings size={14} className="text-luma-muted ml-auto shrink-0 hover:text-gold cursor-pointer" />
        </div>
      </div>
    </aside>
  )
}
