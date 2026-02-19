import React, { useEffect, useState } from 'react'
import {
  Package,
  Truck,
  Layers,
  AlertCircle,
  BarChart3,
  Users,
} from 'lucide-react'

const FEATURES = [
  {
    id: 1,
    icon: Package,
    title: 'Asset Management',
    description:
      'Assign, track, and monitor hardware assets. Keep detailed records of warranties, locations, and assignment history.',
  },
  {
    id: 2,
    icon: Truck,
    title: 'Real-time Order Tracking',
    description:
      'Track orders and deliveries with live status updates. Get instant notifications when items arrive.',
  },
  {
    id: 3,
    icon: Layers,
    title: 'Inventory Monitoring',
    description:
      'Monitor stock levels with automatic alerts. Set thresholds and never run out of critical supplies.',
  },
  {
    id: 4,
    icon: AlertCircle,
    title: 'License Renewal Alerts',
    description:
      'Never miss a license renewal. Get proactive notifications before expiration with renewal suggestions.',
  },
  {
    id: 5,
    icon: BarChart3,
    title: 'Reports & Exports',
    description:
      'Generate comprehensive reports in PDF or CSV format. Export data for audits and compliance.',
  },
  {
    id: 6,
    icon: Users,
    title: 'Role-Based Access',
    description:
      'Manage teams with Admin and Employee roles. Control permissions and access at granular levels.',
  },
]

const FeatureCard = ({ feature, index }) => {
  const [isVisible, setIsVisible] = useState(false)
  const Icon = feature.icon

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById(`feature-${feature.id}`)
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [feature.id])

  return (
    <div
      id={`feature-${feature.id}`}
      className={`card ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="card-icon">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">
        {feature.title}
      </h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        {feature.description}
      </p>
    </div>
  )
}

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="section-title">Everything you need to track IT at scale</h2>
        <p className="section-subtitle">
          Powerful features built for modern IT teams of all sizes
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
