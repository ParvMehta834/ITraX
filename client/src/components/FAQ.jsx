import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    id: 1,
    question: 'Is the free plan really free?',
    answer:
      'Yes! The free plan is completely free and never expires. You get access to core features including asset tracking, inventory monitoring, and basic reporting for up to 50 assets and 5 team members.',
  },
  {
    id: 2,
    question: 'Can I upgrade to Pro later?',
    answer:
      'Absolutely! You can upgrade anytime from your account settings. We\'ll keep your data intact and seamlessly transition you to the Pro plan with advanced features and unlimited assets.',
  },
  {
    id: 3,
    question: 'How do employees request assets?',
    answer:
      'Employees can log in to their dashboard, navigate to the "Request" section, and submit asset requests with details. Admins receive notifications and can review, approve, and assign assets directly.',
  },
  {
    id: 4,
    question: 'Do you support license renewals?',
    answer:
      'Yes! ITraX automatically tracks license expiration dates and sends alerts before renewal deadlines. You can set custom reminder periods and track renewal history for compliance audits.',
  },
  {
    id: 5,
    question: 'Is data secure?',
    answer:
      'Security is our top priority. We use enterprise-grade encryption, SOC 2 certification, GDPR compliance, and ISO 27001 standards to protect your data. All data is encrypted in transit and at rest.',
  },
  {
    id: 6,
    question: 'Can I export reports?',
    answer:
      'Yes! Generate and export comprehensive reports in PDF or CSV format. Filter by date range, asset type, status, and more. Perfect for compliance audits and management reviews.',
  },
]

const AccordionItem = ({ faq, isOpen, onToggle }) => {
  return (
    <div className="accordion-item">
      <button
        onClick={onToggle}
        className={`accordion-header w-full text-left ${isOpen ? 'open' : ''}`}
      >
        <span className="flex-1 font-semibold text-slate-900 pr-4">
          {faq.question}
        </span>
        <div className={`accordion-icon ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={20} />
        </div>
      </button>
      {isOpen && (
        <div className="accordion-body">
          <div className="accordion-content">{faq.answer}</div>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  const [openId, setOpenId] = useState(null)

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">
          Everything you need to know about ITraX
        </p>

        <div className="accordion">
          {FAQS.map((faq) => (
            <AccordionItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
            />
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 text-center p-6 glass rounded-lg">
          <p className="text-slate-600 mb-3">
            Didn't find what you're looking for?
          </p>
          <a
            href="mailto:support@itrax.app"
            className="text-blue-600 hover:text-blue-700 font-semibold underline"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  )
}
