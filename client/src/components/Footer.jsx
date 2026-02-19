import React from 'react'
import { Mail, Phone } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerColumns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Security', href: '#' },
        { label: 'Roadmap', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press', href: '#' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'Documentation', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Status', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
        { label: 'Compliance', href: '#' },
      ],
    },
  ]

  return (
    <footer className="footer bg-gradient-to-b from-slate-50 to-slate-100 border-t border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer Top */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            {/* Logo & Contact */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">ITraX</h3>
              <p className="text-slate-600 text-sm mb-4">
                Smart Tracking for Smarter IT
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="mailto:support@itrax.app"
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm"
                >
                  <Mail size={16} />
                  support@itrax.app
                </a>
                <a
                  href="tel:+1234567890"
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm"
                >
                  <Phone size={16} />
                  +1 (555) 123-4567
                </a>
              </div>
              <p className="text-electric-400 text-xs mt-2 font-semibold">
                24/7 Help Desk Available
              </p>
            </div>

            {/* Newsletter Signup */}
            <div className="w-full sm:w-auto">
              <p className="text-white font-semibold mb-3 text-sm">
                Stay updated
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="px-4 py-2 bg-white/10 border border-electric-500/30 rounded-lg text-white placeholder:text-cyan-300 text-sm focus:outline-none focus:border-electric-500"
                />
                <button className="btn-primary px-4 py-2 text-sm">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Grid */}
        <div className="footer-grid">
          {footerColumns.map((column, idx) => (
            <div key={idx}>
              <h4>{column.title}</h4>
              <ul className="footer-links">
                {column.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <a href={link.href} className="footer-link">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div>
            <p className="text-electric-400">
              © {currentYear} ITraX. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="footer-link text-sm">
              Privacy
            </a>
            <a href="#" className="footer-link text-sm">
              Terms
            </a>
            <a href="#" className="footer-link text-sm">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
