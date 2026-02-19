import React from 'react'
import { Outlet } from 'react-router-dom'
import GlassNavbar from './GlassNavbar'

export default function AdminLayout(){
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white pt-20">
      {/* Glass Navbar */}
      <GlassNavbar />

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </div>
    </div>
  )
}
