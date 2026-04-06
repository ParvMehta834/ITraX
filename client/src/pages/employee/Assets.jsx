import React, { useEffect, useMemo, useState } from 'react'
import employeeService from '../../services/employeeService'

export default function EmployeeAssetsPage() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('itrax_user') || 'null')
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const body = await employeeService.getAssets({ limit: 200 })
        const rows = body?.data || []
        const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()
        const mine = rows.filter((a) => {
          if (!fullName) return true
          return String(a.currentEmployee || '').trim().toLowerCase() === fullName.toLowerCase()
        })
        setAssets(mine)
      } catch {
        setAssets([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [currentUser])

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-2xl font-bold text-slate-900">My Assets</h2>
      <p className="mt-1 text-sm text-slate-600">Assets currently assigned to you.</p>

      {loading ? (
        <p className="mt-6 text-slate-500">Loading...</p>
      ) : assets.length === 0 ? (
        <p className="mt-6 text-slate-500">No assets assigned yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2">Asset ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Location</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset._id} className="border-b border-slate-100 text-sm text-slate-700">
                  <td className="px-3 py-2">{asset.assetId || asset.assetTag || '-'}</td>
                  <td className="px-3 py-2">{asset.name || '-'}</td>
                  <td className="px-3 py-2">{asset.category || '-'}</td>
                  <td className="px-3 py-2">{asset.status || '-'}</td>
                  <td className="px-3 py-2">{asset.currentLocation || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
