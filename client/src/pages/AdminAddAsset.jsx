import React, { useState } from 'react'

export default function AdminAddAsset(){
  const [assetId, setAssetId] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState(null)

  async function submit(e){
    e.preventDefault();
    const fd = new FormData();
    fd.append('assetId', assetId);
    fd.append('manufacturer', manufacturer);
    fd.append('model', model);
    if (file) fd.append('image', file);
    const token = localStorage.getItem('itrax_token')
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/assets`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const data = await res.json()
    if (res.ok) setMsg('Asset created')
    else setMsg(data.message || 'Error')
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold">Add Asset</h2>
      <form onSubmit={submit} className="mt-4 bg-slate-900/40 p-4 rounded space-y-3">
        <input value={assetId} onChange={e=>setAssetId(e.target.value)} placeholder="Asset ID" className="w-full p-2 rounded bg-slate-800" />
        <input value={manufacturer} onChange={e=>setManufacturer(e.target.value)} placeholder="Manufacturer" className="w-full p-2 rounded bg-slate-800" />
        <input value={model} onChange={e=>setModel(e.target.value)} placeholder="Model" className="w-full p-2 rounded bg-slate-800" />
        <input type="file" onChange={e=>setFile(e.target.files[0])} />
        <div><button className="px-4 py-2 bg-blue-500 rounded">Create</button></div>
        {msg && <div className="text-slate-300">{msg}</div>}
      </form>
    </div>
  )
}
