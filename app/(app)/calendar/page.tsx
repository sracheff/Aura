'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { APPOINTMENTS, STYLISTS } from '@/lib/data'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, Clock, MoreHorizontal } from 'lucide-react'

const HOURS = ['9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00']

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DATES = [5, 6, 7, 8, 9, 10, 11]

function parseHour(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h + m / 60
}

export default function CalendarPage() {
  const [view, setView] = useState<'week' | 'day' | 'list'>('week')
  const [selected, setSelected] = useState<string | null>(null)

  const apt = selected ? APPOINTMENTS.find((a) => a.id === selected) : null

  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Calendar" subtitle="Week of May 5–11, 2026" action={{ label: 'New Appointment' }} />
      <div className="flex flex-1 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 overflow-auto p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg border border-luma-border hover:bg-white transition-colors"><ChevronLeft size={16} /></button>
              <span className="text-sm font-semibold text-luma-black px-2">May 2026</span>
              <button className="p-1.5 rounded-lg border border-luma-border hover:bg-white transition-colors"><ChevronRight size={16} /></button>
              <button className="btn btn-sm ml-2 text-xs">Today</button>
            </div>
            <div className="flex items-center gap-1 bg-luma-bg border border-luma-border rounded-lg p-0.5">
              {(['week', 'day', 'list'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={clsx('px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize', view === v ? 'bg-white shadow-sm text-luma-black' : 'text-luma-muted hover:text-luma-black')}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Stylist filter */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <span className="text-xs text-luma-muted shrink-0">Filter:</span>
            {STYLISTS.map((s) => (
              <button
                key={s.id}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-luma-border hover:border-gold/40 bg-white transition-colors shrink-0"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {view === 'week' && (
            <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-8 border-b border-luma-border">
                <div className="p-3 border-r border-luma-border" />
                {DAYS.map((d, i) => (
                  <div
                    key={d}
                    className={clsx('p-3 text-center border-r border-luma-border last:border-r-0', DATES[i] === 8 && 'bg-gold/5')}
                  >
                    <p className="text-xs text-luma-muted">{d}</p>
                    <p className={clsx('text-sm font-semibold mt-0.5', DATES[i] === 8 ? 'text-gold' : 'text-luma-black')}>{DATES[i]}</p>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="relative">
                {HOURS.map((h, hi) => (
                  <div key={h} className="grid grid-cols-8 border-b border-luma-border/50 last:border-b-0">
                    <div className="p-2 border-r border-luma-border text-xs text-luma-muted text-right pr-3 py-3">{h}</div>
                    {DAYS.map((_, di) => (
                      <div
                        key={di}
                        className={clsx('border-r border-luma-border/50 last:border-r-0 min-h-[52px] relative', DATES[di] === 8 && 'bg-gold/3')}
                      >
                        {/* Render appointments for this day/hour */}
                        {APPOINTMENTS.filter((a) => {
                          if (DATES[di] !== 8) return false
                          const aptH = parseHour(a.start)
                          const slotH = parseHour(h)
                          return aptH >= slotH && aptH < slotH + 1
                        }).map((a) => {
                          const stylist = STYLISTS.find((s) => s.name.split(' ')[0] === a.col)
                          return (
                            <div
                              key={a.id}
                              onClick={() => setSelected(a.id === selected ? null : a.id)}
                              className={clsx(
                                'absolute left-1 right-1 rounded-lg p-1.5 cursor-pointer transition-all text-white text-xs',
                                selected === a.id && 'ring-2 ring-gold ring-offset-1'
                              )}
                              style={{
                                backgroundColor: stylist?.color || '#C9A96E',
                                top: '2px',
                                minHeight: '44px',
                              }}
                            >
                              <p className="font-semibold truncate">{a.client}</p>
                              <p className="opacity-80 truncate">{a.svc}</p>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'list' && (
            <div className="space-y-2">
              {APPOINTMENTS.map((a) => {
                const stylist = STYLISTS.find((s) => s.name.split(' ')[0] === a.col)
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelected(a.id === selected ? null : a.id)}
                    className={clsx('bg-white rounded-xl border border-luma-border p-4 flex items-center gap-4 cursor-pointer hover:border-gold/40 transition-all', selected === a.id && 'border-gold')}
                  >
                    <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: stylist?.color }} />
                    <div className="flex items-center gap-1.5 text-xs text-luma-muted w-14 shrink-0">
                      <Clock size={11} />
                      {a.start}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-luma-black text-sm">{a.client}</p>
                      <p className="text-xs text-luma-muted">{a.svc} · {a.col} · {a.dur}m</p>
                    </div>
                    <span className={clsx('tag', a.status === 'confirmed' ? 'tag-green' : a.status === 'arrived' ? 'tag-gold' : a.status === 'completed' ? 'tag-blue' : 'tag-gray')}>
                      {a.status}
                    </span>
                    <span className="text-sm font-semibold text-luma-black">${a.price}</span>
                    <button className="p-1 hover:bg-luma-bg rounded-lg transition-colors"><MoreHorizontal size={15} className="text-luma-muted" /></button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Appointment detail panel */}
        {apt && (
          <div className="w-72 shrink-0 border-l border-luma-border bg-white p-5 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-luma-black">Appointment</h3>
              <button onClick={() => setSelected(null)} className="text-luma-muted hover:text-luma-black text-xs">✕</button>
            </div>
            {(() => {
              const stylist = STYLISTS.find((s) => s.name.split(' ')[0] === apt.col)
              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl" style={{ backgroundColor: (stylist?.bg || '#FBF5E8') }}>
                    <p className="font-bold text-luma-black text-lg">{apt.client}</p>
                    <p className="text-sm text-luma-mid">{apt.svc}</p>
                    <p className="text-xs text-luma-muted mt-1">{apt.start} · {apt.dur} min</p>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-luma-muted">Stylist</span>
                      <span className="font-medium text-luma-black">{apt.col}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-luma-muted">Price</span>
                      <span className="font-semibold text-luma-black">${apt.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-luma-muted">Status</span>
                      <span className={clsx('tag', apt.status === 'confirmed' ? 'tag-green' : apt.status === 'arrived' ? 'tag-gold' : apt.status === 'completed' ? 'tag-blue' : 'tag-gray')}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-luma-muted">Loyalty pts</span>
                      <span className="font-medium text-luma-black">+{apt.loyalty}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button className="btn btn-sm text-xs">Reschedule</button>
                    <button className="btn btn-primary btn-sm text-xs">Check Out</button>
                  </div>
                  <button className="btn btn-danger btn-sm w-full text-xs">Cancel Appointment</button>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
