import React from 'react'

const PARTNER_BADGES = [
  { id: 1, name: 'Enterprise Grade' },
  { id: 2, name: 'SOC 2 Certified' },
  { id: 3, name: 'GDPR Compliant' },
  { id: 4, name: '99.9% Uptime' },
  { id: 5, name: 'ISO 27001' },
  { id: 6, name: '24/7 Support' },
]

export default function LogosStrip() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm text-electric-500 font-semibold mb-6">
          Built for modern IT teams
        </p>
        <div className="logos-strip">
          {PARTNER_BADGES.map((badge) => (
            <div key={badge.id} className="logo-badge">
              {badge.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
