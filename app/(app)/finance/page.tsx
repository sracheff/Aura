'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase, Expense } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react'

const EXPENSE_CATEGORIES = ['backbar', 'Rent', 'Utilities', 'Payroll', 'Supplies', 'Marketing', 'Insurance', 'Equipment', 'Software', 'Other']
const COGS_CATEGORIES = ['backbar']
const EXPENSE_TYPES = ['fixed', 'variable']

const emptyForm = {
  category: 'Rent', vendor: '', amount: 0,
  type: 'fixed', date: new Date().toISOString().split('T')[0]
}

export default function FinancePage() {
  const { userId, loading } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; expenses: number }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    if (userId) {
      fetchExpenses()
      fetchRevenue()
    }
  }, [userId, period])

  async function fetchExpenses() {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('owner_id', userId)
      .order('date', { ascending: false })
    if (data) setExpenses(data)
  }

  async function fetchRevenue() {
    // Build monthly buckets for past 6 months
    const months: { month: string; revenue: number; expenses: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const start = d.toISOString()
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const startDate = start.split('T')[0]
      const endDate = end.split('T')[0]

      const [txRes, expRes] = await Promise.all([
        supabase.from('transactions').select('total').eq('owner_id', userId).gte('created_at', start).lte('created_at', end),
        supabase.from('expenses').select('amount').eq('owner_id', userId)
          .or(`expense_date.gte.${startDate},date.gte.${startDate}`)
          .or(`expense_date.lte.${endDate},date.lte.${endDate}`)
      ])
      const rev = (txRes.data || []).reduce((s, t) => s + t.total, 0)
      const exp = (expRes.data || []).reduce((s, e) => s + e.amount, 0)
      months.push({ month: label, revenue: rev, expenses: exp })
    }
    setRevenueData(months)
  }

  const totalRevenue = (revenueData[revenueData.length - 1]?.revenue || 0)

  // Split expenses: COGS (backbar) vs Operating
  const currentMonthExpenses = expenses.filter(e => {
    const dateStr = (e as any).expense_date || e.date
    if (!dateStr) return false
    const d = new Date(dateStr + 'T00:00:00')
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const cogsExpenses = currentMonthExpenses.filter(e => COGS_CATEGORIES.includes(e.category))
  const opExpenses = currentMonthExpenses.filter(e => !COGS_CATEGORIES.includes(e.category))
  const cogsTotal = cogsExpenses.reduce((s, e) => s + e.amount, 0)
  const opTotal = opExpenses.reduce((s, e) => s + e.amount, 0)
  const totalExpenses = cogsTotal + opTotal
  const grossProfit = totalRevenue - cogsTotal
  const netProfit = grossProfit - opTotal
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0'
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'

  function openAdd() {
    setForm(emptyForm)
    setEditTarget(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(e: Expense) {
    setForm({ category: e.category, vendor: e.vendor || '', amount: e.amount, type: e.type, date: e.date })
    setEditTarget(e)
    setError('')
    setShowModal(true)
  }

  async function saveExpense() {
    if (!form.amount || form.amount <= 0) { setError('Amount must be greater than 0'); return }
    setSaving(true)
    setError('')
    const payload = { ...form, owner_id: userId }
    if (editTarget) {
      const { error: err } = await supabase.from('expenses').update(payload).eq('id', editTarget.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('expenses').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setShowModal(false)
    fetchExpenses()
    fetchRevenue()
  }

  async function deleteExpense() {
    if (!deleteTarget) return
    await supabase.from('expenses').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    fetchExpenses()
    fetchRevenue()
  }

  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Finance" action={{ label: 'Add Expense', onClick: openAdd }} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* P&L Summary */}
        <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
          <div className="px-6 py-4 border-b border-luma-border">
            <h3 className="font-bold text-luma-black">Profit & Loss — Month to Date</h3>
          </div>
          <div className="p-6 space-y-1">
            {/* Revenue */}
            <div className="flex items-center justify-between py-2.5 border-b border-luma-border">
              <div className="flex items-center gap-2 text-sm font-semibold text-luma-black">
                <TrendingUp size={15} className="text-green-600" /> Revenue
              </div>
              <span className="font-bold text-green-600 text-base">${totalRevenue.toFixed(2)}</span>
            </div>
            {/* COGS */}
            <div className="flex items-center justify-between py-2 pl-4">
              <span className="text-sm text-luma-muted">Backbar / Cost of Services</span>
              <span className="text-sm font-medium text-red-500">−${cogsTotal.toFixed(2)}</span>
            </div>
            {/* Gross Profit */}
            <div className="flex items-center justify-between py-2.5 border-t border-b border-luma-border bg-luma-surface/50 px-3 rounded-xl">
              <span className="text-sm font-bold text-luma-black">Gross Profit</span>
              <div className="text-right">
                <span className={`font-bold text-base ${grossProfit >= 0 ? 'text-gold' : 'text-red-500'}`}>${grossProfit.toFixed(2)}</span>
                <span className="text-xs text-luma-muted ml-2">({grossMargin}% margin)</span>
              </div>
            </div>
            {/* Operating Expenses */}
            <div className="flex items-center justify-between py-2 pl-4">
              <span className="text-sm text-luma-muted">Operating Expenses</span>
              <span className="text-sm font-medium text-red-500">−${opTotal.toFixed(2)}</span>
            </div>
            {/* Net Profit */}
            <div className={`flex items-center justify-between py-3 px-3 rounded-xl ${netProfit >= 0 ? 'bg-gold/10' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 font-bold text-luma-black">
                <DollarSign size={16} className={netProfit >= 0 ? 'text-gold' : 'text-red-500'} />
                Net Profit
              </div>
              <div className="text-right">
                <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-gold' : 'text-red-500'}`}>${netProfit.toFixed(2)}</span>
                <span className="text-xs text-luma-muted ml-2">({profitMargin}% margin)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Revenue', value: `$${totalRevenue.toFixed(0)}`, color: 'text-green-600', bg: 'bg-green-50', icon: <TrendingUp size={18} /> },
            { label: 'Backbar / COGS', value: `$${cogsTotal.toFixed(0)}`, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <span className="text-base">🧪</span> },
            { label: 'Operating Exp.', value: `$${opTotal.toFixed(0)}`, color: 'text-red-500', bg: 'bg-red-50', icon: <TrendingDown size={18} /> },
            { label: 'Net Profit', value: `$${netProfit.toFixed(0)}`, color: netProfit >= 0 ? 'text-gold' : 'text-red-500', bg: netProfit >= 0 ? 'bg-gold/10' : 'bg-red-50', icon: <DollarSign size={18} /> },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-luma-border">
              <div className={`w-10 h-10 rounded-xl ${k.bg} ${k.color} flex items-center justify-center mb-3`}>{k.icon}</div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-sm text-luma-muted mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Revenue vs Expenses chart */}
        <div className="bg-white rounded-2xl p-6 border border-luma-border">
          <h3 className="font-bold text-luma-black mb-4">Revenue vs Expenses (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barGap={4}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9E9085' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9E9085' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number) => `$${v.toFixed(0)}`} contentStyle={{ borderRadius: 12, border: '1px solid #EDE8E1' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#C9A96E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#F4C5C5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {/* Expense breakdown */}
          <div className="col-span-2 bg-white rounded-2xl p-5 border border-luma-border">
            <h3 className="font-bold text-luma-black mb-4">Expenses by Category</h3>
            {expenseByCategory.length === 0 ? (
              <p className="text-sm text-luma-muted py-4 text-center">No expenses recorded yet</p>
            ) : (
              <div className="space-y-2">
                {expenseByCategory.map(({ cat, total }) => {
                  const maxTotal = expenseByCategory[0].total
                  const pct = (total / maxTotal) * 100
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-luma-black">{cat}</span>
                        <span className="text-luma-muted">${total.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-luma-surface rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Expense list */}
          <div className="col-span-3 bg-white rounded-2xl border border-luma-border overflow-hidden">
            <div className="px-5 py-4 border-b border-luma-border flex items-center justify-between">
              <h3 className="font-bold text-luma-black">Recent Expenses</h3>
              <button onClick={openAdd} className="btn btn-primary py-1.5 px-3 text-sm">
                <Plus size={14} className="inline mr-1" />Add
              </button>
            </div>
            <div className="divide-y divide-luma-border max-h-80 overflow-y-auto">
              {expenses.length === 0 ? (
                <div className="py-10 text-center text-luma-muted text-sm">No expenses yet</div>
              ) : (
                expenses.map(e => (
                  <div key={e.id} className="flex items-center px-5 py-3 hover:bg-luma-surface group">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-luma-black">{e.category}</div>
                      <div className="text-xs text-luma-muted">{e.vendor || '—'} · {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · <span className="capitalize">{e.type}</span></div>
                    </div>
                    <div className="text-base font-bold text-red-500 mr-3">-${e.amount.toFixed(0)}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(e)} className="p-1 rounded hover:bg-luma-border text-luma-muted hover:text-luma-black"><Edit2 size={12} /></button>
                      <button onClick={() => setDeleteTarget(e)} className="p-1 rounded hover:bg-red-50 text-luma-muted hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Delete expense?</h3>
            <p className="text-luma-muted text-sm mb-4">{deleteTarget.category} · ${deleteTarget.amount.toFixed(0)}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
              <button onClick={deleteExpense} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-luma-border">
              <h2 className="text-lg font-bold">{editTarget ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle size={14} />{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {EXPENSE_TYPES.map(t => <option key={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Vendor / Payee</label>
                  <input className="input" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} placeholder="Landlord, Supplier..." />
                </div>
                <div>
                  <label className="label">Amount ($)</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)||0})} placeholder="0.00" />
                </div>
                <div className="col-span-2">
                  <label className="label">Date</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-luma-border flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
              <button onClick={saveExpense} disabled={saving} className="flex-1 btn btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
