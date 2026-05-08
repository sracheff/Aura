'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase, Client, Service } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import {
  ShoppingCart, Plus, Minus, Trash2, Search,
  CreditCard, Banknote, Smartphone, CheckCircle, X,
  Tag, Percent, User
} from 'lucide-react'

type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  type: 'service' | 'product'
}

type Product = {
  id: string
  name: string
  brand: string
  type: string
  qty: number
  price: number
}

const PAYMENT_METHODS = [
  { id: 'card',  label: 'Card',  icon: <CreditCard size={16} /> },
  { id: 'cash',  label: 'Cash',  icon: <Banknote size={16} /> },
  { id: 'venmo', label: 'Venmo', icon: <Smartphone size={16} /> },
  { id: 'zelle', label: 'Zelle', icon: <Smartphone size={16} /> },
]

export default function POSPage() {
  const { userId, loading } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [discountPct, setDiscountPct] = useState(0)
  const [taxPct, setTaxPct] = useState(8.5)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [itemSearch, setItemSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services')
  const [success, setSuccess] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<{ total: number; client: string } | null>(null)

  useEffect(() => {
    if (userId) {
      fetchServices()
      fetchProducts()
      fetchClients()
    }
  }, [userId])

  async function fetchServices() {
    const { data } = await supabase.from('services').select('*').eq('owner_id', userId).eq('active', true).order('name')
    if (data) setServices(data)
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('owner_id', userId).order('name')
    if (data) setProducts(data)
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*').eq('owner_id', userId).order('name')
    if (data) setClients(data)
  }

  function addToCart(item: { id: string; name: string; price: number }, type: 'service' | 'product') {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id && c.type === type)
      if (existing) return prev.map(c => c.id === item.id && c.type === type ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, type }]
    })
  }

  function removeFromCart(id: string, type: string) {
    setCart(prev => prev.filter(c => !(c.id === id && c.type === type)))
  }

  function updateQty(id: string, type: string, delta: number) {
    setCart(prev => prev.map(c => {
      if (c.id === id && c.type === type) {
        const newQty = c.qty + delta
        if (newQty <= 0) return null as unknown as CartItem
        return { ...c, qty: newQty }
      }
      return c
    }).filter(Boolean))
  }

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  const discountAmt = subtotal * (discountPct / 100)
  const afterDiscount = subtotal - discountAmt
  const taxAmt = afterDiscount * (taxPct / 100)
  const total = afterDiscount + taxAmt
  const loyaltyPoints = Math.floor(total)

  async function processPayment() {
    if (cart.length === 0) return
    setProcessing(true)

    // Insert transaction
    const { data: tx, error: txErr } = await supabase.from('transactions').insert({
      owner_id: userId,
      client_id: selectedClient?.id || null,
      subtotal,
      discount_pct: discountPct,
      discount_amt: discountAmt,
      tax: taxAmt,
      total,
      payment_method: paymentMethod,
    }).select().single()

    if (txErr || !tx) { setProcessing(false); return }

    // Insert line items
    await supabase.from('transaction_items').insert(
      cart.map(c => ({ transaction_id: tx.id, name: c.name, price: c.price, qty: c.qty, type: c.type }))
    )

    // Update client stats
    if (selectedClient) {
      await supabase.from('clients').update({
        total_spend: selectedClient.total_spend + total,
        visits: selectedClient.visits + 1,
        points: selectedClient.points + loyaltyPoints,
        last_visit: new Date().toISOString().split('T')[0],
      }).eq('id', selectedClient.id)
    }

    // Deduct product inventory
    for (const item of cart.filter(c => c.type === 'product')) {
      const product = products.find(p => p.id === item.id)
      if (product) {
        await supabase.from('products').update({ qty: Math.max(0, product.qty - item.qty) }).eq('id', item.id)
      }
    }

    setLastReceipt({ total, client: selectedClient?.name || 'Walk-in' })
    setSuccess(true)
    setCart([])
    setSelectedClient(null)
    setDiscountPct(0)
    setClientSearch('')
    setProcessing(false)
    fetchClients()
    fetchProducts()
  }

  const filteredItems = activeTab === 'services'
    ? services.filter(s => s.name.toLowerCase().includes(itemSearch.toLowerCase()))
    : products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()))

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone || '').includes(clientSearch)
  ).slice(0, 6)

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Point of Sale" />

      <div className="flex-1 flex min-h-0">
        {/* Left: Item catalog */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-luma-border">
          {/* Client selector */}
          <div className="px-5 pt-4 pb-3 border-b border-luma-border">
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
              <input
                className="input pl-9 py-2 text-sm"
                placeholder="Search client (optional)..."
                value={selectedClient ? selectedClient.name : clientSearch}
                onChange={e => { setClientSearch(e.target.value); setSelectedClient(null); setShowClientSearch(true) }}
                onFocus={() => setShowClientSearch(true)}
                onBlur={() => setTimeout(() => setShowClientSearch(false), 150)}
              />
              {selectedClient && (
                <button onClick={() => { setSelectedClient(null); setClientSearch('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-luma-muted hover:text-luma-black">
                  <X size={14} />
                </button>
              )}
              {showClientSearch && clientSearch && !selectedClient && filteredClients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-luma-border rounded-xl shadow-lg z-20 overflow-hidden">
                  {filteredClients.map(c => (
                    <button key={c.id} onMouseDown={() => { setSelectedClient(c); setClientSearch(''); setShowClientSearch(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-luma-surface text-left">
                      <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-luma-black">{c.name}</div>
                        <div className="text-xs text-luma-muted">{c.tier} · {c.points} pts</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedClient && (
              <div className="mt-2 px-3 py-2 bg-gold/10 rounded-xl flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-semibold text-luma-black">{selectedClient.name}</span>
                  <span className="text-luma-muted ml-2">{selectedClient.tier} · {selectedClient.points} pts</span>
                </div>
                <span className="text-xs text-gold font-semibold">+{loyaltyPoints} pts today</span>
              </div>
            )}
          </div>

          {/* Tabs + search */}
          <div className="px-5 py-3 border-b border-luma-border flex items-center gap-3">
            <div className="flex gap-1 bg-luma-surface rounded-xl p-1">
              {(['services', 'products'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${activeTab === t ? 'bg-white text-luma-black shadow-sm' : 'text-luma-muted'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-luma-muted" />
              <input className="input pl-8 py-1.5 text-sm" placeholder="Search..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
            </div>
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item, activeTab === 'services' ? 'service' : 'product')}
                  className="bg-white border border-luma-border rounded-xl p-4 text-left hover:border-gold hover:shadow-md transition-all group"
                >
                  <div className="text-sm font-semibold text-luma-black group-hover:text-gold transition-colors leading-tight mb-1">{item.name}</div>
                  {'brand' in item && item.brand && <div className="text-xs text-luma-muted mb-2">{(item as Product).brand}</div>}
                  {'duration' in item && <div className="text-xs text-luma-muted mb-2">{(item as Service).duration} min</div>}
                  <div className="text-base font-bold text-gold">${item.price.toFixed(0)}</div>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-4 text-center py-12 text-luma-muted text-sm">
                  No {activeTab} found. Add them in {activeTab === 'services' ? 'Settings → Services' : 'Inventory'}.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart + checkout */}
        <div className="w-80 flex flex-col bg-luma-surface border-l border-luma-border">
          <div className="p-5 border-b border-luma-border">
            <h2 className="font-bold text-luma-black flex items-center gap-2">
              <ShoppingCart size={18} className="text-gold" /> Cart
              {cart.length > 0 && <span className="ml-auto text-xs bg-gold text-white rounded-full w-5 h-5 flex items-center justify-center">{cart.reduce((s, c) => s + c.qty, 0)}</span>}
            </h2>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-luma-muted text-sm text-center">
                <ShoppingCart size={30} className="mb-2 opacity-30" />
                <p>Cart is empty</p>
                <p className="text-xs mt-1">Select services or products</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={`${item.id}-${item.type}`} className="bg-white rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-luma-black truncate">{item.name}</div>
                    <div className="text-xs text-luma-muted capitalize">{item.type}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, item.type, -1)} className="w-6 h-6 rounded-full bg-luma-surface flex items-center justify-center hover:bg-luma-border">
                      <Minus size={10} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.type, 1)} className="w-6 h-6 rounded-full bg-luma-surface flex items-center justify-center hover:bg-luma-border">
                      <Plus size={10} />
                    </button>
                  </div>
                  <div className="text-sm font-bold text-luma-black w-12 text-right">${(item.price * item.qty).toFixed(0)}</div>
                  <button onClick={() => removeFromCart(item.id, item.type)} className="text-luma-muted hover:text-red-500 ml-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals + checkout */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-luma-border space-y-3">
              {/* Discount */}
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-luma-muted" />
                <span className="text-sm text-luma-muted flex-1">Discount</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15, 20].map(p => (
                    <button key={p} onClick={() => setDiscountPct(p)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${discountPct === p ? 'bg-gold text-white' : 'bg-white border border-luma-border text-luma-muted'}`}>
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Tax */}
              <div className="flex items-center gap-2">
                <Percent size={14} className="text-luma-muted" />
                <span className="text-sm text-luma-muted flex-1">Tax</span>
                <input
                  type="number"
                  className="w-16 px-2 py-0.5 border border-luma-border rounded-lg text-sm text-right"
                  value={taxPct}
                  onChange={e => setTaxPct(parseFloat(e.target.value) || 0)}
                />
                <span className="text-sm text-luma-muted">%</span>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-luma-muted"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {discountPct > 0 && <div className="flex justify-between text-green-600"><span>Discount ({discountPct}%)</span><span>-${discountAmt.toFixed(2)}</span></div>}
                <div className="flex justify-between text-luma-muted"><span>Tax ({taxPct}%)</span><span>${taxAmt.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-luma-black text-base pt-1 border-t border-luma-border">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-colors text-xs font-medium ${paymentMethod === m.id ? 'border-gold bg-gold/10 text-gold' : 'border-luma-border bg-white text-luma-muted'}`}>
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>

              <button
                onClick={processPayment}
                disabled={processing}
                className="w-full py-3 bg-luma-black text-white rounded-xl font-bold text-base hover:bg-gold transition-colors disabled:opacity-60"
              >
                {processing ? 'Processing...' : `Charge $${total.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success modal */}
      {success && lastReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-luma-black mb-1">Payment Complete!</h2>
            <p className="text-3xl font-bold text-gold mb-2">${lastReceipt.total.toFixed(2)}</p>
            <p className="text-luma-muted text-sm mb-1">{lastReceipt.client}</p>
            {selectedClient && <p className="text-xs text-green-600 font-medium mb-4">+{loyaltyPoints} loyalty points earned</p>}
            <button onClick={() => setSuccess(false)} className="btn btn-primary w-full py-3">New Sale</button>
          </div>
        </div>
      )}
    </div>
  )
}
