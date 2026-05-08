'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase, Product } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import { Package, Plus, Edit2, Trash2, X, AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

const PRODUCT_TYPES = ['retail', 'backbar', 'supply']

const emptyForm = {
  name: '', brand: '', type: 'retail',
  qty: 0, reorder_at: 5, cost: 0, price: 0, low_stock_threshold: 0
}

function calcMargin(cost: number, price: number) {
  if (!price || !cost) return 0
  return Math.round(((price - cost) / price) * 100)
}

export default function InventoryPage() {
  const { userId, loading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'name' | 'qty' | 'price'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  useEffect(() => {
    if (userId) fetchProducts()
  }, [userId])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('owner_id', userId).order('name')
    if (data) setProducts(data)
  }

  function openAdd() {
    setForm(emptyForm)
    setEditTarget(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, brand: p.brand || '', type: p.type, qty: p.qty, reorder_at: p.reorder_at, cost: p.cost, price: p.price, low_stock_threshold: p.low_stock_threshold || 0 })
    setEditTarget(p)
    setError('')
    setShowModal(true)
  }

  async function saveProduct() {
    if (!form.name.trim()) { setError('Product name is required'); return }
    setSaving(true)
    setError('')
    const payload = { ...form, margin: calcMargin(form.cost, form.price), owner_id: userId }
    if (editTarget) {
      const { error: err } = await supabase.from('products').update(payload).eq('id', editTarget.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('products').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setShowModal(false)
    fetchProducts()
  }

  async function adjustQty(p: Product, delta: number) {
    const newQty = Math.max(0, p.qty + delta)
    await supabase.from('products').update({ qty: newQty }).eq('id', p.id)
    setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, qty: newQty } : pr))
  }

  async function deleteProduct() {
    if (!deleteTarget) return
    await supabase.from('products').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    fetchProducts()
  }

  const lowStock = products.filter(p => p.qty <= p.reorder_at && p.qty >= 0)

  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'All' || p.type === typeFilter
      return matchSearch && matchType
    })
    .sort((a, b) => {
      let va: string | number = a[sortBy]
      let vb: string | number = b[sortBy]
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => sortBy === col
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : <ChevronDown size={12} className="opacity-30" />

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Inventory" action={{ label: 'Add Product', onClick: openAdd }} />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2 text-sm">
            <AlertTriangle size={16} className="text-orange-500 shrink-0" />
            <span className="font-medium text-orange-700">{lowStock.length} item{lowStock.length > 1 ? 's' : ''} low on stock:</span>
            <span className="text-orange-600">{lowStock.map(p => p.name).join(', ')}</span>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-luma-border">
          <input
            className="input py-2 text-sm max-w-xs"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-1">
            {['All', ...PRODUCT_TYPES].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${typeFilter === t ? 'bg-luma-black text-white' : 'bg-luma-surface text-luma-muted hover:text-luma-black'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="ml-auto text-sm text-luma-muted">{products.length} products · ${products.reduce((s, p) => s + p.cost * p.qty, 0).toFixed(0)} inventory value</div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-luma-muted">
              <Package size={40} className="mb-3 opacity-30" />
              <p className="font-medium">No products yet</p>
              <p className="text-sm mt-1">Add retail, backbar, or supply items</p>
              <button onClick={openAdd} className="btn btn-primary mt-4">Add Product</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b border-luma-border">
                <tr>
                  <th className="text-left px-6 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1">Name <SortIcon col="name" /></button>
                  </th>
                  <th className="text-left px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">Brand</th>
                  <th className="text-left px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">Type</th>
                  <th className="text-center px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">
                    <button onClick={() => toggleSort('qty')} className="flex items-center gap-1">Stock <SortIcon col="qty" /></button>
                  </th>
                  <th className="text-right px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">Cost</th>
                  <th className="text-right px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">
                    <button onClick={() => toggleSort('price')} className="flex items-center gap-1 ml-auto">Price <SortIcon col="price" /></button>
                  </th>
                  <th className="text-right px-4 py-3 text-luma-muted font-medium text-xs uppercase tracking-wider">Margin</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-luma-border">
                {filtered.map(p => {
                  const isLow = p.qty <= p.reorder_at
                  return (
                    <tr key={p.id} className="hover:bg-luma-surface transition-colors">
                      <td className="px-6 py-3 font-medium text-luma-black">{p.name}</td>
                      <td className="px-4 py-3 text-luma-muted">{p.brand || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-luma-surface text-luma-muted rounded-full text-xs capitalize">{p.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => adjustQty(p, -1)} className="w-6 h-6 rounded-full hover:bg-luma-border flex items-center justify-center">
                            <span className="text-base leading-none">−</span>
                          </button>
                          <span className={`font-semibold min-w-[2rem] text-center ${isLow ? 'text-orange-600' : 'text-luma-black'}`}>
                            {p.qty}
                            {isLow && <AlertTriangle size={10} className="inline ml-1 text-orange-500" />}
                          </span>
                          <button onClick={() => adjustQty(p, 1)} className="w-6 h-6 rounded-full hover:bg-luma-border flex items-center justify-center">
                            <span className="text-base leading-none">+</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-luma-muted">${p.cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-luma-black">${p.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${p.margin >= 50 ? 'text-green-600' : p.margin >= 30 ? 'text-gold' : 'text-red-500'}`}>
                          {p.margin}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-luma-border rounded-lg text-luma-muted hover:text-luma-black">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(p)} className="p-1.5 hover:bg-red-50 rounded-lg text-luma-muted hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Delete {deleteTarget.name}?</h3>
            <p className="text-luma-muted text-sm mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
              <button onClick={deleteProduct} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-luma-border">
              <h2 className="text-lg font-bold">{editTarget ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle size={14} />{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Product Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Olaplex No.3" />
                </div>
                <div>
                  <label className="label">Brand</label>
                  <input className="input" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="Olaplex" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {PRODUCT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Current Qty</label>
                  <input className="input" type="number" min="0" value={form.qty} onChange={e => setForm({...form, qty: parseInt(e.target.value)||0})} />
                </div>
                <div>
                  <label className="label">Low Stock Alert</label>
                  <input className="input" type="number" min="0" value={form.low_stock_threshold} onChange={e => setForm({...form, low_stock_threshold: parseInt(e.target.value)||0})} placeholder="0 = off" />
                  <p className="text-xs text-luma-muted mt-1">Alert on dashboard when qty ≤ this</p>
                </div>
                <div>
                  <label className="label">Reorder At</label>
                  <input className="input" type="number" min="0" value={form.reorder_at} onChange={e => setForm({...form, reorder_at: parseInt(e.target.value)||0})} />
                </div>
                <div>
                  <label className="label">Cost ($)</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm({...form, cost: parseFloat(e.target.value)||0})} />
                </div>
                <div>
                  <label className="label">Retail Price ($)</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)||0})} />
                </div>
              </div>
              {form.cost > 0 && form.price > 0 && (
                <div className="p-3 bg-luma-surface rounded-xl text-sm">
                  Margin: <span className="font-bold text-gold">{calcMargin(form.cost, form.price)}%</span>
                  <span className="text-luma-muted ml-2">(${(form.price - form.cost).toFixed(2)} profit per unit)</span>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-luma-border flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
              <button onClick={saveProduct} disabled={saving} className="flex-1 btn btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
