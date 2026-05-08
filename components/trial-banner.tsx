'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Sparkles, X } from 'lucide-react'

export default function TrialBanner() {
  const [show, setShow] = useState(false)
  const [daysLeft, setDaysLeft] = useState(0)
  const [plan, setPlan] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('salons')
        .select('plan, trial_ends_at, subscription_status')
        .eq('owner_id', data.user.id)
        .single()
        .then(({ data: salon }) => {
          if (!salon) return
          setPlan(salon.plan)
          if (salon.plan === 'trial') {
            const msLeft = new Date(salon.trial_ends_at).getTime() - Date.now()
            const days = Math.max(0, Math.ceil(msLeft / 86400000))
            setDaysLeft(days)
            setShow(days <= 7) // Show banner in last 7 days of trial
          }
        })
    })
  }, [])

  if (!show || dismissed || (plan && plan !== 'trial')) return null

  const urgent = daysLeft <= 3

  return (
    <div className={`flex items-center justify-between px-4 py-2 text-sm font-medium ${
      urgent ? 'bg-red-500/90 text-white' : 'bg-gold/90 text-luma-black'
    }`}>
      <div className="flex items-center gap-2">
        <Sparkles size={14} />
        {daysLeft === 0
          ? 'Your free trial has expired. Upgrade to keep access.'
          : daysLeft === 1
            ? 'Your free trial ends tomorrow!'
            : `${daysLeft} days left in your free trial.`
        }
        <Link href="/settings?tab=billing" className={`underline font-bold ml-1 ${urgent ? 'text-white' : 'text-luma-black'}`}>
          Upgrade now →
        </Link>
      </div>
      <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100 ml-4">
        <X size={14} />
      </button>
    </div>
  )
}
