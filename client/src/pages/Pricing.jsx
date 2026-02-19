import React from 'react'

export default function Pricing(){
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold">Pricing</h1>
        <p className="text-slate-300 mt-2">Simple pricing — Free and Pro (Coming Soon)</p>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white/5 backdrop-blur rounded-lg">
            <h3 className="text-2xl font-semibold">Free</h3>
            <p className="mt-2 text-slate-300">Core features for small teams.</p>
            <div className="mt-4"><button className="px-4 py-2 bg-blue-500 rounded">Get Free</button></div>
          </div>
          <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900/40 rounded-lg">
            <h3 className="text-2xl font-semibold">Pro — $19.99/mo</h3>
            <p className="mt-2 text-slate-300">Advanced features & SLAs — Coming Soon</p>
            <div className="mt-4"><button onClick={()=>alert('Coming Soon')} className="px-4 py-2 border border-blue-400 rounded">Coming Soon</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}
