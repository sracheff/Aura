'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { Sparkles, Send, RefreshCw, User, TrendingUp, Users, Scissors, DollarSign, Calendar } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  { icon: <TrendingUp size={14} />, text: 'How can I grow my revenue this month?' },
  { icon: <Users size={14} />, text: 'Which clients am I at risk of losing?' },
  { icon: <Scissors size={14} />, text: 'What are my most profitable services?' },
  { icon: <DollarSign size={14} />, text: 'How should I adjust my pricing?' },
  { icon: <Calendar size={14} />, text: 'What are my slowest days and how do I fill them?' },
  { icon: <Users size={14} />, text: 'Write a re-engagement text for clients I haven\'t seen in 60 days' },
]

function formatMessage(text: string) {
  // Convert **bold** to bold spans, and newlines to breaks
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const lines = msg.content.split('\n')

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${isUser ? 'bg-luma-black' : 'bg-gradient-to-br from-gold to-gold-dark'}`}>
        {isUser ? <User size={14} className="text-white" /> : <Sparkles size={14} className="text-luma-black" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-luma-black text-white rounded-tr-sm'
          : 'bg-white border border-luma-border text-luma-black rounded-tl-sm shadow-sm'
      }`}>
        {lines.map((line, i) => {
          if (line.startsWith('- ') || line.startsWith('• ')) {
            return (
              <div key={i} className="flex gap-2 mb-1">
                <span className="text-gold mt-0.5">•</span>
                <span>{formatMessage(line.slice(2))}</span>
              </div>
            )
          }
          if (line.match(/^\d+\./)) {
            return <div key={i} className="mb-1">{formatMessage(line)}</div>
          }
          if (line === '') return <div key={i} className="h-2" />
          return <div key={i}>{formatMessage(line)}</div>
        })}
      </div>
    </div>
  )
}

export default function CoachPage() {
  const { userId, loading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [context, setContext] = useState('')
  const [contextLoaded, setContextLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (userId) loadContext()
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function loadContext() {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

    const [txRes, clientRes, staffRes, apptRes, expRes] = await Promise.all([
      supabase.from('transactions').select('total, created_at, transaction_items(name, price, qty, type)').eq('owner_id', userId).gte('created_at', lastMonthStart),
      supabase.from('clients').select('name, tier, total_spend, visits, last_visit, points').eq('owner_id', userId),
      supabase.from('staff').select('name, commission_rate, active').eq('owner_id', userId),
      supabase.from('appointments').select('price, status, start_time, service_name').eq('owner_id', userId).gte('start_time', monthStart),
      supabase.from('expenses').select('category, amount, date').eq('owner_id', userId).gte('date', monthStart.split('T')[0]),
    ])

    const transactions = txRes.data || []
    const clients = clientRes.data || []
    const staff = staffRes.data || []
    const appointments = apptRes.data || []
    const expenses = expRes.data || []

    // Revenue this month vs last month
    const thisMthTx = transactions.filter(t => t.created_at >= monthStart)
    const lastMthTx = transactions.filter(t => t.created_at < monthStart)
    const thisMthRev = thisMthTx.reduce((s, t) => s + t.total, 0)
    const lastMthRev = lastMthTx.reduce((s, t) => s + t.total, 0)
    const avgTicket = thisMthTx.length > 0 ? thisMthRev / thisMthTx.length : 0

    // Top services
    const serviceMap: Record<string, { count: number; rev: number }> = {}
    transactions.forEach(t => {
      ;(t.transaction_items || []).forEach((item: { type: string; name: string; qty: number; price: number }) => {
        if (item.type === 'service') {
          if (!serviceMap[item.name]) serviceMap[item.name] = { count: 0, rev: 0 }
          serviceMap[item.name].count += item.qty
          serviceMap[item.name].rev += item.price * item.qty
        }
      })
    })
    const topServices = Object.entries(serviceMap).sort((a, b) => b[1].rev - a[1].rev).slice(0, 5)

    // Client stats
    const atRisk = clients.filter(c => {
      if (!c.last_visit) return false
      const days = (Date.now() - new Date(c.last_visit).getTime()) / 86400000
      return days > 60
    })
    const tiers = { Diamond: 0, Gold: 0, Silver: 0, Bronze: 0 } as Record<string, number>
    clients.forEach(c => { tiers[c.tier] = (tiers[c.tier] || 0) + 1 })

    // Expenses this month
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const netProfit = thisMthRev - totalExpenses

    // Appointments this month
    const completedAppts = appointments.filter(a => a.status === 'completed').length
    const cancelledAppts = appointments.filter(a => a.status === 'cancelled').length

    const ctx = `
SALON OVERVIEW (as of ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}):

REVENUE:
- This month: $${thisMthRev.toFixed(0)} (${thisMthTx.length} transactions)
- Last month: $${lastMthRev.toFixed(0)} (${lastMthTx.length} transactions)
- Change: ${lastMthRev > 0 ? ((thisMthRev - lastMthRev) / lastMthRev * 100).toFixed(1) : 'N/A'}%
- Avg ticket this month: $${avgTicket.toFixed(0)}
- Total expenses this month: $${totalExpenses.toFixed(0)}
- Net profit this month: $${netProfit.toFixed(0)}

CLIENTS (${clients.length} total):
- Diamond: ${tiers.Diamond || 0}, Gold: ${tiers.Gold || 0}, Silver: ${tiers.Silver || 0}, Bronze: ${tiers.Bronze || 0}
- At-risk (no visit 60+ days): ${atRisk.length} clients
- At-risk names: ${atRisk.slice(0, 5).map(c => c.name).join(', ') || 'none'}
- Top spender: ${clients.sort((a, b) => b.total_spend - a.total_spend)[0]?.name || 'N/A'} ($${clients[0]?.total_spend?.toFixed(0) || 0})

STAFF (${staff.filter(s => s.active).length} active):
${staff.map(s => `- ${s.name}: ${s.commission_rate}% commission, ${s.active ? 'active' : 'inactive'}`).join('\n') || '- No staff added yet'}

TOP SERVICES (last 30 days):
${topServices.length > 0 ? topServices.map(([name, v]) => `- ${name}: ${v.count}x, $${v.rev.toFixed(0)} revenue`).join('\n') : '- No completed services yet'}

APPOINTMENTS THIS MONTH:
- Completed: ${completedAppts}
- Cancelled: ${cancelledAppts}
- Cancellation rate: ${completedAppts + cancelledAppts > 0 ? ((cancelledAppts / (completedAppts + cancelledAppts)) * 100).toFixed(0) : 0}%
`.trim()

    setContext(ctx)
    setContextLoaded(true)

    // Welcome message
    setMessages([{
      role: 'assistant',
      content: `Hi! I'm LUMA AI, your salon business coach. 👋\n\nI've loaded your live salon data — ${clients.length} clients, $${thisMthRev.toFixed(0)} in revenue this month${atRisk.length > 0 ? `, and I see ${atRisk.length} clients you haven't seen in 60+ days` : ''}.\n\nWhat would you like to work on today?`
    }])
  }

  async function sendMessage(text?: string) {
    const userText = text || input.trim()
    if (!userText || thinking || !contextLoaded) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setThinking(true)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I ran into an issue: ${data.error}. Make sure your ANTHROPIC_API_KEY is set in Vercel.` }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t connect. Please try again.' }])
    }
    setThinking(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function resetChat() {
    setMessages([{
      role: 'assistant',
      content: `Chat reset. I still have your latest salon data loaded. What would you like to work on?`
    }])
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-luma-surface">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-luma-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-sm">
            <Sparkles size={18} className="text-luma-black" />
          </div>
          <div>
            <h1 className="font-bold text-luma-black">LUMA AI Coach</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${contextLoaded ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-xs text-luma-muted">{contextLoaded ? 'Live salon data loaded' : 'Loading your data...'}</span>
            </div>
          </div>
        </div>
        <button onClick={resetChat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-luma-muted hover:text-luma-black hover:bg-luma-border transition-colors">
          <RefreshCw size={13} />New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

        {/* Thinking indicator */}
        {thinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <Sparkles size={14} className="text-luma-black" />
            </div>
            <div className="bg-white border border-luma-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (show when only welcome message) */}
      {messages.length <= 1 && contextLoaded && (
        <div className="px-6 pb-4">
          <p className="text-xs text-luma-muted mb-2 font-medium">Suggested questions</p>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s.text)}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-luma-border rounded-xl text-left text-xs text-luma-black hover:border-gold hover:shadow-sm transition-all"
              >
                <span className="text-gold shrink-0">{s.icon}</span>
                {s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage() }}
          className="flex items-center gap-3 bg-white border border-luma-border rounded-2xl px-4 py-3 shadow-sm focus-within:border-gold transition-colors"
        >
          <input
            ref={inputRef}
            className="flex-1 text-sm bg-transparent outline-none text-luma-black placeholder:text-luma-muted"
            placeholder={contextLoaded ? 'Ask anything about your salon...' : 'Loading your data...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={!contextLoaded || thinking}
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking || !contextLoaded}
            className="w-8 h-8 rounded-xl bg-gold flex items-center justify-center disabled:opacity-40 hover:bg-gold-dark transition-colors shrink-0"
          >
            <Send size={14} className="text-luma-black" />
          </button>
        </form>
        <p className="text-center text-xs text-luma-muted mt-2">Powered by Claude · Responses based on your live salon data</p>
      </div>
    </div>
  )
}
