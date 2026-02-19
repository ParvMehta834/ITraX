import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../components/Toast'

export default function AssetDetail(){
  const { id } = useParams()
  const [asset, setAsset] = useState(null)
  const [employeeId, setEmployeeId] = useState('')
  const toast = useToast()
  useEffect(()=>{ fetchAsset() }, [id])
  async function fetchAsset(){
    const token = localStorage.getItem('itrax_token')
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/assets`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    const a = data.data.find(x=> x._id === id)
    setAsset(a)
  }
  async function reassign(){
    const token = localStorage.getItem('itrax_token')
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/assets/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentEmployeeId: employeeId }) })
    const data = await res.json()
    if (res.ok){ toast.push('Reassigned'); setAsset(data.asset) }
    else toast.push(data.message || 'Error')
  }
  if (!asset) return <div>Loading...</div>
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold">{asset.assetId} — {asset.model}</h2>
      <div className="mt-4 bg-slate-900/40 p-4 rounded">
        <div>Manufacturer: {asset.manufacturer}</div>
        <div>Status: {asset.status}</div>
        <div>Location: {asset.currentLocationId}</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="EmployeeId to assign" className="p-2 bg-slate-800 rounded" />
          <button onClick={reassign} className="px-4 py-2 bg-blue-500 rounded col-span-2">Reassign</button>
        </div>
      </div>
    </div>
  )
}
