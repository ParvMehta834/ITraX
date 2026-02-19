import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('home')

  const handleNavClick = (target) => {
    setMobileOpen(false)
    if (target === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setActiveLink('home')
    } else {
      const element = document.getElementById(target)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        setActiveLink(target)
      }
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050e3b] border-b border-blue-400/20 w-full transition-all duration-300">
      <div className="navbar-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between py-3">
        {/* Logo & Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('home')}
            className="text-2xl font-bold text-white hover:text-blue-300 transition"
          >
            ITraX
          </button>
          <div className="hidden sm:block text-sm text-gray-300 font-medium">
            Smart Tracking for Smarter IT
          </div>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex gap-1 items-center">
          <li>
            <button
              onClick={() => handleNavClick('home')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeLink === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Home
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavClick('features')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeLink === 'features'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Features
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavClick('pricing')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeLink === 'pricing'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Pricing
            </button>
          </li>
        </ul>

        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-3 items-center">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 text-white border border-blue-400 rounded-lg hover:bg-blue-500/20 font-medium transition duration-300"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition duration-300 shadow-lg shadow-blue-600/30"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white hover:text-blue-300 transition p-2"
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a1850] border-t border-blue-400/20 p-4">
          <ul className="flex flex-col gap-3">
            <li>
              <button
                onClick={() => handleNavClick('home')}
                className={`block w-full text-left px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeLink === 'home'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('features')}
                className={`block w-full text-left px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeLink === 'features'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Features
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick('pricing')}
                className={`block w-full text-left px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeLink === 'pricing'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Pricing
              </button>
            </li>
            <li className="pt-3 border-t border-blue-400/20">
              <button
                onClick={() => {
                  navigate('/login')
                  setMobileOpen(false)
                }}
                className="block w-full text-center px-4 py-2 mb-2 text-white border border-blue-400 rounded-lg hover:bg-blue-500/20 font-medium transition duration-300"
              >
                Login
              </button>
              <button
                onClick={() => {
                  navigate('/signup')
                  setMobileOpen(false)
                }}
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition duration-300 shadow-lg shadow-blue-600/30"
              >
                Get Started
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}
