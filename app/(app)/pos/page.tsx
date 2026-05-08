'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase, Client, Service } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import {
  ShoppingCart, Plus, Minus, Trash2, Search,
  CreditCard, Banknote, Smartphone, CheckCircle, X,
  Tag, Percent, User, Split, Gift, CalendarDays, RotateCcw, AlertCircle,
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
  { id: 'card',       label: 'Card',       icon: <CreditCard size={16} /> },
  { id: 'cash',       label: 'Cash',       icon: <Banknote size={16} /> },
  { id: 'venmo',      label: 'Venmo',      icon: <Smartphone size={16} /> },
  { id: 'zelle',      label: 'Zelle',      icon: <Smartphone size={16} /> },
  { id: 'split',      label: 'Split',      icon: <Split size={16} /> },
  { id: 'gift_card',  label: 'Gift Card',  icon: <Gift size={16} /> },
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
  const [discountMode, setDiscountMode] = useState<'pct' | 'dollar'>('pct')
  const [customDiscount, setCustomDiscount] = useState('')
  const [useCustomDiscount, setUseCustomDiscount] = useState(false)
  const [tipPreset, setTipPreset] = useState(0)       // 0 = no tip, 15/18/20/25 = preset %
  const [customTip, setCustomTip] = useState('')
  const [useCustomTip, setUseCustomTip] = useState(false)
  const [taxPct, setTaxPct] = useState(8.5)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [itemSearch, setItemSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services')
  const [success, setSuccess] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<{ total: number; tip: number; client: string } | null>(null)
  // Split payment
  const [splitCash, setSplitCash] = useState('')
  const [splitCard, setSplitCard] = useState('')
  // Gift card in POS
  const [gcCode, setGcCode] = useState('')
  const [gcData, setGcData] = useState<{ id: string; code: string; balance: number } | null>(null)
  const [gcLookupMsg, setGcLookupMsg] = useState('')
  // End of day
  const [showEOD, setShowEOD] = useState(false)
  const [eodData, setEodData] = useState<{ cash: number; card: number; other: number; tips: number; count: number; total: number } | null>(null)
  // Transaction history + refunds
  const [recentTx, setRecentTx] = useState<{ id: string; total: number; client_id: string | null; payment_method: string; created_at: string; refunded_at: string | null }[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchServices()
      fetchProducts()
      fetchClients()
      fetchRecentTx()
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

  async function fetchRecentTx() {
    const today = new Date(); today.setHours(0,0,0,0)
    const { data } = await supabase
      .from('transactions')
      .select('id,total,client_id,payment_method,tip_amount,created_at,refunded_at')
      .eq('owner_id', userId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
    setRecentTx(data || [])
  }

  async function lookupGiftCard() {
    if (!gcCode.trim()) return
    const { data } = await supabase
      .from('gift_cards')
      .select('id,code,balance,status')
      .eq('owner_id', userId)
      .ilike('code', gcCode.trim())
      .single()
    if (!data || data.status !== 'active') {
      setGcData(null); setGcLookupMsg('Card not found or inactive.')
    } else if (data.balance <= 0) {
      setGcData(null); setGcLookupMsg('Card has no remaining balance.')
    } else {
      setGcData({ id: data.id, code: data.code, balance: data.balance })
      setGcLookupMsg('')
    }
  }

  async function openEOD() {
    const today = new Date(); today.setHours(0,0,0,0)
    const { data } = await supabase
      .from('transactions')
      .select('total,payment_method,tip_amount,refunded_at,refund_amount')
      .eq('owner_id', userId)
      .gte('created_at', today.toISOString())
    if (!data) return
    const active = data.filter((t: any) => !t.refunded_at)
    const eod = {
      cash:  active.filter((t: any) => t.payment_method === 'cash').reduce((s: number, t: any) => s + t.total, 0),
      card:  active.filter((t: any) => t.payment_method === 'card').reduce((s: number, t: any) => s + t.total, 0),
      other: active.filter((t: any) => !['cash','card'].includes(t.payment_method)).reduce((s: number, t: any) => s + t.total, 0),
      tips:  active.reduce((s: number, t: any) => s + (t.tip_amount || 0), 0),
      count: active.length,
      total: active.reduce((s: number, t: any) => s + t.total, 0),
    }
    setEodData(eod)
    setShowEOD(true)
  }

  async function issueRefund(txId: string) {
    if (!confirm('Refund this transaction?')) return
    await supabase.from('transactions').update({ refunded_at: new Date().toISOString() }).eq('id', txId)
    fetchRecentTx()
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
  const discountAmt = useCustomDiscount
    ? (discountMode === 'pct' ? subtotal * ((parseFloat(customDiscount) || 0) / 100) : Math.min(parseFloat(customDiscount) || 0, subtotal))
    : subtotal * (discountPct / 100)
  const afterDiscount = subtotal - discountAmt
  const taxAmt = afterDiscount * (taxPct / 100)
  const tipAmt = useCustomTip
    ? (parseFloat(customTip) || 0)
    : afterDiscount * (tipPreset / 100)
  const total = afterDiscount + taxAmt + tipAmt
  const loyaltyPoints = Math.floor(afterDiscount + taxAmt) // points on pre-tip amount

  async function processPayment() {
    if (cart.length === 0) return
    setProcessing(true)

    // Insert transaction
    const gcApplied = paymentMethod === 'gift_card' && gcData ? Math.min(gcData.balance, total) : 0
    const { data: tx, error: txErr } = await supabase.from('transactions').insert({
      owner_id: userId,
      client_id: selectedClient?.id || null,
      subtotal,
      discount_pct: useCustomDiscount ? (discountMode === 'pct' ? parseFloat(customDiscount) || 0 : 0) : discountPct,
      discount_amt: discountAmt,
      tax: taxAmt,
      tip_amount: tipAmt,
      total,
      payment_method: paymentMethod,
      payment_method_2: paymentMethod === 'split' ? 'card' : null,
      amount_2: paymentMethod === 'split' ? parseFloat(splitCard) || 0 : null,
      gift_card_id: gcData?.id || null,
      gift_card_amount: gcApplied,
    }).select().single()

    if (txErr || !tx) { setProcessing(false); return }

    // Deduct gift card balance
    if (paymentMethod === 'gift_card' && gcData && gcApplied > 0) {
      const newBalance = gcData.balance - gcApplied
      await supabase.from('gift_cards').update({
        balance: newBalance,
        status: newBalance <= 0 ? 'redeemed' : 'active',
      }).eq('id', gcData.id)
      await supabase.from('gift_card_transactions').insert({
        owner_id: userId, gift_card_id: gcData.id,
        amount: -gcApplied, transaction_id: tx.id, note: 'Redeemed at POS',
      })
    }

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

    setLastReceipt({ total, tip: tipAmt, client: selectedClient?.name || 'Walk-in' })
    setSuccess(true)
    setCart([])
    setSelectedClient(null)
    setDiscountPct(0)
    setCustomDiscount('')
    setUseCustomDiscount(false)
    setTipPreset(0)
    setCustomTip('')
    setUseCustomTip(false)
    setClientSearch('')
    setGcCode('')
    setGcData(null)
    setSplitCash('')
    setSplitCard('')
    setProcessing(false)
    fetchClients()
    fetchProducts()
    fetchRecentTx()
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
      {/* EOD + History buttons */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-luma-border bg-white">
        <button onClick={openEOD}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-luma-border rounded-xl text-xs font-semibold hover:bg-luma-surface">
          <CalendarDays size={13} />End of Day
        </button>
        <button onClick={() => { fetchRecentTx(); setShowHistory(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-luma-border rounded-xl text-xs font-semibold hover:bg-luma-surface">
          <RotateCcw size={13} />Today's Sales
        </button>
      </div>

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
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-luma-muted shrink-0" />
                  <span className="text-sm text-luma-muted flex-1">Discount</span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {[5, 10, 15, 20].map(p => (
                      <button key={p} onClick={() => { setDiscountPct(p); setUseCustomDiscount(false) }}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${!useCustomDiscount && discountPct === p ? 'bg-gold text-white' : 'bg-white border border-luma-border text-luma-muted hover:border-gold/40'}`}>
                        {p}%
                      </button>
                    ))}
                    <button onClick={() => { setUseCustomDiscount(true); setDiscountPct(0) }}
                      className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${useCustomDiscount ? 'bg-luma-black text-white' : 'bg-white border border-luma-border text-luma-muted hover:border-gold/40'}`}>
                      Custom
                    </button>
                    {(discountPct > 0 || useCustomDiscount) && (
                      <button onClick={() => { setDiscountPct(0); setCustomDiscount(''); setUseCustomDiscount(false) }}
                        className="text-luma-muted hover:text-red-500 ml-0.5"><X size={12} /></button>
                    )}
                  </div>
                </div>
                {useCustomDiscount && (
                  <div className="flex items-center gap-2 pl-5">
                    <div className="flex rounded-lg border border-luma-border overflow-hidden text-xs font-semibold">
                      <button onClick={() => setDiscountMode('pct')}
                        className={`px-2.5 py-1.5 transition-colors ${discountMode === 'pct' ? 'bg-luma-black text-white' : 'bg-white text-luma-muted'}`}>%</button>
                      <button onClick={() => setDiscountMode('dollar')}
                        className={`px-2.5 py-1.5 transition-colors ${discountMode === 'dollar' ? 'bg-luma-black text-white' : 'bg-white text-luma-muted'}`}>$</button>
                    </div>
                    <input
                      type="number" min="0" step="0.01"
                      autoFocus
                      className="input py-1 text-sm w-24"
                      placeholder={discountMode === 'pct' ? '0.00%' : '$0.00'}
                      value={customDiscount}
                      onChange={e => setCustomDiscount(e.target.value)}
                    />
                    {customDiscount && <span className="text-xs text-green-600 font-semibold">-${discountAmt.toFixed(2)} off</span>}
                  </div>
                )}
              </div>

              {/* Tip */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0">🙏</span>
                  <span className="text-sm text-luma-muted flex-1">Tip</span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {[15, 18, 20, 25].map(p => (
                      <button key={p} onClick={() => { setTipPreset(p); setUseCustomTip(false) }}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${!useCustomTip && tipPreset === p ? 'bg-gold text-white' : 'bg-white border border-luma-border text-luma-muted hover:border-gold/40'}`}>
                        {p}%
                      </button>
                    ))}
                    <button onClick={() => { setUseCustomTip(true); setTipPreset(0) }}
                      className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${useCustomTip ? 'bg-luma-black text-white' : 'bg-white border border-luma-border text-luma-muted hover:border-gold/40'}`}>
                      Custom
                    </button>
                    {(tipPreset > 0 || useCustomTip) && (
                      <button onClick={() => { setTipPreset(0); setCustomTip(''); setUseCustomTip(false) }}
                        className="text-luma-muted hover:text-red-500 ml-0.5"><X size={12} /></button>
                    )}
                  </div>
                </div>
                {useCustomTip && (
                  <div className="flex items-center gap-2 pl-5">
                    <span className="text-sm text-luma-muted">$</span>
                    <input
                      type="number" min="0" step="0.01"
                      autoFocus
                      className="input py-1 text-sm w-24"
                      placeholder="0.00"
                      value={customTip}
                      onChange={e => setCustomTip(e.target.value)}
                    />
                  </div>
                )}
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
                {discountAmt > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${discountAmt.toFixed(2)}</span></div>}
                <div className="flex justify-between text-luma-muted"><span>Tax ({taxPct}%)</span><span>${taxAmt.toFixed(2)}</span></div>
                {tipAmt > 0 && <div className="flex justify-between text-blue-600"><span>Tip</span><span>+${tipAmt.toFixed(2)}</span></div>}
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

              {/* Split payment inputs */}
              {paymentMethod === 'split' && (
                <div className="bg-luma-surface rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-luma-muted mb-2">Split Total: <span className="text-gold">${total.toFixed(2)}</span></p>
                  <div className="flex items-center gap-2">
                    <Banknote size={14} className="text-luma-muted shrink-0" />
                    <span className="text-xs text-luma-muted w-10">Cash</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-luma-muted text-sm">$</span>
                      <input type="number" min="0" step="0.01" className="input pl-6 py-1 text-sm w-full"
                        placeholder="0.00" value={splitCash}
                        onChange={e => { setSplitCash(e.target.value); setSplitCard((total - (parseFloat(e.target.value)||0)).toFixed(2)) }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-luma-muted shrink-0" />
                    <span className="text-xs text-luma-muted w-10">Card</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-luma-muted text-sm">$</span>
                      <input type="number" min="0" step="0.01" className="input pl-6 py-1 text-sm w-full"
                        placeholder="0.00" value={splitCard}
                        onChange={e => { setSplitCard(e.target.value); setSplitCash((total - (parseFloat(e.target.value)||0)).toFixed(2)) }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Gift card inputs */}
              {paymentMethod === 'gift_card' && (
                <div className="bg-luma-surface rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <input className="input flex-1 font-mono uppercase text-sm py-1"
                      placeholder="Enter card code…"
                      value={gcCode}
                      onChange={e => { setGcCode(e.target.value.toUpperCase()); setGcData(null); setGcLookupMsg('') }}
                      onKeyDown={e => e.key === 'Enter' && lookupGiftCard()} />
                    <button onClick={lookupGiftCard}
                      className="px-3 py-1 bg-luma-black text-white rounded-xl text-xs font-semibold hover:bg-gold transition-colors">
                      Look up
                    </button>
                  </div>
                  {gcLookupMsg && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/>{gcLookupMsg}</p>}
                  {gcData && (
                    <div className="flex items-center justify-between bg-white rounded-xl p-2.5 text-sm">
                      <span className="font-mono font-bold text-xs">{gcData.code}</span>
                      <span className="text-green-600 font-bold">Balance: ${gcData.balance.toFixed(2)}</span>
                      {gcData.balance < total && (
                        <span className="text-xs text-orange-500">Remaining: ${(total - gcData.balance).toFixed(2)} due</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={processPayment}
                disabled={processing || (paymentMethod === 'gift_card' && !gcData)}
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
            <p className="text-3xl font-bold text-gold mb-1">${lastReceipt.total.toFixed(2)}</p>
            {lastReceipt.tip > 0 && <p className="text-sm text-blue-600 font-semibold mb-1">includes ${lastReceipt.tip.toFixed(2)} tip 🙏</p>}
            <p className="text-luma-muted text-sm mb-1">{lastReceipt.client}</p>
            {selectedClient && <p className="text-xs text-green-600 font-medium mb-4">+{loyaltyPoints} loyalty points earned</p>}
            <button onClick={() => setSuccess(false)} className="btn btn-primary w-full py-3">New Sale</button>
          </div>
        </div>
      )}

      {/* ── End of Day modal ── */}
      {showEOD && eodData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-luma-border">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-gold" />
                <h3 className="font-bold text-luma-black">End of Day Summary</h3>
              </div>
              <button onClick={() => setShowEOD(false)} className="text-luma-muted hover:text-luma-black"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-luma-muted text-center">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <div className="bg-luma-surface rounded-2xl p-4 space-y-3">
                {[
                  { label: '💵 Cash', val: eodData.cash },
                  { label: '💳 Card', val: eodData.card },
                  { label: '📱 Other (Venmo/Zelle/etc.)', val: eodData.other },
                  { label: '🙏 Tips collected', val: eodData.tips },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-luma-muted">{label}</span>
                    <span className="font-semibold text-luma-black">${val.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-luma-border pt-3 flex justify-between font-bold text-luma-black">
                  <span>Total Revenue</span>
                  <span className="text-xl text-gold">${eodData.total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-luma-muted text-center">{eodData.count} transaction{eodData.count !== 1 ? 's' : ''} today</p>
              </div>
              <button onClick={() => setShowEOD(false)}
                className="w-full py-2.5 bg-luma-black text-white rounded-xl text-sm font-semibold hover:bg-gold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Today's Sales / Refunds modal ── */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-luma-border">
              <h3 className="font-bold text-luma-black">Today's Sales</h3>
              <button onClick={() => setShowHistory(false)} className="text-luma-muted hover:text-luma-black"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {recentTx.length === 0 ? (
                <div className="p-12 text-center text-luma-muted">
                  <ShoppingCart size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-luma-black">No sales today</p>
                </div>
              ) : (
                <div className="divide-y divide-luma-border">
                  {recentTx.map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-luma-black">${tx.total.toFixed(2)}</p>
                        <p className="text-xs text-luma-muted capitalize">
                          {tx.payment_method} · {new Date(tx.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      {tx.refunded_at ? (
                        <span className="text-xs text-red-500 font-semibold px-2 py-1 bg-red-50 rounded-lg">Refunded</span>
                      ) : (
                        <button onClick={() => issueRefund(tx.id)}
                          className="flex items-center gap-1 text-xs text-luma-muted hover:text-red-500 px-2.5 py-1.5 border border-luma-border hover:border-red-200 rounded-lg transition-colors">
                          <RotateCcw size={11} />Refund
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-luma-border p-4 bg-luma-surface rounded-b-2xl text-center text-sm">
              <span className="text-luma-muted">{recentTx.filter(t => !t.refunded_at).length} active sale{recentTx.filter(t => !t.refunded_at).length !== 1 ? 's' : ''} · </span>
              <span className="font-bold text-luma-black">${recentTx.filter(t => !t.refunded_at).reduce((s, t) => s + t.total, 0).toFixed(2)} total</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
