import React, { useEffect, useState } from 'react'

export default function EmployeeAssets(){
  const [assets, setAssets] = useState([])
  useEffect(()=>{fetchAssets()}, [])
  async function fetchAssets(){
    const token = localStorage.getItem('itrax_token')
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/employee/assets`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return setAssets([])
    const data = await res.json()
    setAssets(data.data || [])
  }
  return (
    <div>
      <h2 className="text-2xl font-semibold">My Assets</h2>
      <div className="mt-4 bg-slate-900/40 p-4 rounded">
        {assets.length===0 && <div className="text-slate-400">No assigned assets</div>}
        <ul className="space-y-2">
          {assets.map(a=> <li key={a._id} className="p-3 bg-slate-800 rounded">{a.assetId} — {a.model} ({a.status})</li>)}
        </ul>
      </div>
    </div>
  )
}
