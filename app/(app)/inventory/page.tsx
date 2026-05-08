'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { PRODUCTS } from '@/lib/data'
import { clsx } from 'clsx'
import { Package, AlertTriangle, TrendingUp, DollarSign, Search, Filter } from 'lucide-react'

export default function InventoryPage() {
  const [tab, setTab] = useState<'all' | 'retail' | 'backbar'>('all')
  const [search, setSearch] = useState('')

  const filtered = PRODUCTS.filter((p) => {
    const matchTab = tab === 'all' || p.type === tab
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const lowStock = PRODUCTS.filter((p) => p.qty <= p.reorder)
  const totalRetailValue = PRODUCTS.filter((p) => p.type === 'retail').reduce((s, p) => s + p.price * p.qty, 0)
  const totalBackbarCost = PRODUCTS.filter((p) => p.type === 'backbar').reduce((s, p) => s + p.cost * p.qty, 0)

  return (
    <div>
      <Topbar title="Inventory" subtitle="Product stock & reorder management" action={{ label: 'Add Product' }} />
      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Products', val: PRODUCTS.length.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Low Stock Alerts', val: lowStock.length.toString(), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Retail Value', val: `$${totalRetailValue.toFixed(0)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Backbar Cost', val: `$${totalBackbarCost.toFixed(0)}`, icon: TrendingUp, color: 'text-gold', bg: 'bg-gold/10' },
          ].map(({ label, val, icon: Icon, color, bg }) => (
            <div key={label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="kpi-label">{label}</p>
                  <p className="kpi-value">{val}</p>
                </div>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                  <Icon size={18} className={color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Low Stock Alert</p>
              <p className="text-xs text-red-600 mt-0.5">
                {lowStock.map((p) => p.name).join(', ')} {lowStock.length === 1 ? 'is' : 'are'} below reorder level.
              </p>
            </div>
            <button className="btn btn-sm text-xs ml-auto shrink-0 bg-red-100 text-red-700 border-red-200 hover:bg-red-200">Reorder All</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input pl-9 w-full" />
          </div>
          <div className="flex gap-1 bg-luma-bg border border-luma-border rounded-xl p-1">
            {(['all', 'retail', 'backbar'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', tab === t ? 'bg-white shadow-sm text-luma-black' : 'text-luma-muted hover:text-luma-black')}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-luma-border bg-luma-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold text-luma-muted">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-luma-muted">Brand</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-luma-muted">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-luma-muted">In Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-luma-muted">Reorder At</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-luma-muted">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-luma-muted">Retail</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-luma-muted">Margin</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-luma-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const lowStockFlag = p.qty <= p.reorder
                return (
                  <tr key={p.id} className="border-b border-luma-border/50 last:border-b-0 hover:bg-luma-bg/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-luma-black">{p.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-luma-mid">{p.brand}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('tag text-xs capitalize', p.type === 'retail' ? 'tag-blue' : 'tag-gold')}>{p.type}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={clsx('text-sm font-semibold', lowStockFlag ? 'text-red-500' : 'text-luma-black')}>{p.qty}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-luma-muted">{p.reorder}</td>
                    <td className="px-4 py-3 text-right text-sm text-luma-mid">${p.cost}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-luma-black">${p.price}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={clsx('text-sm font-medium', p.margin >= 60 ? 'text-green-600' : p.margin >= 40 ? 'text-gold' : 'text-red-500')}>
                        {p.margin}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {lowStockFlag ? (
                        <button className="btn btn-sm text-xs bg-red-50 text-red-600 border-red-200 hover:bg-red-100">Reorder</button>
                      ) : (
                        <span className="tag tag-green text-xs">In Stock</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
