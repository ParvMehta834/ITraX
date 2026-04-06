import React, { useEffect, useState } from 'react'
import employeeService from '../../services/employeeService'
import reportsService from '../../services/reportsService'

export default function EmployeeReportsPage() {
  const [summary, setSummary] = useState({ assets: 0, orders: 0, licenses: 0, categories: 0 })
  const [recentAssets, setRecentAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [issues, setIssues] = useState([])
  const [message, setMessage] = useState(null)

  const fetchIssueReports = async () => {
    setIssuesLoading(true)
    try {
      const payload = await reportsService.getIssueReports()
      setIssues(payload?.data || [])
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load your reports' })
    } finally {
      setIssuesLoading(false)
    }
  }

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      try {
        let currentUser = null
        try {
          currentUser = JSON.parse(localStorage.getItem('itrax_user') || 'null')
        } catch {
          currentUser = null
        }

        const [assetsBody, ordersBody, licensesBody, categoriesBody] = await Promise.all([
          employeeService.getAssets({ limit: 200 }),
          employeeService.getOrders({
            limit: 200,
            employeeId: currentUser?.id,
            employeeCode: currentUser?.employeeCode,
            employeeName: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()
          }),
          employeeService.getLicenses({ limit: 200 }),
          employeeService.getCategories({ limit: 200 }),
        ])

        const assets = assetsBody?.data || []
        const orders = ordersBody?.data || []
        const licenses = licensesBody?.data || []
        const categories = categoriesBody?.data || []

        setSummary({
          assets: assets.length,
          orders: orders.length,
          licenses: licenses.length,
          categories: categories.length,
        })
        setRecentAssets(assets.slice(0, 5))
      } catch (err) {
        setSummary({ assets: 0, orders: 0, licenses: 0, categories: 0 })
        setRecentAssets([])
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
    fetchIssueReports()
  }, [])

  const submitIssue = async (e) => {
    e.preventDefault()
    const trimmed = description.trim()
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Please write your report description first.' })
      return
    }

    setSubmitting(true)
    try {
      await reportsService.createIssueReport({ description: trimmed })
      setDescription('')
      setMessage({ type: 'success', text: 'Report submitted to admin successfully.' })
      fetchIssueReports()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit report' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employee Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Quick snapshot of your workspace data.</p>
      </div>

      {loading ? (
        <div className="mt-6 text-slate-500">Loading...</div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">Assets</p><p className="text-2xl font-bold text-slate-900">{summary.assets}</p></div>
            <div className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">Orders</p><p className="text-2xl font-bold text-slate-900">{summary.orders}</p></div>
            <div className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">Licenses</p><p className="text-2xl font-bold text-slate-900">{summary.licenses}</p></div>
            <div className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">Categories</p><p className="text-2xl font-bold text-slate-900">{summary.categories}</p></div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Assets</h2>
            {recentAssets.length === 0 ? (
              <p className="mt-2 text-slate-500">No recent assets.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {recentAssets.map((asset) => (
                  <li key={asset._id} className="text-sm text-slate-700">
                    {asset.assetId || asset.assetTag || 'Asset'} - {asset.status || 'Unknown'}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-900">Submit Report To Admin</h2>
            <p className="mt-1 text-sm text-slate-600">Write your issue or request. Admin will review and send feedback.</p>

            <form onSubmit={submitIssue} className="mt-3 space-y-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your issue..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>

            {message && (
              <div className={`mt-3 rounded-md px-3 py-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-900">My Submitted Reports</h2>
            {issuesLoading ? (
              <p className="mt-2 text-slate-500">Loading your reports...</p>
            ) : issues.length === 0 ? (
              <p className="mt-2 text-slate-500">No submitted reports yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {issues.map((issue) => (
                  <div key={issue._id} className="rounded-md border border-slate-200 p-3 bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${issue.status === 'SOLVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {issue.status === 'SOLVED' ? 'Solved' : 'Open'}
                      </span>
                      <span className="text-xs text-slate-500">{issue.createdAt ? new Date(issue.createdAt).toLocaleString() : ''}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{issue.description}</p>
                    <div className="mt-2 rounded-md border border-slate-200 bg-white p-2">
                      <p className="text-xs font-medium text-slate-600">Admin Feedback</p>
                      <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{issue.adminFeedback || 'No feedback yet'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
