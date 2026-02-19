import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Bell, Truck } from 'lucide-react'

export default function HighlightBanner() {
  const navigate = useNavigate()

  const benefits = [
    {
      icon: Bell,
      text: 'Expiring license alerts',
    },
    {
      icon: Clock,
      text: 'Inventory low notifications',
    },
    {
      icon: Truck,
      text: 'Delivery status updates',
    },
  ]

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="card glass-lg p-8 md:p-12 relative overflow-hidden">
          {/* Gradient Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-transparent to-blue-500/10 pointer-events-none" />
          <div
            className="absolute -right-20 -top-20 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"
          />

          <div className="relative z-10">
            <h2 className="section-title text-4xl mb-4">
              Stay ahead of renewals, returns, and low stock.
            </h2>
            <p className="text-slate-600 text-lg text-center max-w-2xl mx-auto mb-8">
              Never worry about expiring licenses, missing inventory, or delayed
              deliveries again. Get proactive alerts and real-time insights.
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200"
                  >
                    <Icon className="text-blue-500 flex-shrink-0" size={24} />
                    <span className="text-slate-700">{benefit.text}</span>
                  </div>
                )
              })}
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary text-lg px-10 py-4 mx-auto"
              >
                Get Started Free Today
              </button>
              <p className="text-blue-600 text-sm mt-4">
                Join 1000+ teams already using ITraX
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
