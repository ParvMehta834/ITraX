import React, { useEffect, useState } from 'react'
import employeeService from '../../services/employeeService'

export default function EmployeeOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        let currentUser = null
        try {
          currentUser = JSON.parse(localStorage.getItem('itrax_user') || 'null')
        } catch {
          currentUser = null
        }

        const body = await employeeService.getOrders({
          limit: 100,
          employeeId: currentUser?.id,
          employeeCode: currentUser?.employeeCode,
          employeeName: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()
        })
        setOrders(body?.data || [])
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
      <p className="mt-1 text-sm text-slate-600">Track current procurement orders.</p>

      {loading ? (
        <p className="mt-6 text-slate-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-slate-500">No orders found.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="rounded-md border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-800">{order.orderId || 'Order'}</div>
              <div className="text-sm text-slate-700">{order.assetName || '-'} • Qty: {order.quantity || 0}</div>
              <div className="text-xs text-slate-500">Status: {order.status || '-'} | Supplier: {order.supplier || '-'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
