import React, { useEffect, useState } from 'react'
import employeeService from '../../services/employeeService'

export default function EmployeeCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const body = await employeeService.getCategories({ limit: 100 })
        setCategories(body?.data || [])
      } catch {
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const sendRequest = async (requestType, categoryName) => {
    const note = window.prompt(`Add note for ${requestType.toLowerCase()} request in ${categoryName} (optional):`, '') || ''
    setRequesting(`${requestType}_${categoryName}`)
    setMessage(null)
    try {
      await employeeService.createCategoryRequest({ requestType, categoryName, note })
      setMessage({ type: 'success', text: `${requestType} request sent for ${categoryName}.` })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit request' })
    } finally {
      setRequesting(null)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-2xl font-bold text-slate-900">Categories</h2>
      <p className="mt-1 text-sm text-slate-600">Browse available asset categories.</p>

      {message && (
        <div className={`mt-3 rounded-md px-3 py-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-slate-500">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="mt-6 text-slate-500">No categories found.</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {categories.map((c) => (
            <div key={c._id} className="rounded-md border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-800">{c.name || '-'}</div>
              <div className="text-xs text-slate-500">{c.description || 'No description'}</div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => sendRequest('ASSET', c.name || 'Category')}
                  disabled={Boolean(requesting)}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Request Asset
                </button>
                <button
                  onClick={() => sendRequest('LICENSE', c.name || 'Category')}
                  disabled={Boolean(requesting)}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  Request License
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
