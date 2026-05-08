'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { SERVICES, PRODUCTS, CLIENTS } from '@/lib/data'
import { clsx } from 'clsx'
import { Plus, Minus, Trash2, CreditCard, Smartphone, Banknote, Tag, ChevronDown } from 'lucide-react'

type CartItem = { id: string; name: string; price: number; qty: number; type: 'service' | 'product' }

export default function POSPage() {
  const [tab, setTab] = useState<'services' | 'products'>('services')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [selectedClient, setSelectedClient] = useState<string>('')

  const addItem = (id: string, name: string, price: number, type: 'service' | 'product') => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id)
      if (existing) return prev.map((i) => i.id === id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id, name, price, qty: 1, type }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter((i) => i.qty > 0))
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discountAmt = subtotal * (discount / 100)
  const tax = (subtotal - discountAmt) * 0.08
  const total = subtotal - discountAmt + tax

  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Point of Sale" subtitle="Quick checkout" />
      <div className="flex flex-1 min-h-0">
        {/* Items panel */}
        <div className="flex-1 overflow-auto p-6">
          {/* Client selector */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="select w-full"
              >
                <option value="">Walk-in / Select client</option>
                {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {selectedClient && (
              <div className="flex items-center gap-2 bg-gold/10 border border-gold/20 px-3 py-2 rounded-lg text-sm">
                <span className="text-gold text-xs font-semibold">
                  {CLIENTS.find((c) => c.id === selectedClient)?.points} pts
                </span>
                <span className="text-luma-muted text-xs">available</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-luma-bg border border-luma-border rounded-xl p-1 mb-4 w-fit">
            {(['services', 'products'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', tab === t ? 'bg-white shadow-sm text-luma-black' : 'text-luma-muted hover:text-luma-black')}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Services grid */}
          {tab === 'services' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => addItem(s.id, s.name, s.price, 'service')}
                  className="bg-white border border-luma-border rounded-xl p-4 text-left hover:border-gold/40 hover:shadow-md transition-all group"
                >
                  <p className="text-sm font-semibold text-luma-black group-hover:text-gold transition-colors">{s.name}</p>
                  <p className="text-xs text-luma-muted mt-1">{s.duration} min</p>
                  <p className="text-lg font-bold text-luma-black mt-2">${s.price}</p>
                </button>
              ))}
            </div>
          )}

          {/* Products grid */}
          {tab === 'products' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {PRODUCTS.filter((p) => p.type === 'retail').map((p) => (
                <button
                  key={p.id}
                  onClick={() => addItem(p.id, p.name, p.price, 'product')}
                  className="bg-white border border-luma-border rounded-xl p-4 text-left hover:border-gold/40 hover:shadow-md transition-all group"
                >
                  <p className="text-sm font-semibold text-luma-black group-hover:text-gold transition-colors">{p.name}</p>
                  <p className="text-xs text-luma-muted mt-1">{p.brand}</p>
                  <p className="text-lg font-bold text-luma-black mt-2">${p.price}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart / Checkout */}
        <div className="w-80 shrink-0 border-l border-luma-border bg-white flex flex-col">
          <div className="p-4 border-b border-luma-border">
            <h3 className="font-semibold text-luma-black">Order Summary</h3>
            <p className="text-xs text-luma-muted">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-luma-muted text-sm">
                <ShoppingCartIcon />
                <p className="mt-2">Add services or products</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-3 bg-luma-bg rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-luma-black truncate">{item.name}</p>
                    <p className="text-xs text-luma-muted">${item.price} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-luma-border flex items-center justify-center hover:border-gold/40 transition-colors">
                      <Minus size={10} />
                    </button>
                    <span className="w-5 text-center text-xs font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-white border border-luma-border flex items-center justify-center hover:border-gold/40 transition-colors">
                      <Plus size={10} />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-luma-black w-12 text-right">${(item.price * item.qty).toFixed(0)}</span>
                  <button onClick={() => updateQty(item.id, -item.qty)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Discount */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 p-3 bg-luma-bg rounded-xl">
              <Tag size={13} className="text-luma-muted" />
              <span className="text-xs text-luma-muted flex-1">Discount</span>
              <div className="flex gap-1">
                {[0, 10, 15, 20].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscount(d)}
                    className={clsx('px-2 py-0.5 rounded text-xs font-medium transition-all', discount === d ? 'bg-gold text-luma-black' : 'bg-white border border-luma-border text-luma-muted hover:border-gold/40')}
                  >
                    {d === 0 ? 'None' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="px-4 py-3 border-t border-luma-border space-y-1.5 text-sm">
            <div className="flex justify-between text-luma-muted">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({discount}%)</span>
                <span>-${discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-luma-muted">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-luma-black text-base border-t border-luma-border pt-2 mt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-luma-muted mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Card', icon: CreditCard },
                { label: 'Apple Pay', icon: Smartphone },
                { label: 'Cash', icon: Banknote },
              ].map(({ label, icon: Icon }) => (
                <button key={label} className="flex flex-col items-center gap-1 p-3 bg-luma-bg border border-luma-border rounded-xl hover:border-gold/40 hover:bg-gold/5 transition-all text-xs font-medium text-luma-mid">
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
            <button
              className={clsx('btn btn-primary w-full mt-2', cart.length === 0 && 'opacity-50 cursor-not-allowed')}
              disabled={cart.length === 0}
            >
              Charge ${total.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShoppingCartIcon() {
  return (
    <svg className="w-10 h-10 mx-auto text-luma-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L6 5H3m4 8a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  )
}
