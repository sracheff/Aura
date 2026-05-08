'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase, Client } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import {
  Users, Plus, Search, Star, ChevronRight,
  Mail, Phone, Calendar, DollarSign, Gift,
  X, Edit2, Trash2, AlertCircle, Crown, Award, Gem
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
  name: '', email: '', phone: '', notes: '',
  tier: 'Bronze', points: 0, total_spend: 0, visits: 0, referrals: 0
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

  useEffect(() => {
    if (userId) fetchClients()
  }, [userId])

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('owner_id', userId)
      .order('name')
    if (data) setClients(data)
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
      notes: c.notes || '', tier: c.tier, points: c.points,
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

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
