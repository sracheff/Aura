'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase, Service } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import { Save, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, Scissors, LogOut } from 'lucide-react'

const emptyServiceForm = { name: '', price: 0, duration: 60, commission_rate: 40, active: true }

export default function SettingsPage() {
  const { userId, loading } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [serviceForm, setServiceForm] = useState(emptyServiceForm)
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [deleteService, setDeleteService] = useState<Service | null>(null)

  // Salon profile
  const [salonName, setSalonName] = useState('')
  const [salonPhone, setSalonPhone] = useState('')
  const [salonAddress, setSalonAddress] = useState('')
  const [taxRate, setTaxRate] = useState('8.5')
  const [timezone, setTimezone] = useState('America/New_York')

  useEffect(() => {
    if (userId) {
      fetchServices()
      loadProfile()
    }
  }, [userId])

  async function fetchServices() {
    const { data } = await supabase.from('services').select('*').eq('owner_id', userId).order('name')
    if (data) setServices(data)
  }

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.user_metadata) {
      setSalonName(user.user_metadata.salon_name || '')
      setSalonPhone(user.user_metadata.salon_phone || '')
      setSalonAddress(user.user_metadata.salon_address || '')
      setTaxRate(user.user_metadata.tax_rate || '8.5')
      setTimezone(user.user_metadata.timezone || 'America/New_York')
    }
  }

  async function saveProfile() {
    setSavingProfile(true)
    await supabase.auth.updateUser({
      data: { salon_name: salonName, salon_phone: salonPhone, salon_address: salonAddress, tax_rate: taxRate, timezone }
    })
    setSavingProfile(false)
    setSuccessMsg('Profile saved!')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  function openAddService() {
    setServiceForm(emptyServiceForm)
    setEditService(null)
    setError('')
    setShowServiceModal(true)
  }

  function openEditService(s: Service) {
    setServiceForm({ name: s.name, price: s.price, duration: s.duration, commission_rate: s.commission_rate, active: s.active })
    setEditService(s)
    setError('')
    setShowServiceModal(true)
  }

  async function saveService() {
    if (!serviceForm.name.trim()) { setError('Service name is required'); return }
    if (!serviceForm.price || serviceForm.price <= 0) { setError('Price must be greater than 0'); return }
    setSaving(true)
    setError('')
    const payload = { ...serviceForm, owner_id: userId }
    if (editService) {
      const { error: err } = await supabase.from('services').update(payload).eq('id', editService.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('services').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setShowServiceModal(false)
    fetchServices()
  }

  async function confirmDeleteService() {
    if (!deleteService) return
    await supabase.from('services').delete().eq('id', deleteService.id)
    setDeleteService(null)
    fetchServices()
  }

  async function toggleServiceActive(s: Service) {
    await supabase.from('services').update({ active: !s.active }).eq('id', s.id)
    fetchServices()
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Settings" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl mx-auto w-full">
        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle size={15} />{successMsg}
          </div>
        )}

        {/* Salon Profile */}
        <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
          <div className="px-6 py-4 border-b border-luma-border">
            <h2 className="font-bold text-luma-black">Salon Profile</h2>
            <p className="text-sm text-luma-muted mt-0.5">Your business information</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Salon Name</label>
                <input className="input" value={salonName} onChange={e => setSalonName(e.target.value)} placeholder="My Salon" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" type="tel" value={salonPhone} onChange={e => setSalonPhone(e.target.value)} placeholder="(555) 000-0000" />
              </div>
              <div className="col-span-2">
                <label className="label">Address</label>
                <input className="input" value={salonAddress} onChange={e => setSalonAddress(e.target.value)} placeholder="123 Main St, City, ST 00000" />
              </div>
              <div>
                <label className="label">Default Tax Rate (%)</label>
                <input className="input" type="number" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
              </div>
              <div>
                <label className="label">Timezone</label>
                <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="America/Phoenix">Arizona (MST)</option>
                  <option value="America/Anchorage">Alaska (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii (HST)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={saveProfile} disabled={savingProfile} className="btn btn-primary px-6 disabled:opacity-60">
                <Save size={14} className="inline mr-2" />
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
          <div className="px-6 py-4 border-b border-luma-border flex items-center justify-between">
            <div>
              <h2 className="font-bold text-luma-black">Services</h2>
              <p className="text-sm text-luma-muted mt-0.5">Manage your service menu</p>
            </div>
            <button onClick={openAddService} className="btn btn-primary py-1.5 px-4 text-sm">
              <Plus size={14} className="inline mr-1" />Add Service
            </button>
          </div>
          <div className="divide-y divide-luma-border">
            {services.length === 0 ? (
              <div className="py-10 text-center text-luma-muted">
                <Scissors size={30} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No services yet — add your menu items</p>
              </div>
            ) : (
              services.map(s => (
                <div key={s.id} className={`flex items-center px-6 py-3 gap-4 ${!s.active ? 'opacity-50' : ''}`}>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-luma-black">{s.name}</div>
                    <div className="text-xs text-luma-muted">{s.duration} min · {s.commission_rate}% commission</div>
                  </div>
                  <div className="text-base font-bold text-gold">${s.price}</div>
                  <button
                    onClick={() => toggleServiceActive(s)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${s.active ? 'bg-gold' : 'bg-luma-border'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => openEditService(s)} className="p-1.5 hover:bg-luma-surface rounded-lg text-luma-muted hover:text-luma-black"><Edit2 size={13} /></button>
                    <button onClick={() => setDeleteService(s)} className="p-1.5 hover:bg-red-50 rounded-lg text-luma-muted hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl border border-luma-border overflow-hidden">
          <div className="px-6 py-4 border-b border-luma-border">
            <h2 className="font-bold text-luma-black">Account</h2>
          </div>
          <div className="p-6">
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              <LogOut size={16} />Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Delete service confirm */}
      {deleteService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Delete "{deleteService.name}"?</h3>
            <p className="text-luma-muted text-sm mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteService(null)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
              <button onClick={confirmDeleteService} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Service modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-luma-border">
              <h2 className="text-lg font-bold">{editService ? 'Edit Service' : 'New Service'}</h2>
              <button onClick={() => setShowServiceModal(false)} className="p-2 hover:bg-luma-surface rounded-lg text-luma-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle size={14} />{error}</div>}
              <div>
                <label className="label">Service Name *</label>
                <input className="input" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} placeholder="Balayage, Cut & Style..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Price ($) *</label>
                  <input className="input" type="number" min="0" step="0.01" value={serviceForm.price || ''} onChange={e => setServiceForm({...serviceForm, price: parseFloat(e.target.value)||0})} placeholder="0" />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input className="input" type="number" min="5" step="5" value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: parseInt(e.target.value)||60})} />
                </div>
                <div>
                  <label className="label">Commission (%)</label>
                  <input className="input" type="number" min="0" max="100" value={serviceForm.commission_rate} onChange={e => setServiceForm({...serviceForm, commission_rate: parseInt(e.target.value)||0})} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setServiceForm({...serviceForm, active: !serviceForm.active})}
                  className={`relative w-9 h-5 rounded-full transition-colors ${serviceForm.active ? 'bg-gold' : 'bg-luma-border'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${serviceForm.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm font-medium text-luma-black">{serviceForm.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div className="p-6 border-t border-luma-border flex gap-3">
              <button onClick={() => setShowServiceModal(false)} className="flex-1 btn bg-luma-surface text-luma-black">Cancel</button>
              <button onClick={saveService} disabled={saving} className="flex-1 btn btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editService ? 'Save Changes' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
