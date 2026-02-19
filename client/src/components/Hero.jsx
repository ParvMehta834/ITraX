import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, TrendingUp, Package, AlertCircle } from 'lucide-react'

const MetricCard = ({ icon: Icon, label, value, percentage, delay }) => {
  return (
    <div
      className="metric-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="metric-label">{label}</div>
          <div className="metric-value">{value}</div>
        </div>
        <div className="text-electric-500 opacity-60">
          <Icon size={20} />
        </div>
      </div>
      <div className="metric-bar">
        <div
          className="metric-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function Hero() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLearnMore = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero" id="hero">
      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="hero-content animate-fade-in">
            <h1 className="hero-headline">
              Reinventing IT Asset Management for the Modern World
            </h1>
            <p className="hero-subtext">
              Track, manage, and optimize hardware & licenses in one smart
              dashboard with real-time alerts. Built for teams that move fast.
            </p>

            {/* CTA Buttons */}
            <div className="hero-buttons">
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary text-lg px-8 py-4"
              >
                Get Started Free
              </button>
              <button
                onClick={handleLearnMore}
                className="btn-secondary text-lg px-8 py-4"
              >
                Learn More
              </button>
            </div>

            {/* Trust Statement */}
            <p className="text-sm text-blue-600 mt-6">
              ✓ Free forever • No credit card required • Try all features
            </p>
          </div>

          {/* Right Side - Floating Metrics */}
          <div className="floating-metrics hidden lg:block">
            <MetricCard
              icon={Package}
              label="Assets Tracked"
              value="2,847"
              percentage={85}
              delay={0}
            />
            <MetricCard
              icon={AlertCircle}
              label="Licenses Expiring"
              value="12"
              percentage={25}
              delay={0.3}
            />
            <MetricCard
              icon={TrendingUp}
              label="Inventory Health"
              value="94%"
              percentage={94}
              delay={0.6}
            />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-16 text-center animate-pulse">
          <p className="text-cyan-400 text-sm mb-2">Scroll to explore</p>
          <svg
            className="w-6 h-6 mx-auto text-electric-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}
