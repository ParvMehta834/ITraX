import React, { useEffect, useState } from 'react'

export default function Notifications(){
  const [list, setList] = useState([])
  useEffect(()=>{ fetchNotifs() }, [])
  async function fetchNotifs(){
    const token = localStorage.getItem('itrax_token')
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return
    const data = await res.json()
    setList(data.data || [])
  }
  const unread = list.filter(n=>!n.read).length
  return (
    <div className="relative">
      <button className="p-2 rounded hover:bg-slate-800">🔔{unread>0 && <span className="ml-1 text-xs bg-red-500 px-2 rounded-full">{unread}</span>}</button>
      <div className="absolute right-0 mt-2 w-80 bg-slate-900/80 p-2 rounded shadow">
        {list.length===0 && <div className="text-slate-400 p-2">No notifications</div>}
        {list.map(n=> (
          <div key={n._id} className={`p-2 ${n.read? 'opacity-60':'bg-slate-800/50'} rounded mb-1`}>
            <div className="font-semibold">{n.title}</div>
            <div className="text-slate-300 text-sm">{n.message}</div>
          </div>
        ))}
        <div className="text-right mt-2"><a href="#" className="text-blue-400">View all</a></div>
      </div>
    </div>
  )
}
