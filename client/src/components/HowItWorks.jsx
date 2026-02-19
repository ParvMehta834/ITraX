import React from 'react'
import { UserPlus, Send, CheckCircle } from 'lucide-react'

const STEPS = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Setup Admin & Team',
    description:
      'Admin signs up and creates employee logins. Set up locations, categories, and inventory thresholds in minutes.',
  },
  {
    number: 2,
    icon: Send,
    title: 'Employees Request Assets',
    description:
      'Team members request hardware and licenses through the dashboard. Track who needs what with detailed request history.',
  },
  {
    number: 3,
    icon: CheckCircle,
    title: 'Monitor & Approve',
    description:
      'Admin reviews requests, approves assignments, and monitors live status. Track deliveries and manage inventory in real-time.',
  },
]

const TimelineStep = ({ step, isLast }) => {
  const Icon = step.icon

  return (
    <div className="timeline-item">
      <div className="timeline-marker" />
      <div className="timeline-content">
        <div className="timeline-number">{step.number}</div>
        <h4 className="timeline-title">{step.title}</h4>
        <p className="timeline-desc">{step.description}</p>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">
          Three simple steps to master IT asset management
        </p>

        <div className="timeline max-w-3xl mx-auto">
          {STEPS.map((step, index) => (
            <TimelineStep
              key={step.number}
              step={step}
              isLast={index === STEPS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
