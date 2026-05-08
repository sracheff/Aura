import Link from 'next/link'
import { Sparkles, CalendarDays, DollarSign, Users, BarChart3, Gift, ShieldCheck, ArrowRight, Star, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Smart Scheduling',
    desc: 'AI-powered booking that fills your calendar and reduces no-shows by up to 40%.',
  },
  {
    icon: DollarSign,
    title: 'Built-in Payments',
    desc: 'Accept cards, Apple Pay, and Google Pay. Payouts in 1–2 business days.',
  },
  {
    icon: Users,
    title: 'Client Loyalty',
    desc: 'Automated loyalty points, birthday rewards, and win-back campaigns.',
  },
  {
    icon: Gift,
    title: 'Referral Engine',
    desc: 'Turn every happy client into a growth engine with tracked referral rewards.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    desc: 'Revenue trends, stylist performance, and retention metrics at a glance.',
  },
  {
    icon: ShieldCheck,
    title: 'Staff Management',
    desc: 'Commissions, tip splitting, schedules, and payroll exports — all automated.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'LUMA replaced GlossGenius, Wave, AND our spreadsheets. Our revenue is up 28% since switching.',
    name: 'Aisha M.',
    salon: 'Gloss & Grace, Miami',
    stars: 5,
  },
  {
    quote: 'The referral program alone brought in 18 new clients last month. Absolutely worth every penny.',
    name: 'Taylor K.',
    salon: 'Studio Bliss, Austin',
    stars: 5,
  },
  {
    quote: 'Finally a platform that actually understands how salons work. The AI coach is unreal.',
    name: 'Priya S.',
    salon: 'Luminary Hair, NYC',
    stars: 5,
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    desc: 'Perfect for solo stylists and booth renters',
    features: ['1 stylist', 'Booking & calendar', 'Basic POS', 'Client management', 'Email receipts'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$129',
    period: '/mo',
    desc: 'For growing salons ready to scale',
    features: ['Up to 8 stylists', 'Everything in Starter', 'Loyalty & referrals', 'Inventory management', 'AI insights', 'SMS campaigns'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: '/mo',
    desc: 'Multi-location and franchise operations',
    features: ['Unlimited stylists', 'Multi-location', 'Advanced analytics', 'White-label app', 'Dedicated support', 'Custom integrations'],
    cta: 'Contact sales',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-luma-bg font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-luma-bg/90 backdrop-blur-sm border-b border-luma-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <Sparkles size={16} className="text-luma-black" />
            </div>
            <span className="font-bold text-xl text-luma-black tracking-tight">LUMA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-luma-mid">
            <a href="#features" className="hover:text-luma-black transition-colors">Features</a>
            <a href="#pricing" className="hover:text-luma-black transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-luma-black transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-luma-mid hover:text-luma-black transition-colors">
              Sign in
            </Link>
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 text-sm text-gold font-medium mb-6">
          <Sparkles size={14} />
          The all-in-one OS for modern salons
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-luma-black leading-tight mb-6 max-w-3xl mx-auto">
          Run your entire salon from{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-dark">
            one platform
          </span>
        </h1>
        <p className="text-xl text-luma-mid max-w-2xl mx-auto mb-10 leading-relaxed">
          LUMA combines booking, payments, loyalty, referrals, staff management, and AI-powered insights — so you can stop juggling apps and start growing.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard" className="btn btn-primary flex items-center gap-2 text-base px-8 py-3">
            Start your free trial
            <ArrowRight size={18} />
          </Link>
          <a href="#features" className="btn text-base px-8 py-3">
            See how it works
          </a>
        </div>
        <p className="text-luma-muted text-sm mt-4">No credit card required · 14-day free trial · Cancel anytime</p>

        {/* Hero screenshot mockup */}
        <div className="mt-16 rounded-2xl border border-luma-border shadow-2xl overflow-hidden bg-white max-w-4xl mx-auto">
          <div className="h-8 bg-luma-black flex items-center gap-2 px-4">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-luma-muted text-xs ml-2">app.getluma.com/dashboard</span>
          </div>
          <div className="bg-luma-bg p-6 grid grid-cols-4 gap-4">
            {[
              { label: "Today's Revenue", val: '$1,284', sub: '+12% vs last week', color: 'text-green-600' },
              { label: 'Appointments', val: '9', sub: '2 remaining today', color: 'text-blue-600' },
              { label: 'Active Clients', val: '312', sub: '18 new this month', color: 'text-purple-600' },
              { label: 'Avg Ticket', val: '$142', sub: '+$8 vs last month', color: 'text-gold' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl p-4 border border-luma-border">
                <p className="text-luma-muted text-xs">{kpi.label}</p>
                <p className="text-2xl font-bold text-luma-black mt-1">{kpi.val}</p>
                <p className={`text-xs mt-1 ${kpi.color}`}>{kpi.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-24 border-y border-luma-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-luma-black mb-4">Everything your salon needs</h2>
            <p className="text-luma-mid text-lg max-w-xl mx-auto">Replace 5+ separate tools with one seamlessly integrated platform built specifically for beauty businesses.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group p-6 rounded-2xl border border-luma-border hover:border-gold/40 hover:shadow-lg transition-all bg-luma-bg">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <Icon size={22} className="text-gold" />
                </div>
                <h3 className="font-semibold text-luma-black text-lg mb-2">{title}</h3>
                <p className="text-luma-mid text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-luma-black">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: '4,200+', label: 'Salons powered by LUMA' },
            { val: '$94M', label: 'Revenue processed monthly' },
            { val: '40%', label: 'Average no-show reduction' },
            { val: '4.9★', label: 'Average app store rating' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-gold mb-2">{s.val}</p>
              <p className="text-luma-muted text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-luma-bg">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-luma-black text-center mb-16">Loved by salon owners</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-luma-border shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={16} className="fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-luma-mid text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-luma-black text-sm">{t.name}</p>
                  <p className="text-luma-muted text-xs">{t.salon}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white border-t border-luma-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-luma-black mb-4">Simple, transparent pricing</h2>
            <p className="text-luma-mid text-lg">Start free for 14 days. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 relative ${
                  plan.highlight
                    ? 'border-gold bg-luma-black text-white'
                    : 'border-luma-border bg-luma-bg'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-luma-black text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className={`font-bold text-xl mb-1 ${plan.highlight ? 'text-white' : 'text-luma-black'}`}>{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.highlight ? 'text-white/60' : 'text-luma-muted'}`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-gold' : 'text-luma-black'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? 'text-white/60' : 'text-luma-muted'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={15} className={plan.highlight ? 'text-gold' : 'text-gold'} />
                      <span className={plan.highlight ? 'text-white/80' : 'text-luma-mid'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-gold text-luma-black hover:bg-gold-light'
                      : 'bg-luma-black text-white hover:bg-luma-dark'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-luma-black">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <Sparkles size={40} className="text-gold mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">Ready to elevate your salon?</h2>
          <p className="text-white/60 text-lg mb-8">Join 4,200+ salons already running on LUMA. Your first 14 days are on us.</p>
          <Link href="/dashboard" className="btn btn-primary flex items-center gap-2 mx-auto w-fit text-base px-8 py-3">
            Get started for free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-luma-black border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-gold" />
            <span className="text-white font-bold">LUMA</span>
          </div>
          <p className="text-luma-muted text-sm">© 2026 LUMA Technologies, Inc. All rights reserved.</p>
          <div className="flex gap-6 text-luma-muted text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
