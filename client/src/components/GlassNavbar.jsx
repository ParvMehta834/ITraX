import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Bell, Menu, X, LogOut, User } from 'lucide-react'
import Avatar from './Avatar'

const MENU_ITEMS = [
  { label: 'Assets', path: '/admin/assets' },
  { label: 'Tracking', path: '/admin/tracking' },
  { label: 'Inventory', path: '/admin/inventory' },
  { label: 'Software Licenses', path: '/admin/licenses' },
  { label: 'Categories', path: '/admin/categories' },
  { label: 'Location', path: '/admin/locations' },
  { label: 'Employee', path: '/admin/employees' },
  { label: 'Report', path: '/admin/reports' },
]

export default function GlassNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('itrax_user') || '{"name":"User"}')
  const userName = user?.name || 'User'

  const handleLogout = () => {
    localStorage.removeItem('itrax_token')
    localStorage.removeItem('itrax_user')
    setDropdownOpen(false)
    navigate('/login')
  }

  const handleProfile = () => {
    setDropdownOpen(false)
    navigate('/admin/profile')
  }

  return (
    <>
      {/* Glass Navbar */}
      <nav
        className="
          fixed top-0 left-0 right-0 z-50
          bg-[#050e3b] backdrop-blur-lg
          border-b border-white/10
          transition-all duration-300
        "
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="text-xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  ITraX
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              {MENU_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `
                    px-4 py-2 rounded-full
                    transition-all duration-300
                    font-medium text-sm
                    ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }
                    `
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Right Side - Icons & Avatar */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button
                className="
                  relative p-2
                  text-gray-300 hover:text-white
                  transition-colors duration-300
                  hover:bg-white/10 rounded-full
                "
              >
                <Bell size={20} />
                <span
                  className="
                    absolute top-1 right-1
                    w-2 h-2 bg-red-500 rounded-full
                  "
                />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="transition-transform duration-300 hover:scale-110"
                >
                  <Avatar name={userName} size="medium" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="
                      absolute right-0 mt-2 w-48
                      bg-slate-800/95 backdrop-blur-lg
                      border border-white/10 rounded-lg
                      shadow-xl shadow-black/50
                      overflow-hidden
                      animate-in fade-in zoom-in duration-200
                    "
                  >
                    <div className="p-4 border-b border-white/10">
                      <p className="text-white font-semibold text-sm">
                        {userName}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {user?.role || 'User'}
                      </p>
                    </div>

                    <button
                      onClick={handleProfile}
                      className="
                        w-full px-4 py-2 text-left
                        text-gray-300 hover:text-white
                        hover:bg-blue-600/30
                        transition-colors duration-200
                        flex items-center gap-3
                        text-sm
                      "
                    >
                      <User size={16} />
                      Profile
                    </button>

                    <button
                      onClick={handleLogout}
                      className="
                        w-full px-4 py-2 text-left
                        text-gray-300 hover:text-white
                        hover:bg-red-600/30
                        transition-colors duration-200
                        flex items-center gap-3
                        text-sm
                        border-t border-white/10
                      "
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden pb-4 space-y-2 border-t border-white/10 mt-2 pt-4">
              {MENU_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `
                    block px-4 py-2 rounded-full
                    transition-all duration-300
                    font-medium text-sm
                    ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }
                    `
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  )
}
