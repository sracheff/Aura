'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sparkles, CheckCircle2 } from 'lucide-react'

type FormField = {
  id: string; label: string; type: string
  required: boolean; options: string[]; placeholder: string
}
type IntakeForm = {
  id: string; name: string; description: string | null
  fields: FormField[]; owner_id: string
}

function IntakeContent() {
  const params = useSearchParams()
  const formId = params.get('form')

  const [form, setForm]         = useState<IntakeForm | null>(null)
  const [answers, setAnswers]   = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (formId) loadForm()
    else setError('No form specified.')
  }, [formId])

  async function loadForm() {
    const { data } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('id', formId)
      .eq('active', true)
      .single()
    if (!data) setError('Form not found or no longer active.')
    else setForm(data)
  }

  function setAnswer(fieldId: string, val: string) {
    setAnswers(prev => ({ ...prev, [fieldId]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    // Validate required
    for (const f of form.fields) {
      if (f.required && !answers[f.id]?.trim()) {
        setError(`"${f.label}" is required.`); return
      }
    }
    setSubmitting(true)
    setError('')
    await supabase.from('intake_responses').insert({
      owner_id: form.owner_id,
      form_id: form.id,
      answers,
    })
    setSubmitting(false)
    setSubmitted(true)
  }

  if (error) return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
      <div className="text-center">
        <p className="font-bold text-[#3D3530] text-lg mb-2">Oops!</p>
        <p className="text-[#9E9085]">{error}</p>
      </div>
    </div>
  )

  if (!form) return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="font-bold text-[#3D3530] text-2xl mb-2">All done! 🎉</h2>
        <p className="text-[#9E9085]">Thanks for completing your intake form. We'll see you at your appointment!</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F7F4EF] py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A96E] to-[#B8934A] flex items-center justify-center mx-auto mb-4">
            <Sparkles size={20} className="text-[#1A1410]" />
          </div>
          <h1 className="text-2xl font-bold text-[#3D3530] mb-1">{form.name}</h1>
          {form.description && <p className="text-[#9E9085] text-sm">{form.description}</p>}
        </div>

        <form onSubmit={submit} className="space-y-5">
          {form.fields.map(field => (
            <div key={field.id} className="bg-white rounded-2xl p-5 border border-[#EDE8E1]">
              <label className="block text-sm font-semibold text-[#3D3530] mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === 'text' && (
                <input type="text" className="w-full px-4 py-2.5 border border-[#EDE8E1] rounded-xl text-sm outline-none focus:border-[#C9A96E] transition-colors"
                  placeholder={field.placeholder} value={answers[field.id] || ''} onChange={e => setAnswer(field.id, e.target.value)} />
              )}
              {field.type === 'textarea' && (
                <textarea className="w-full px-4 py-2.5 border border-[#EDE8E1] rounded-xl text-sm outline-none focus:border-[#C9A96E] transition-colors resize-none" rows={3}
                  placeholder={field.placeholder} value={answers[field.id] || ''} onChange={e => setAnswer(field.id, e.target.value)} />
              )}
              {field.type === 'phone' && (
                <input type="tel" className="w-full px-4 py-2.5 border border-[#EDE8E1] rounded-xl text-sm outline-none focus:border-[#C9A96E] transition-colors"
                  placeholder={field.placeholder || '(555) 000-0000'} value={answers[field.id] || ''} onChange={e => setAnswer(field.id, e.target.value)} />
              )}
              {field.type === 'email' && (
                <input type="email" className="w-full px-4 py-2.5 border border-[#EDE8E1] rounded-xl text-sm outline-none focus:border-[#C9A96E] transition-colors"
                  placeholder={field.placeholder || 'your@email.com'} value={answers[field.id] || ''} onChange={e => setAnswer(field.id, e.target.value)} />
              )}
              {field.type === 'date' && (
                <input type="date" className="w-full px-4 py-2.5 border border-[#EDE8E1] rounded-xl text-sm outline-none focus:border-[#C9A96E] transition-colors"
                  value={answers[field.id] || ''} onChange={e => setAnswer(field.id, e.target.value)} />
              )}
              {field.type === 'select' && (
                <select className="w-full px-4 py-2.5 border border-[#EDE8E1] rounded-xl text-sm outline-none focus:border-[#C9A96E] transition-colors bg-white"
                  value={answers[field.id] || ''} onChange={e => setAnswer(field.id, e.target.value)}>
                  <option value="">Select an option…</option>
                  {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {field.type === 'radio' && (
                <div className="space-y-2">
                  {field.options.map(o => (
                    <label key={o} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name={field.id} value={o} checked={answers[field.id] === o} onChange={() => setAnswer(field.id, o)}
                        className="accent-[#C9A96E]" />
                      <span className="text-sm text-[#3D3530]">{o}</span>
                    </label>
                  ))}
                </div>
              )}
              {field.type === 'checkbox' && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={answers[field.id] === 'true'} onChange={e => setAnswer(field.id, e.target.checked ? 'true' : '')}
                    className="accent-[#C9A96E] w-4 h-4" />
                  <span className="text-sm text-[#9E9085]">Yes</span>
                </label>
              )}
            </div>
          ))}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-4 bg-[#1A1410] text-white rounded-2xl font-bold text-base hover:bg-[#C9A96E] transition-colors disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit Form'}
          </button>
          <p className="text-center text-xs text-[#9E9085]">Your information is kept private and secure.</p>
        </form>
      </div>
    </div>
  )
}

export default function IntakePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <IntakeContent />
    </Suspense>
  )
}
