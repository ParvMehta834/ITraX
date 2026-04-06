import React, { useEffect, useState } from 'react'
import employeeService from '../../services/employeeService'

export default function EmployeeLicensesPage() {
  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const body = await employeeService.getLicenses({ limit: 100 })
        setLicenses(body?.data || [])
      } catch {
        setLicenses([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-2xl font-bold text-slate-900">Licenses</h2>
      <p className="mt-1 text-sm text-slate-600">View software licenses and renewals.</p>

      {loading ? (
        <p className="mt-6 text-slate-500">Loading...</p>
      ) : licenses.length === 0 ? (
        <p className="mt-6 text-slate-500">No licenses found.</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {licenses.map((item) => (
            <div key={item._id} className="rounded-md border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-800">{item.name || '-'}</div>
              <div className="text-xs text-slate-500">Vendor: {item.vendor || '-'}</div>
              <div className="text-xs text-slate-500">Status: {item.status || '-'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
