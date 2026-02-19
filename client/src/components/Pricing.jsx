import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'month • Forever free',
    description: 'Perfect for getting started',
    features: [
      'Up to 50 assets',
      '5 team members',
      'Real-time tracking',
      'Email support',
      'Basic reporting',
      'Asset assignment history',
    ],
    cta: 'Get Started',
    ctaAction: 'signup',
    featured: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '19.99',
    period: 'month • Billed annually',
    description: 'For growing teams',
    features: [
      'Unlimited assets',
      'Unlimited team members',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'API access',
      'SSO & advanced security',
      'Audit logs',
    ],
    cta: 'Coming Soon',
    ctaAction: 'comingsoon',
    featured: false,
    comingSoon: true,
  },
]

const ComingSoonModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card glass p-8 max-w-md">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Coming Soon!</h3>
        <p className="text-slate-600 mb-6">
          Our Pro plan is launching soon with unlimited assets, advanced
          analytics, and priority support. Be the first to know when it's
          available!
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Got it
          </button>
          <button
            onClick={() => {
              window.location.href = 'mailto:support@itrax.app'
            }}
            className="btn-primary flex-1"
          >
            Notify Me
          </button>
        </div>
      </div>
    </div>
  )
}

const PricingCard = ({ plan, onComingSoon }) => {
  const navigate = useNavigate()

  const handleCTA = () => {
    if (plan.ctaAction === 'signup') {
      navigate('/signup')
    } else if (plan.ctaAction === 'comingsoon') {
      onComingSoon()
    }
  }

  return (
    <div
      className={`card ${plan.featured ? 'featured pricing-card' : 'pricing-card'}`}
    >
      {plan.comingSoon && (
        <div className="pricing-badge">Coming Soon</div>
      )}

      <h3 className="pricing-title">{plan.name}</h3>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="pricing-price">${plan.price}</span>
        <span className="pricing-period">/{plan.period}</span>
      </div>
      <p className="text-slate-600 text-sm mb-6">{plan.description}</p>

      {/* Features List */}
      <ul className="pricing-features mb-6">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="pricing-feature">
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={handleCTA}
        className={`w-full py-3 font-semibold rounded-lg transition-all ${
          plan.comingSoon
            ? 'btn-glass opacity-50 cursor-not-allowed'
            : 'btn-primary'
        }`}
        disabled={plan.comingSoon}
      >
        {plan.cta}
      </button>
    </div>
  )
}

export default function Pricing() {
  const [showModal, setShowModal] = useState(false)

  return (
    <section id="pricing" className="py-20 px-4 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="section-title">Pricing Plans</h2>
        <p className="section-subtitle">
          Start free. Upgrade when you need to scale.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              onComingSoon={() => setShowModal(true)}
            />
          ))}
        </div>

        {/* FAQ Text */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-slate-600 mb-4">
            Have questions about pricing?
          </p>
          <a
            href="mailto:support@itrax.app"
            className="text-blue-600 hover:text-blue-700 font-semibold underline"
          >
            Contact our sales team
          </a>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showModal && (
        <ComingSoonModal onClose={() => setShowModal(false)} />
      )}
    </section>
  )
}
