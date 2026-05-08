'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase, Client } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import {
  Users, Plus, Search, Star, ChevronRight,
  Mail, Phone, Calendar, DollarSign, Gift,
  X, Edit2, Trash2, AlertCircle, Crown, Award, Gem,
  ExternalLink, Copy, FlaskConical, ChevronDown, ChevronUp, Save
} from 'lucide-react'

const TIERS = ['Bronze', 'Silver', 'Gold', 'Diamond']

const tierConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  Diamond: { color: 'text-blue-600', bg: 'bg-blue-50', icon: <Gem size={12} /> },
  Gold:    { color: 'text-gold',     bg: 'bg-gold/10', icon: <Crown size={12} /> },
  Silver:  { color: 'text-gray-500', bg: 'bg-gray-100', icon: <Award size={12} /> },
  Bronze:  { color: 'text-orange-600', bg: 'bg-orange-50', icon: <Star size={12} /> },
}

function getTier(totalSpend: number): string {
  if (totalSpend >= 2000) return 'Diamond'
  if (totalSpend >= 1000) return 'Gold'
  if (totalSpend >= 500)  return 'Silver'
  return 'Bronze'
}

const emptyForm = {
  name: '', email: '', phone: '', notes: '', birthday: '',
  tier: 'Bronze', points: 0, total_spend: 0, visits: 0, referrals: 0
}

const emptyFormula = {
  service_name: '', formula: '', developer: '', process_time: '', notes: '',
  applied_at: new Date().toISOString().split('T')[0],
  products_used: [] as { product_id: string; product_name: string; amount: string; unit: string }[]
}

export default function ClientsPage() {
  const { userId, loading } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('All')
  const [selected, setSelected] = useState<Client | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Formulas
  const [formulas, setFormulas] = useState<any[]>([])
  const [showFormulaModal, setShowFormulaModal] = useState(false)
  const [editFormula, setEditFormula] = useState<any | null>(null)
  const [formulaForm, setFormulaForm] = useState(emptyFormula)
  const [savingFormula, setSavingFormula] = useState(false)
  const [formulaError, setFormulaError] = useState('')
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [clientTab, setClientTab] = useState<'overview' | 'formulas'>('overview')

  useEffect(() => {
    if (userId) {
      fetchClients()
      fetchProducts()
    }
  }, [userId])

  useEffect(() => {
    if (selected) {
      fetchFormulas(selected.id)
      setClientTab('overview')
    }
  }, [selected])

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('owner_id', userId)
      .order('name')
    if (data) setClients(data)
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name, brand, qty').eq('owner_id', userId).order('name')
    if (data) setProducts(data)
  }

  async function fetchFormulas(clientId: string) {
    const { data } = await supabase.from('client_formulas').select('*').eq('client_id', clientId).order('applied_at', { ascending: false })
    if (data) setFormulas(data)
  }

  function openAddFormula() {
    setFormulaForm({ ...emptyFormula, applied_at: new Date().toISOString().split('T')[0] })
    setEditFormula(null)
    setFormulaError('')
    setShowFormulaModal(true)
  }

  function openEditFormula(f: any) {
    setFormulaForm({
      service_name: f.service_name, formula: f.formula, developer: f.developer || '',
      process_time: f.process_time || '', notes: f.notes || '',
      applied_at: f.applied_at || new Date().toISOString().split('T')[0],
      products_used: f.products_used || [],
    })
    setEditFormula(f)
    setFormulaError('')
    setShowFormulaModal(true)
  }

  async function saveFormula() {
    if (!formulaForm.service_name.trim()) { setFormulaError('Service name is required'); return }
    if (!formulaForm.formula.trim()) { setFormulaError('Formula is required'); return }
    if (!selected) return
    setSavingFormula(true)
    setFormulaError('')

    const payload = {
      ...formulaForm,
      client_id: selected.id,
      owner_id: userId,
    }

    let savedOk = false
    if (editFormula) {
      const { error } = await supabase.from('client_formulas').update(payload).eq('id', editFormula.id)
      savedOk = !error
    } else {
      const { error } = await supabase.from('client_formulas').insert(payload)
      savedOk = !error
    }

    // Deduct inventory for each product used
    if (savedOk && formulaForm.products_used.length > 0) {
      for (const p of formulaForm.products_used) {
        if (!p.product_id || !p.amount) continue
        const amt = parseFloat(p.amount) || 0
        if (amt <= 0) continue
        // Fetch current qty
        const { data: prod } = await supabase.from('products').select('qty').eq('id', p.product_id).single()
        if (prod) {
          const newQty = Math.max(0, (prod.qty || 0) - amt)
          await supabase.from('products').update({ qty: newQty }).eq('id', p.product_id)
        }
      }
    }

    setSavingFormula(false)
    setShowFormulaModal(false)
    fetchFormulas(selected.id)
    fetchProducts() // Refresh product quantities
  }

  async function deleteFormula(id: string) {
    if (!selected) return
    await supabase.from('client_formulas').delete().eq('id', id)
    fetchFormulas(selected.id)
  }

  function addProductRow() {
    setFormulaForm(f => ({ ...f, products_used: [...f.products_used, { product_id: '', product_name: '', amount: '', unit: 'oz' }] }))
  }

  function removeProductRow(i: number) {
    setFormulaForm(f => ({ ...f, products_used: f.products_used.filter((_, idx) => idx !== i) }))
  }

  function updateProductRow(i: number, field: string, val: string) {
    setFormulaForm(f => ({
      ...f,
      products_used: f.products_used.map((p, idx) => {
        if (idx !== i) return p
        if (field === 'product_id') {
          const prod = products.find(pr => pr.id === val)
          return { ...p, product_id: val, product_name: prod?.name || '' }
        }
        return { ...p, [field]: val }
      })
    }))
  }

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search)
    const matchTier = tierFilter === 'All' || c.tier === tierFilter
    return matchSearch && matchTier
  })

  function openAdd() {
    setForm(emptyForm)
    setEditMode(false)
    setError('')
    setShowModal(true)
  }

  function openEdit(c: Client) {
    setForm({
      name: c.name, email: c.email || '', phone: c.phone || '',
      notes: c.notes || '', birthday: (c as any).birthday || '', tier: c.tier, points: c.points,
      total_spend: c.total_spend, visits: c.visits, referrals: c.referrals
    })
    setEditMode(true)
    setError('')
    setShowModal(true)
  }

  async function saveClient() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      tier: getTier(form.total_spend),
      owner_id: userId
    }
    if (editMode && selected) {
      const { error: err } = await supabase.from('clients').update(payload).eq('id', selected.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('clients').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setShowModal(false)
    setSelected(null)
    fetchClients()
  }

  async function deleteClient() {
    if (!selected) return
    await supabase.from('clients').delete().eq('id', selected.id)
    setSelected(null)
    setDeleteConfirm(false)
    fetchClients()
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Clients"
        action={{ label: 'Add Client', onClick: openAdd }}
      />

      <div className="flex-1 flex min-h-0">
        {/* List */}
        <div className={`flex flex-col ${selected ? 'w-1/2' : 'flex-1'} min-h-0`}>
          {/* Filters */}
          <div className="px-6 py-4 border-b border-luma-border flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
              <input
                className="input pl-9 py-2 text-sm"
                placeholder="Search clients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              {['All', ...TIERS].map(t => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    tierFilter === t ? 'bg-luma-black text-white' : 'bg-luma-surface text-luma-muted hover:text-luma-black'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="px-6 py-3 bg-luma-surface border-b border-luma-border flex gap-6 text-sm">
            <span className="text-luma-muted">Total: <span className="font-semibold text-luma-black">{clients.length}</span></span>
            {TIERS.map(t => (
              <span key={t} className="text-luma-muted">
                {t}: <span className="font-semibold text-luma-black">{clients.filter(c => c.tier === t).length}</span>
              </span>
            ))}
          </div>

          {/* Client list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-luma-muted">
                <Users size={40} className="mb-3 opacity-30" />
                <p className="font-medium">No clients yet</p>
                <p className="text-sm mt-1">Add your first client to get started</p>
                <button onClick={openAdd} className="btn btn-primary mt-4">Add Client</button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b border-luma-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">Tier</th>
                    <th className="text-right px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">Spent</th>
                    <th className="text-right px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">Visits</th>
                    <th className="text-right px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">Points</th>
                    <th className="text-right px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">Last Visit</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-luma-border">
                  {filtered.map(c => {
                    const tc = tierConfig[c.tier] || tierConfig.Bronze
                    const isSelected = selected?.id === c.id
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(isSelected ? null : c)}
                        className={`cursor-pointer hover:bg-luma-surface transition-colors ${isSelected ? 'bg-gold/5' : ''}`}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white text-xs font-bold">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-luma-black">{c.name}</div>
                              <div className="text-xs text-luma-muted">{c.email || c.phone || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tc.bg} ${tc.color}`}>
                            {tc.icon}{c.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">${c.total_spend.toFixed(0)}</td>
                        <td className="px-4 py-3 text-right text-luma-muted">{c.visits}</td>
                        <td className="px-4 py-3 text-right text-luma-muted">{c.points}</td>
                        <td className="px-4 py-3 text-right text-luma-muted text-xs">
                          {c.last_visit ? new Date(c.last_visit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight size={14} className="text-luma-muted inline" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-1/2 border-l border-luma-border flex flex-col">
            <div className="p-6 border-b border-luma-border flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white text-xl font-bold">
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-luma-black">{selected.name}</h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${tierConfig[selected.tier]?.bg} ${tierConfig[selected.tier]?.color}`}>
                    {tierConfig[selected.tier]?.icon}{selected.tier} Member
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/portal?owner=${userId}&client=${selected.id}`}
                  target="_blank"
                  className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted hover:text-luma-black transition-colors" title="Client portal">
                  <ExternalLink size={16} />
                </a>
                <button onClick={() => openEdit(selected)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted hover:text-luma-black transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteConfirm(true)} className="p-2 hover:bg-red-50 rounded-lg text-luma-muted hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-luma-border px-6">
              {(['overview', 'formulas'] as const).map(tab => (
                <button key={tab} onClick={() => setClientTab(tab)}
                  className={`px-4 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                    clientTab === tab ? 'border-gold text-gold' : 'border-transparent text-luma-muted hover:text-luma-black'
                  }`}>
                  {tab === 'formulas' ? `💊 Formulas (${formulas.length})` : '👤 Overview'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {clientTab === 'formulas' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-luma-black flex items-center gap-1.5"><FlaskConical size={14} className="text-gold" />Color Formulas</h3>
                    <button onClick={openAddFormula} className="btn btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
                      <Plus size={13} /> Add Formula
                    </button>
                  </div>
                  {formulas.length === 0 ? (
                    <div className="text-center py-10 text-luma-muted">
                      <FlaskConical size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No formulas saved yet</p>
                      <button onClick={openAddFormula} className="btn btn-primary mt-3 text-xs px-4 py-2">Add First Formula</button>
                    </div>
                  ) : (
                    formulas.map(f => (
                      <div key={f.id} className="bg-luma-surface rounded-xl border border-luma-border overflow-hidden">
                        <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedFormula(expandedFormula === f.id ? null : f.id)}>
                          <div>
                            <p className="font-semibold text-sm text-luma-black">{f.service_name}</p>
                            <p className="text-xs text-luma-muted">{f.applied_at ? new Date(f.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={e => { e.stopPropagation(); openEditFormula(f) }} className="p-1.5 rounded-lg hover:bg-luma-border text-luma-muted hover:text-luma-black transition-colors"><Edit2 size={13} /></button>
                            <button onClick={e => { e.stopPropagation(); deleteFormula(f.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-luma-muted hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                            {expandedFormula === f.id ? <ChevronUp size={14} className="text-luma-muted" /> : <ChevronDown size={14} className="text-luma-muted" />}
                          </div>
                        </div>
                        {expandedFormula === f.id && (
                          <div className="px-3 pb-3 border-t border-luma-border pt-3 space-y-2 text-xs">
                            <div className="bg-white rounded-lg p-2.5">
                              <p className="text-luma-muted font-medium mb-0.5">Formula</p>
                              <p className="text-luma-black font-mono">{f.formula}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {f.developer && <div className="bg-white rounded-lg p-2"><p className="text-luma-muted">Developer</p><p className="font-semibold text-luma-black">{f.developer}</p></div>}
                              {f.process_time && <div className="bg-white rounded-lg p-2"><p className="text-luma-muted">Process Time</p><p className="font-semibold text-luma-black">{f.process_time}</p></div>}
                            </div>
                            {f.products_used?.length > 0 && (
                              <div className="bg-white rounded-lg p-2.5">
                                <p className="text-luma-muted font-medium mb-1.5">Products Used</p>
                                <div className="space-y-1">
                                  {f.products_used.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between text-luma-black">
                                      <span>{p.product_name}</span>
                                      <span className="text-luma-muted">{p.amount} {p.unit}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {f.notes && <div className="bg-white rounded-lg p-2"><p className="text-luma-muted">Notes</p><p className="text-luma-black">{f.notes}</p></div>}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {clientTab === 'overview' && <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <DollarSign size={16} />, label: 'Total Spend', value: `$${selected.total_spend.toFixed(0)}` },
                  { icon: <Calendar size={16} />, label: 'Visits', value: selected.visits },
                  { icon: <Gift size={16} />, label: 'Points', value: selected.points },
                ].map((s, i) => (
                  <div key={i} className="bg-luma-surface rounded-xl p-4 text-center">
                    <div className="text-gold mx-auto mb-1 flex justify-center">{s.icon}</div>
                    <div className="text-xl font-bold text-luma-black">{s.value}</div>
                    <div className="text-xs text-luma-muted">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="bg-luma-surface rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm text-luma-black">Contact</h3>
                {selected.email && (
                  <div className="flex items-center gap-2 text-sm text-luma-muted">
                    <Mail size={14} className="text-gold" />{selected.email}
                  </div>
                )}
                {selected.phone && (
                  <div className="flex items-center gap-2 text-sm text-luma-muted">
                    <Phone size={14} className="text-gold" />{selected.phone}
                  </div>
                )}
                {selected.last_visit && (
                  <div className="flex items-center gap-2 text-sm text-luma-muted">
                    <Calendar size={14} className="text-gold" />
                    Last visit: {new Date(selected.last_visit).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
              </div>

              {/* Referrals */}
              <div className="bg-luma-surface rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-luma-black">Referrals</h3>
                  <span className="text-2xl font-bold text-gold">{selected.referrals}</span>
                </div>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="bg-luma-surface rounded-xl p-4">
                  <h3 className="font-semibold text-sm text-luma-black mb-2">Notes</h3>
                  <p className="text-sm text-luma-muted">{selected.notes}</p>
                </div>
              )}
              </>}
            </div>

            {/* Delete confirm */}
            {deleteConfirm && (
              <div className="p-4 border-t border-luma-border bg-red-50">
                <p className="text-sm font-medium text-red-700 mb-3">Delete {selected.name}? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={deleteClient} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Delete</button>
                  <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 bg-white border border-luma-border rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-luma-border sticky top-0 bg-white z-10">
              <h2 className="font-bold text-luma-black flex items-center gap-2"><FlaskConical size={16} className="text-gold" />{editFormula ? 'Edit Formula' : 'New Formula'}</h2>
              <button onClick={() => setShowFormulaModal(false)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {formulaError && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle size={14} />{formulaError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Service / Treatment *</label>
                  <input className="input" value={formulaForm.service_name} onChange={e => setFormulaForm(f => ({ ...f, service_name: e.target.value }))} placeholder="Root Color, Highlights..." />
                </div>
                <div>
                  <label className="label">Date Applied</label>
                  <input className="input" type="date" value={formulaForm.applied_at} onChange={e => setFormulaForm(f => ({ ...f, applied_at: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Formula *</label>
                <textarea className="input min-h-[80px] font-mono text-sm resize-none" value={formulaForm.formula} onChange={e => setFormulaForm(f => ({ ...f, formula: e.target.value }))} placeholder="e.g. 6N + 1oz 20vol + 10g Olaplex No.1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Developer</label>
                  <select className="input" value={formulaForm.developer} onChange={e => setFormulaForm(f => ({ ...f, developer: e.target.value }))}>
                    <option value="">Select...</option>
                    {['10 vol', '20 vol', '30 vol', '40 vol', 'N/A'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Processing Time</label>
                  <input className="input" value={formulaForm.process_time} onChange={e => setFormulaForm(f => ({ ...f, process_time: e.target.value }))} placeholder="e.g. 45 min" />
                </div>
              </div>

              {/* Products used — auto-deduct inventory */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Products Used <span className="text-xs font-normal text-luma-muted">(auto-deducts inventory on save)</span></label>
                  <button type="button" onClick={addProductRow} className="text-xs text-gold font-semibold flex items-center gap-1 hover:opacity-80"><Plus size={12} /> Add</button>
                </div>
                {formulaForm.products_used.length === 0 && (
                  <p className="text-xs text-luma-muted italic">No products added yet</p>
                )}
                {formulaForm.products_used.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center mb-2">
                    <select className="input flex-1 text-sm" value={p.product_id} onChange={e => updateProductRow(i, 'product_id', e.target.value)}>
                      <option value="">Select product...</option>
                      {products.map(pr => <option key={pr.id} value={pr.id}>{pr.name} {pr.brand ? `(${pr.brand})` : ''} — {pr.qty} in stock</option>)}
                    </select>
                    <input className="input w-16 text-sm" value={p.amount} onChange={e => updateProductRow(i, 'amount', e.target.value)} placeholder="Amt" />
                    <select className="input w-16 text-sm" value={p.unit} onChange={e => updateProductRow(i, 'unit', e.target.value)}>
                      {['oz', 'g', 'ml', 'tbsp', 'tsp'].map(u => <option key={u}>{u}</option>)}
                    </select>
                    <button onClick={() => removeProductRow(i)} className="text-luma-muted hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea className="input min-h-[60px] resize-none text-sm" value={formulaForm.notes} onChange={e => setFormulaForm(f => ({ ...f, notes: e.target.value }))} placeholder="Processing notes, results, client feedback..." />
              </div>
            </div>
            <div className="p-5 border-t border-luma-border flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowFormulaModal(false)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
              <button onClick={saveFormula} disabled={savingFormula} className="flex-1 btn btn-primary disabled:opacity-60 flex items-center justify-center gap-2">
                <Save size={14} />{savingFormula ? 'Saving...' : editFormula ? 'Save Changes' : 'Save & Deduct Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-luma-border">
              <h2 className="text-lg font-bold">{editMode ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={14} />{error}
                </div>
              )}
              <div>
                <label className="label">Full Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jane Smith" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(555) 000-0000" />
                </div>
              </div>
              <div>
                <label className="label">Birthday (optional) 🎂</label>
                <input className="input" type="date" value={(form as any).birthday || ''} onChange={e => setForm({...form, birthday: e.target.value} as any)} />
                <p className="text-xs text-luma-muted mt-1">Used for birthday alerts on dashboard</p>
              </div>
              {editMode && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Total Spend ($)</label>
                    <input className="input" type="number" value={form.total_spend} onChange={e => setForm({...form, total_spend: parseFloat(e.target.value)||0})} />
                  </div>
                  <div>
                    <label className="label">Visits</label>
                    <input className="input" type="number" value={form.visits} onChange={e => setForm({...form, visits: parseInt(e.target.value)||0})} />
                  </div>
                  <div>
                    <label className="label">Points</label>
                    <input className="input" type="number" value={form.points} onChange={e => setForm({...form, points: parseInt(e.target.value)||0})} />
                  </div>
                </div>
              )}
              <div>
                <label className="label">Notes</label>
                <textarea className="input min-h-[80px] resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Allergies, preferences, etc." />
              </div>
            </div>
            <div className="p-6 border-t border-luma-border flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 btn bg-luma-surface text-luma-black hover:bg-luma-border">Cancel</button>
              <button onClick={saveClient} disabled={saving} className="flex-1 btn btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
