'use client'

import { Bell, Search, Plus, ChevronDown } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: string
  action?: { label: string; onClick?: () => void }
}

export default function Topbar({ title, subtitle, action }: TopbarProps) {
  return (
    <header className="h-16 border-b border-luma-border bg-luma-bg/80 backdrop-blur-sm sticky top-0 z-10 flex items-center px-6 gap-4">
      {/* Title */}
      <div className="flex-1">
        <h1 className="text-luma-black font-semibold text-lg leading-none">{title}</h1>
        {subtitle && <p className="text-luma-muted text-xs mt-0.5">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
        <input
          type="text"
          placeholder="Search clients, appointments..."
          className="pl-9 pr-4 py-2 text-sm bg-white border border-luma-border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold placeholder:text-luma-muted"
        />
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-white border border-transparent hover:border-luma-border transition-all">
        <Bell size={18} className="text-luma-mid" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full" />
      </button>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary btn-sm flex items-center gap-1.5"
        >
          <Plus size={15} />
          {action.label}
        </button>
      )}

      {/* Date */}
      <div className="hidden lg:flex items-center gap-1.5 text-xs text-luma-muted border-l border-luma-border pl-4">
        <span className="font-medium text-luma-mid">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <ChevronDown size={12} />
      </div>
    </header>
  )
}
