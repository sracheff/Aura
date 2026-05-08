'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import { Bell, CheckCircle, XCircle, Phone, MessageSquare } from 'lucide-react'

type ReminderLog = {
  id: string
  appointment_id: string | null
  client_id: string | null
  channel: string
  phone: string | null
  message: string | null
  status: string
  sent_at: string
  clients?: { name: string } | null
  appointments?: { start_time: string; service_name: string } | null
}

export default function RemindersPage() {
  const { userId, loading } = useAuth()
  const [logs, setLogs]           = useState<ReminderLog[]>([])
  const [filter, setFilter]       = useState<'all' | 'sent' | 'failed'>('all')
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (userId) fetchLogs()
  }, [userId])

  async function fetchLogs() {
    setLoadingData(true)
    const { data } = await supabase
      .from('reminder_logs')
      .select('*, clients(name), appointments(start_time, service_name)')
      .eq('owner_id', userId)
      .order('sent_at', { ascending: false })
      .limit(200)
    if (data) setLogs(data)
    setLoadingData(false)
  }

  const filtered = logs.filter(l => {
    if (filter === 'all') return true
    return l.status === filter
  })

  const sentCount   = logs.filter(l => l.status === 'sent').length
  const failedCount = logs.filter(l => l.status === 'failed').length

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Reminder Log" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-luma-border">
            <div className="text-2xl font-bold text-luma-black">{logs.length}</div>
            <div className="text-sm text-luma-muted">Total Sent</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-luma-border">
            <div className="text-2xl font-bold text-green-600">{sentCount}</div>
            <div className="text-sm text-luma-muted">Delivered</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-luma-border">
            <div className="text-2xl font-bold text-red-500">{failedCount}</div>
            <div className="text-sm text-luma-muted">Failed</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {([['all','All'],['sent','Sent'],['failed','Failed']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === val ? 'bg-luma-black text-white' : 'bg-luma-surface text-luma-muted hover:text-luma-black'}`}>
              {label}
            </button>
          ))}
          {loadingData && <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin ml-2 self-center" />}
        </div>

        {/* Log table */}
        <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Bell size={36} className="mx-auto mb-3 text-luma-muted opacity-20" />
              <p className="font-medium text-luma-black">No reminders yet</p>
              <p className="text-sm text-luma-muted mt-1">
                Reminders sent from the Calendar and auto-cron will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 px-6 py-3 border-b border-luma-border bg-luma-surface text-xs font-semibold text-luma-muted uppercase tracking-wide">
                <span className="w-6" />
                <span>Client / Appointment</span>
                <span className="w-28 text-center">Channel</span>
                <span className="w-32 text-right">Sent At</span>
                <span className="w-20 text-center">Status</span>
              </div>
              <div className="divide-y divide-luma-border">
                {filtered.map(log => (
                  <div key={log.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] items-start gap-0 px-6 py-4">
                    <div className="w-6 flex justify-center pt-0.5">
                      {log.status === 'sent'
                        ? <CheckCircle size={14} className="text-green-500" />
                        : <XCircle size={14} className="text-red-400" />
                      }
                    </div>
                    <div className="pl-3">
                      <div className="font-medium text-luma-black text-sm">
                        {log.clients?.name || log.phone || 'Unknown'}
                      </div>
                      {log.appointments && (
                        <div className="text-xs text-luma-muted mt-0.5">
                          {log.appointments.service_name} · {new Date(log.appointments.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                      {log.message && (
                        <div className="text-xs text-luma-muted/70 mt-1 truncate max-w-xs italic">"{log.message}"</div>
                      )}
                    </div>
                    <div className="w-28 flex items-center justify-center gap-1 text-xs text-luma-muted">
                      {log.channel === 'sms' ? <><Phone size={10} />SMS</> : <><MessageSquare size={10} />{log.channel}</>}
                    </div>
                    <div className="w-32 text-right text-xs text-luma-muted">
                      {new Date(log.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <br />
                      {new Date(log.sent_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </div>
                    <div className="w-20 flex justify-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
