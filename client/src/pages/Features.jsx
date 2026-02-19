import React from 'react'
import { Cpu, Box, FileText, Bell, Users } from 'lucide-react'

export default function Features(){
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold">Features</h1>
        <p className="text-slate-300 mt-2">Everything a growing team needs to manage IT assets.</p>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/5 backdrop-blur rounded-lg"><div className="flex items-center space-x-3"><Cpu className="text-blue-400"/><div><div className="font-semibold">Asset Tracking</div><div className="text-slate-400 text-sm">Full assignment history and status</div></div></div></div>
          <div className="p-6 bg-white/5 backdrop-blur rounded-lg"><div className="flex items-center space-x-3"><Box className="text-blue-400"/><div><div className="font-semibold">Inventory</div><div className="text-slate-400 text-sm">Stock levels, low alerts, locations</div></div></div></div>
          <div className="p-6 bg-white/5 backdrop-blur rounded-lg"><div className="flex items-center space-x-3"><FileText className="text-blue-400"/><div><div className="font-semibold">Reports</div><div className="text-slate-400 text-sm">Export CSV, custom filters</div></div></div></div>
          <div className="p-6 bg-white/5 backdrop-blur rounded-lg"><div className="flex items-center space-x-3"><Bell className="text-blue-400"/><div><div className="font-semibold">Notifications</div><div className="text-slate-400 text-sm">DB-backed notifications</div></div></div></div>
          <div className="p-6 bg-white/5 backdrop-blur rounded-lg"><div className="flex items-center space-x-3"><Users className="text-blue-400"/><div><div className="font-semibold">Role-based Access</div><div className="text-slate-400 text-sm">Admin & Employee roles</div></div></div></div>
        </div>
      </div>
    </div>
  )
}
