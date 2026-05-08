'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import { Plus, X, Trash2, TrendingDown, DollarSign, BarChart3, ShoppingBag, Zap, Wrench, Megaphone, Users2, HelpCircle, AlertCircle, ChevronDown } from 'lucide-react'

const CATEGORIES = [
  { value: 'rent',      label: 'Rent / Lease',    icon: '🏢', color: 'bg-purple-100 text-purple-700' },
  { value: 'supplies',  label: 'Supplies',         icon: '🧴', color: 'bg-blue-100 text-blue-700'   },
  { value: 'utilities', label: 'Utilities',        icon: '⚡', color: 'bg-yellow-100 text-yellow-700'},
  { value: 'equipment', label: 'Equipment',        icon: '🔧', color: 'bg-orange-100 text-orange-700'},
  { value: 'marketing', label: 'Marketing',        icon: '📣', color: 'bg-pink-100 text-pink-700'   },
  { value: 'payroll',   label: 'Payroll / Staff',  icon: '👥', color: 'bg-green-100 text-green-700' },
  { value: 'other',     label: 'Other',            icon: '📦', color: 'bg-gray-100 text-gray-600'   },
]

type Expense = {
  id: string
  category: string
  amount: number
  expense_date: string
  vendor: string | null
  notes: string | null
  created_at: string
}

const emptyForm = {
  category: 'supplies',
  amount: '',
  expense_date: new Date().toISOString().split('T')[0],
  vendor: '',
  notes: '',
}

export default function ExpensesPage() {
  const { userId, loading } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (userId) fetchExpenses()
  }, [userId, period])

  function getPeriodStart() {
    const now = new Date()
    if (period === 'month')   return new Date(now.getFullYear(), now.getMonth(), 1)
    if (period === 'quarter') return new Date(now.getFullYear(), now.getMonth() - 2, 1)
    return new Date(now.getFullYear(), 0, 1)
  }

  async function fetchExpenses() {
    const start = getPeriodStart().toISOString().split('T')[0]
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('owner_id', userId)
      .gte('expense_date', start)
      .order('expense_date', { ascending: false })
    if (data) setExpenses(data)
  }

  async function saveExpense() {
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Amount must be greater than 0'); return }
    if (!form.expense_date) { setError('Date is required'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('expenses').insert({
      owner_id: userId,
      category: form.category,
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
      vendor: form.vendor || null,
      notes: form.notes || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowModal(false)
    setForm(emptyForm)
    fetchExpenses()
  }

  async function deleteExpense(id: string) {
    await supabase.from('expenses').delete().eq('id', id)
    setDeleteId(null)
    fetchExpenses()
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  // By category
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Expenses" action={{ label: 'Add Expense', onClick: () => { setForm(emptyForm); setError(''); setShowModal(true) } }} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Period selector */}
        <div className="flex items-center gap-2">
          {([['month','This Month'],['quarter','This Quarter'],['year','This Year']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${period === val ? 'bg-luma-black text-white' : 'bg-luma-surface text-luma-muted hover:text-luma-black'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-luma-border">
            <div className="text-red-500 mb-2"><TrendingDown size={18} /></div>
            <div className="text-2xl font-bold text-luma-black">${totalExpenses.toFixed(0)}</div>
            <div className="text-sm text-luma-muted">Total Expenses</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-luma-border">
            <div className="text-gold mb-2"><BarChart3 size={18} /></div>
            <div className="text-2xl font-bold text-luma-black">{expenses.length}</div>
            <div className="text-sm text-luma-muted">Transactions</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-luma-border">
            <div className="text-blue-500 mb-2"><DollarSign size={18} /></div>
            <div className="text-2xl font-bold text-luma-black">
              ${expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(0) : '0'}
            </div>
            <div className="text-sm text-luma-muted">Avg per Entry</div>
          </div>
        </div>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div className="bg-white rounded-2xl border border-luma-border p-5">
            <h3 className="font-bold text-luma-black mb-4">By Category</h3>
            <div className="space-y-3">
              {byCategory.map(cat => {
                const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0
                return (
                  <div key={cat.value} className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">{cat.icon}</span>
                    <div className="w-28 shrink-0 text-sm font-medium text-luma-black">{cat.label}</div>
                    <div className="flex-1 h-2 bg-luma-surface rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-sm font-bold text-luma-black w-20 text-right">${cat.total.toFixed(0)}</div>
                    <div className="text-xs text-luma-muted w-10 text-right">{pct.toFixed(0)}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Expense list */}
        <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
          <div className="px-6 py-4 border-b border-luma-border flex items-center justify-between">
            <h3 className="font-bold text-luma-black">All Expenses</h3>
            <span className="text-sm text-luma-muted">{expenses.length} entries</span>
          </div>

          {expenses.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingDown size={36} className="mx-auto mb-3 text-luma-muted opacity-20" />
              <p className="font-medium text-luma-black">No expenses yet</p>
              <p className="text-sm text-luma-muted mt-1">Track rent, supplies, and other business costs</p>
              <button onClick={() => { setForm(emptyForm); setError(''); setShowModal(true) }} className="btn btn-primary mt-4">
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="divide-y divide-luma-border">
              {expenses.map(exp => {
                const cat = CATEGORIES.find(c => c.value === exp.category) || CATEGORIES[6]
                return (
                  <div key={exp.id} className="flex items-center px-6 py-4 gap-4 hover:bg-luma-surface/50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${cat.color} shrink-0`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-luma-black text-sm">{cat.label}</div>
                      <div className="text-xs text-luma-muted flex items-center gap-2 mt-0.5">
                        <span>{new Date(exp.expense_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {exp.vendor && <><span>·</span><span>{exp.vendor}</span></>}
                        {exp.notes && <><span>·</span><span className="truncate max-w-[120px]">{exp.notes}</span></>}
                      </div>
                    </div>
                    <div className="font-bold text-luma-black">${exp.amount.toFixed(2)}</div>
                    <button
                      onClick={() => setDeleteId(exp.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-luma-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Delete this expense?</h3>
            <p className="text-luma-muted text-sm mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
              <button onClick={() => deleteExpense(deleteId)} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add expense modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-luma-border">
              <h2 className="text-lg font-bold">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={14} />{error}
                </div>
              )}

              <div>
                <label className="label">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setForm({...form, category: cat.value})}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                        form.category === cat.value ? 'border-gold bg-gold/10 text-luma-black' : 'border-luma-border text-luma-muted hover:border-gold/40'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-center leading-tight">{cat.label.split(' / ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount ($) *</label>
                  <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                </div>
                <div>
                  <label className="label">Date *</label>
                  <input className="input" type="date" value={form.expense_date}
                    onChange={e => setForm({...form, expense_date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="label">Vendor / Source</label>
                <input className="input" placeholder="e.g. Salon Centric, ConEd, Amazon..."
                  value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
              </div>

              <div>
                <label className="label">Notes</label>
                <input className="input" placeholder="Optional notes..."
                  value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="p-6 border-t border-luma-border flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
              <button onClick={saveExpense} disabled={saving} className="flex-1 btn btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
