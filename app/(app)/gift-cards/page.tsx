'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import { clsx } from 'clsx'
import { CreditCard, Plus, X, Gift, Search, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

type GiftCard = {
  id: string
  code: string
  initial_value: number
  balance: number
  issued_to: string | null
  purchased_by: string | null
  status: string
  expires_at: string | null
  notes: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  redeemed: 'bg-gray-100 text-gray-500',
  expired:  'bg-red-100 text-red-500',
  voided:   'bg-red-100 text-red-500',
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LUMA-'
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) code += chars[Math.floor(Math.random() * chars.length)]
    if (i < 3) code += '-'
  }
  return code
}

export default function GiftCardsPage() {
  const { userId, loading: authLoading } = useAuth()
  const [cards, setCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'active' | 'redeemed'>('all')

  // Issue modal
  const [showIssue, setShowIssue] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code: '', amount: '', issued_to: '', purchased_by: '', expires_at: '', notes: '' })

  // Check balance modal
  const [showCheck, setShowCheck] = useState(false)
  const [checkCode, setCheckCode] = useState('')
  const [checkResult, setCheckResult] = useState<GiftCard | null | 'notfound'>( null)

  // Reload modal
  const [showReload, setShowReload] = useState<GiftCard | null>(null)
  const [reloadAmt, setReloadAmt] = useState('')
  const [reloading, setReloading] = useState(false)

  useEffect(() => { if (userId) fetchCards() }, [userId])

  async function fetchCards() {
    setLoading(true)
    const { data } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
    setCards(data || [])
    setLoading(false)
  }

  async function issueCard(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const amt = parseFloat(form.amount) || 0
    await supabase.from('gift_cards').insert({
      owner_id: userId,
      code: form.code || generateCode(),
      initial_value: amt,
      balance: amt,
      issued_to: form.issued_to || null,
      purchased_by: form.purchased_by || null,
      expires_at: form.expires_at || null,
      notes: form.notes || null,
      status: 'active',
    })
    setSaving(false)
    setShowIssue(false)
    setForm({ code: '', amount: '', issued_to: '', purchased_by: '', expires_at: '', notes: '' })
    fetchCards()
  }

  async function voidCard(id: string) {
    await supabase.from('gift_cards').update({ status: 'voided' }).eq('id', id)
    fetchCards()
  }

  async function reloadCard(card: GiftCard) {
    const amt = parseFloat(reloadAmt) || 0
    if (amt <= 0) return
    setReloading(true)
    const newBalance = card.balance + amt
    const newInitial = card.initial_value + amt
    await supabase.from('gift_cards').update({
      balance: newBalance,
      initial_value: newInitial,
      status: 'active',
    }).eq('id', card.id)
    await supabase.from('gift_card_transactions').insert({
      owner_id: userId,
      gift_card_id: card.id,
      amount: amt,
      note: 'Reload',
    })
    setReloading(false)
    setShowReload(null)
    setReloadAmt('')
    fetchCards()
  }

  async function checkBalance() {
    if (!checkCode.trim()) return
    const { data } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('owner_id', userId)
      .ilike('code', checkCode.trim())
      .single()
    setCheckResult(data || 'notfound')
  }

  const filtered = cards
    .filter(c => tab === 'all' || c.status === tab)
    .filter(c =>
      !search || c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.issued_to || '').toLowerCase().includes(search.toLowerCase())
    )

  const totalIssued  = cards.reduce((s, c) => s + c.initial_value, 0)
  const totalBalance = cards.filter(c => c.status === 'active').reduce((s, c) => s + c.balance, 0)
  const activeCount  = cards.filter(c => c.status === 'active').length

  if (authLoading || loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Gift Cards"
        subtitle="Issue, track and manage gift card balances"
        action={{ label: 'Issue Gift Card', onClick: () => { setForm(f => ({ ...f, code: generateCode() })); setShowIssue(true) } }}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Cards',      val: activeCount,           sub: `${cards.length} total issued`,            color: 'text-green-600',  bg: 'bg-green-50' },
            { label: 'Outstanding Balance', val: `$${totalBalance.toFixed(2)}`, sub: 'Liability on active cards',    color: 'text-gold',       bg: 'bg-gold/10' },
            { label: 'Total Issued',      val: `$${totalIssued.toFixed(2)}`, sub: 'All-time gift card value',        color: 'text-blue-600',   bg: 'bg-blue-50' },
          ].map(({ label, val, sub, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-luma-border p-5">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bg)}>
                <Gift size={18} className={color} />
              </div>
              <p className="text-2xl font-bold text-luma-black">{val}</p>
              <p className="text-sm font-medium text-luma-black">{label}</p>
              <p className="text-xs text-luma-muted mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-luma-surface border border-luma-border rounded-xl p-1">
            {(['all', 'active', 'redeemed'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                  tab === t ? 'bg-white shadow-sm text-luma-black' : 'text-luma-muted hover:text-luma-black'
                )}>
                {t}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
            <input
              className="input pl-8 w-full"
              placeholder="Search code or name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setCheckCode(''); setCheckResult(null); setShowCheck(true) }}
            className="flex items-center gap-2 px-4 py-2 border border-luma-border rounded-xl text-sm font-semibold hover:bg-luma-surface"
          >
            <Search size={14} />Check Balance
          </button>
        </div>

        {/* Cards table */}
        <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 px-5 py-3 border-b border-luma-border bg-luma-surface text-xs font-semibold text-luma-muted uppercase tracking-wide">
            <span>Code / Recipient</span>
            <span className="w-24 text-right">Initial</span>
            <span className="w-24 text-right">Balance</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-24 text-right">Issued</span>
            <span className="w-20" />
          </div>
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-luma-muted">
              <CreditCard size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium text-luma-black">No gift cards found</p>
              <p className="text-sm mt-1">Issue your first gift card to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-luma-border">
              {filtered.map(card => {
                const pct = card.initial_value > 0 ? (card.balance / card.initial_value) * 100 : 0
                return (
                  <div key={card.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-0 px-5 py-4 hover:bg-luma-surface/50 transition-colors">
                    <div>
                      <p className="font-mono font-bold text-sm text-luma-black tracking-wide">{card.code}</p>
                      {card.issued_to && <p className="text-xs text-luma-muted mt-0.5">To: {card.issued_to}</p>}
                      {card.purchased_by && <p className="text-xs text-luma-muted">From: {card.purchased_by}</p>}
                      {/* Balance bar */}
                      <div className="w-32 h-1 bg-luma-surface rounded-full mt-1.5">
                        <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm font-medium text-luma-black">${card.initial_value.toFixed(2)}</div>
                    <div className={clsx('w-24 text-right text-sm font-bold', card.balance > 0 ? 'text-green-600' : 'text-luma-muted')}>
                      ${card.balance.toFixed(2)}
                    </div>
                    <div className="w-20 text-center">
                      <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[card.status] || 'bg-gray-100 text-gray-500')}>
                        {card.status}
                      </span>
                    </div>
                    <div className="w-24 text-right text-xs text-luma-muted">
                      {new Date(card.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      {card.expires_at && <div className="text-xs text-red-400">Exp {new Date(card.expires_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                    </div>
                    <div className="w-20 flex items-center justify-end gap-1">
                      {card.status === 'active' && (
                        <button onClick={() => { setShowReload(card); setReloadAmt('') }}
                          className="p-1.5 hover:bg-gold/10 rounded-lg text-luma-muted hover:text-gold transition-colors" title="Reload">
                          <RefreshCw size={13} />
                        </button>
                      )}
                      {card.status === 'active' && (
                        <button onClick={() => { if (confirm('Void this gift card?')) voidCard(card.id) }}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-luma-muted hover:text-red-500 transition-colors" title="Void">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Issue Gift Card modal ── */}
      {showIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-luma-border">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-gold" />
                <h3 className="font-bold text-luma-black">Issue Gift Card</h3>
              </div>
              <button onClick={() => setShowIssue(false)} className="text-luma-muted hover:text-luma-black"><X size={18} /></button>
            </div>
            <form onSubmit={issueCard} className="p-5 space-y-4">
              <div>
                <label className="label">Card Code</label>
                <div className="flex gap-2">
                  <input className="input flex-1 font-mono" value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="Auto-generated" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, code: generateCode() }))}
                    className="px-3 py-2 bg-luma-surface border border-luma-border rounded-xl text-xs font-semibold hover:border-gold/40 transition-colors">
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted text-sm">$</span>
                  <input required type="number" min="1" step="0.01" className="input w-full pl-7"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="50.00" />
                </div>
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100, 150, 200].map(v => (
                    <button key={v} type="button"
                      onClick={() => setForm(f => ({ ...f, amount: String(v) }))}
                      className={clsx('px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                        form.amount === String(v) ? 'bg-gold text-luma-black border-gold' : 'border-luma-border text-luma-muted hover:border-gold/40'
                      )}>
                      ${v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Issued To</label>
                  <input className="input w-full" value={form.issued_to}
                    onChange={e => setForm(f => ({ ...f, issued_to: e.target.value }))}
                    placeholder="Recipient name" />
                </div>
                <div>
                  <label className="label">Purchased By</label>
                  <input className="input w-full" value={form.purchased_by}
                    onChange={e => setForm(f => ({ ...f, purchased_by: e.target.value }))}
                    placeholder="Buyer name" />
                </div>
              </div>
              <div>
                <label className="label">Expiry Date (optional)</label>
                <input type="date" className="input w-full" value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input className="input w-full" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Birthday gift, wedding, etc." />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowIssue(false)}
                  className="flex-1 py-2.5 border border-luma-border rounded-xl text-sm font-semibold hover:bg-luma-surface">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-luma-black text-white rounded-xl text-sm font-semibold hover:bg-gold transition-colors disabled:opacity-60">
                  {saving ? 'Issuing…' : 'Issue Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Check Balance modal ── */}
      {showCheck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-luma-border">
              <h3 className="font-bold text-luma-black">Check Gift Card Balance</h3>
              <button onClick={() => setShowCheck(false)} className="text-luma-muted hover:text-luma-black"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <input className="input flex-1 font-mono uppercase" placeholder="Enter card code…"
                  value={checkCode} onChange={e => setCheckCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && checkBalance()} />
                <button onClick={checkBalance}
                  className="px-4 py-2 bg-luma-black text-white rounded-xl text-sm font-semibold hover:bg-gold transition-colors">
                  Check
                </button>
              </div>
              {checkResult === 'notfound' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={16} />Card not found. Double-check the code.
                </div>
              )}
              {checkResult && checkResult !== 'notfound' && (
                <div className="bg-luma-surface rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span className="font-bold text-luma-black font-mono">{checkResult.code}</span>
                    <span className={clsx('ml-auto text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[checkResult.status])}>{checkResult.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-luma-muted">Original value</span>
                    <span className="font-semibold">${checkResult.initial_value.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-luma-muted">Remaining balance</span>
                    <span className="font-bold text-green-600 text-lg">${checkResult.balance.toFixed(2)}</span>
                  </div>
                  {checkResult.issued_to && (
                    <div className="flex justify-between text-sm">
                      <span className="text-luma-muted">Issued to</span>
                      <span className="font-semibold">{checkResult.issued_to}</span>
                    </div>
                  )}
                  {checkResult.expires_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-luma-muted">Expires</span>
                      <span className="font-semibold">{new Date(checkResult.expires_at + 'T12:00:00').toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="w-full h-2 bg-white rounded-full mt-2">
                    <div className="h-full rounded-full bg-gold"
                      style={{ width: `${checkResult.initial_value > 0 ? (checkResult.balance / checkResult.initial_value) * 100 : 0}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reload Card modal ── */}
      {showReload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-luma-border">
              <h3 className="font-bold text-luma-black">Reload Gift Card</h3>
              <button onClick={() => setShowReload(null)} className="text-luma-muted hover:text-luma-black"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-luma-surface rounded-xl p-3 text-sm">
                <p className="font-mono font-bold text-luma-black">{showReload.code}</p>
                <p className="text-luma-muted">Current balance: <span className="font-bold text-green-600">${showReload.balance.toFixed(2)}</span></p>
              </div>
              <div>
                <label className="label">Amount to Add</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted text-sm">$</span>
                  <input type="number" min="1" step="0.01" className="input w-full pl-7"
                    value={reloadAmt} onChange={e => setReloadAmt(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReload(null)}
                  className="flex-1 py-2.5 border border-luma-border rounded-xl text-sm font-semibold hover:bg-luma-surface">Cancel</button>
                <button onClick={() => reloadCard(showReload)} disabled={reloading || !reloadAmt}
                  className="flex-1 py-2.5 bg-luma-black text-white rounded-xl text-sm font-semibold hover:bg-gold transition-colors disabled:opacity-60">
                  {reloading ? 'Adding…' : `Add $${reloadAmt || '0'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
