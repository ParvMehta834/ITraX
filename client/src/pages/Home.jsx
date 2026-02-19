import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import LogosStrip from '../components/LogosStrip'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import HighlightBanner from '../components/HighlightBanner'
import Pricing from '../components/Pricing'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="w-screen min-h-screen bg-white overflow-x-hidden pt-16">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Trust / Social Proof Strip */}
        <LogosStrip />

        {/* Features Section */}
        <Features />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Highlight Banner */}
        <HighlightBanner />

        {/* Pricing Section */}
        <Pricing />

        {/* FAQ Section */}
        <FAQ />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
