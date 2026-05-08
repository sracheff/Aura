'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/topbar'
import { clsx } from 'clsx'
import {
  ClipboardList, Plus, X, Trash2, GripVertical,
  ChevronDown, Copy, ToggleLeft, ExternalLink, CheckCircle2,
} from 'lucide-react'

type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'phone' | 'email' | 'date'

type FormField = {
  id: string
  label: string
  type: FieldType
  required: boolean
  options: string[]   // for select / radio
  placeholder: string
}

type IntakeForm = {
  id: string
  name: string
  description: string | null
  fields: FormField[]
  active: boolean
  created_at: string
}

const FIELD_TYPES: { val: FieldType; label: string; icon: string }[] = [
  { val: 'text',     label: 'Short Text',    icon: '✏️' },
  { val: 'textarea', label: 'Long Text',     icon: '📝' },
  { val: 'select',   label: 'Dropdown',      icon: '🔽' },
  { val: 'radio',    label: 'Multiple Choice', icon: '⚪' },
  { val: 'checkbox', label: 'Checkbox',      icon: '☑️' },
  { val: 'phone',    label: 'Phone Number',  icon: '📱' },
  { val: 'email',    label: 'Email',         icon: '✉️' },
  { val: 'date',     label: 'Date',          icon: '📅' },
]

function newField(): FormField {
  return { id: crypto.randomUUID(), label: '', type: 'text', required: false, options: ['Option 1'], placeholder: '' }
}

export default function FormsPage() {
  const { userId, loading: authLoading } = useAuth()
  const [forms, setForms] = useState<IntakeForm[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<IntakeForm | null>(null)
  const [editing, setEditing] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')

  // Form editor state
  const [formName, setFormName]       = useState('')
  const [formDesc, setFormDesc]       = useState('')
  const [fields, setFields]           = useState<FormField[]>([])
  const [editId, setEditId]           = useState<string | null>(null)

  useEffect(() => { if (userId) fetchForms() }, [userId])

  async function fetchForms() {
    setLoading(true)
    const { data } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
    setForms(data || [])
    setLoading(false)
  }

  function openNew() {
    setFormName(''); setFormDesc('')
    setFields([
      { id: crypto.randomUUID(), label: 'Full Name', type: 'text', required: true, options: [], placeholder: '' },
      { id: crypto.randomUUID(), label: 'Phone Number', type: 'phone', required: true, options: [], placeholder: '' },
      { id: crypto.randomUUID(), label: 'Any allergies or sensitivities?', type: 'textarea', required: false, options: [], placeholder: 'None' },
    ])
    setEditId(null)
    setShowNew(true)
  }

  function openEdit(form: IntakeForm) {
    setFormName(form.name); setFormDesc(form.description || '')
    setFields(form.fields || [])
    setEditId(form.id)
    setShowNew(true)
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  function addOption(fieldId: string) {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, options: [...f.options, `Option ${f.options.length + 1}`] } : f))
  }

  function updateOption(fieldId: string, idx: number, val: string) {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, options: f.options.map((o, i) => i === idx ? val : o) } : f))
  }

  function removeOption(fieldId: string, idx: number) {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, options: f.options.filter((_, i) => i !== idx) } : f))
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) return
    setSaving(true)
    const payload = {
      owner_id: userId,
      name: formName,
      description: formDesc || null,
      fields,
      active: true,
    }
    if (editId) {
      await supabase.from('intake_forms').update(payload).eq('id', editId)
    } else {
      await supabase.from('intake_forms').insert(payload)
    }
    setSaving(false)
    setShowNew(false)
    fetchForms()
  }

  async function toggleActive(form: IntakeForm) {
    await supabase.from('intake_forms').update({ active: !form.active }).eq('id', form.id)
    fetchForms()
  }

  async function deleteForm(id: string) {
    if (!confirm('Delete this form?')) return
    await supabase.from('intake_forms').delete().eq('id', id)
    setSelected(null)
    fetchForms()
  }

  function copyFormLink(formId: string) {
    const url = `${window.location.origin}/intake?form=${formId}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(formId)
    setTimeout(() => setCopied(''), 2000)
  }

  if (authLoading || loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Intake Forms"
        subtitle="Create forms for new client consultations"
        action={{ label: 'New Form', onClick: openNew }}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {forms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-luma-border p-16 text-center">
            <ClipboardList size={48} className="mx-auto mb-4 text-luma-muted opacity-20" />
            <p className="font-bold text-luma-black text-lg">No forms yet</p>
            <p className="text-sm text-luma-muted mt-1 mb-6">Create an intake form to collect info from new clients before their first appointment</p>
            <button onClick={openNew}
              className="px-6 py-3 bg-luma-black text-white rounded-xl font-semibold hover:bg-gold transition-colors">
              + Create Your First Form
            </button>
          </div>
        ) : (
          <div className="grid gap-4 max-w-3xl">
            {forms.map(form => (
              <div key={form.id} className="bg-white rounded-2xl border border-luma-border p-5 hover:border-gold/40 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-luma-black">{form.name}</h3>
                      <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', form.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {form.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {form.description && <p className="text-sm text-luma-muted">{form.description}</p>}
                    <p className="text-xs text-luma-muted mt-1">{form.fields?.length || 0} question{form.fields?.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyFormLink(form.id)}
                      className={clsx('flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
                        copied === form.id ? 'bg-green-50 text-green-600 border-green-200' : 'border-luma-border text-luma-muted hover:border-gold/40'
                      )}
                      title="Copy form link"
                    >
                      {copied === form.id ? <><CheckCircle2 size={12} />Copied!</> : <><Copy size={12} />Copy Link</>}
                    </button>
                    <a href={`/intake?form=${form.id}`} target="_blank"
                      className="p-1.5 hover:bg-luma-surface rounded-lg text-luma-muted hover:text-luma-black transition-colors" title="Preview form">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => toggleActive(form)}
                      className="p-1.5 hover:bg-luma-surface rounded-lg text-luma-muted hover:text-luma-black transition-colors" title={form.active ? 'Deactivate' : 'Activate'}>
                      <ToggleLeft size={14} />
                    </button>
                    <button onClick={() => openEdit(form)}
                      className="px-3 py-1.5 bg-luma-surface rounded-lg text-xs font-semibold hover:bg-gold/10 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => deleteForm(form.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-luma-muted hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {/* Field preview */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(form.fields || []).slice(0, 6).map(f => (
                    <span key={f.id} className="text-xs bg-luma-surface px-2 py-1 rounded-lg text-luma-muted">
                      {FIELD_TYPES.find(t => t.val === f.type)?.icon} {f.label || 'Untitled'}
                      {f.required && <span className="text-red-400 ml-0.5">*</span>}
                    </span>
                  ))}
                  {(form.fields || []).length > 6 && (
                    <span className="text-xs bg-luma-surface px-2 py-1 rounded-lg text-luma-muted">+{form.fields.length - 6} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Builder Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-luma-border sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="font-bold text-luma-black">{editId ? 'Edit Form' : 'New Intake Form'}</h3>
              <button onClick={() => setShowNew(false)} className="text-luma-muted hover:text-luma-black"><X size={18} /></button>
            </div>
            <form onSubmit={saveForm} className="p-5 space-y-5">
              {/* Form meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Form Name *</label>
                  <input required className="input w-full" value={formName}
                    onChange={e => setFormName(e.target.value)} placeholder="e.g. New Client Consultation" />
                </div>
                <div className="col-span-2">
                  <label className="label">Description (optional)</label>
                  <input className="input w-full" value={formDesc}
                    onChange={e => setFormDesc(e.target.value)} placeholder="Shown to clients at the top of the form" />
                </div>
              </div>

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0 font-bold">Questions</label>
                  <button type="button" onClick={() => setFields(prev => [...prev, newField()])}
                    className="flex items-center gap-1 text-xs text-gold font-semibold hover:text-gold-dark">
                    <Plus size={13} />Add Question
                  </button>
                </div>
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="border border-luma-border rounded-xl p-4 space-y-3 bg-luma-surface/30">
                      <div className="flex items-center gap-2">
                        <GripVertical size={14} className="text-luma-muted shrink-0 cursor-grab" />
                        <span className="text-xs font-bold text-luma-muted w-5">{idx + 1}.</span>
                        <input
                          className="input flex-1 text-sm"
                          value={field.label}
                          onChange={e => updateField(field.id, { label: e.target.value })}
                          placeholder="Question label"
                        />
                        <select
                          className="input text-sm w-36 shrink-0"
                          value={field.type}
                          onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
                        >
                          {FIELD_TYPES.map(t => (
                            <option key={t.val} value={t.val}>{t.icon} {t.label}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 text-xs text-luma-muted whitespace-nowrap cursor-pointer">
                          <input type="checkbox" checked={field.required}
                            onChange={e => updateField(field.id, { required: e.target.checked })} />
                          Required
                        </label>
                        <button type="button" onClick={() => setFields(prev => prev.filter(f => f.id !== field.id))}
                          className="p-1 hover:bg-red-50 rounded text-luma-muted hover:text-red-500 shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {/* Placeholder for text types */}
                      {['text', 'textarea', 'phone', 'email'].includes(field.type) && (
                        <input
                          className="input text-sm ml-7"
                          value={field.placeholder}
                          onChange={e => updateField(field.id, { placeholder: e.target.value })}
                          placeholder="Placeholder text (optional)"
                        />
                      )}
                      {/* Options for select/radio */}
                      {['select', 'radio'].includes(field.type) && (
                        <div className="ml-7 space-y-2">
                          {field.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <div className={clsx('w-3 h-3 shrink-0', field.type === 'radio' ? 'rounded-full border border-luma-muted' : 'rounded border border-luma-muted')} />
                              <input
                                className="input flex-1 text-sm py-1"
                                value={opt}
                                onChange={e => updateOption(field.id, oi, e.target.value)}
                                placeholder={`Option ${oi + 1}`}
                              />
                              <button type="button" onClick={() => removeOption(field.id, oi)}
                                className="p-1 hover:bg-red-50 rounded text-luma-muted hover:text-red-500">
                                <X size={11} />
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addOption(field.id)}
                            className="text-xs text-gold font-semibold hover:text-gold-dark flex items-center gap-1">
                            <Plus size={11} />Add option
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {fields.length === 0 && (
                  <div className="border-2 border-dashed border-luma-border rounded-xl p-6 text-center text-luma-muted text-sm">
                    No questions yet. Click "Add Question" to start.
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 border border-luma-border rounded-xl text-sm font-semibold hover:bg-luma-surface">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-luma-black text-white rounded-xl text-sm font-semibold hover:bg-gold transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
