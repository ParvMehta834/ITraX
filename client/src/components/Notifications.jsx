import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import apiClient from '../services/apiClient'
import { buildApiUrl } from '../utils/apiUrl'

export default function Notifications({ variant = 'dark' }) {
  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)
  const [popups, setPopups] = useState([])
  const seenIds = useRef(new Set())
  const wrapperRef = useRef(null)

  const unread = useMemo(() => list.filter((n) => !n.read).length, [list])

  const fetchNotifs = async () => {
    try {
      const res = await apiClient.get(buildApiUrl('/notifications'))
      const next = res?.data?.data || []
      setList(next)

      const newOnes = next.filter((item) => !seenIds.current.has(item._id))
      newOnes.forEach((item) => seenIds.current.add(item._id))

      const unreadNew = newOnes.filter((item) => !item.read)
      if (unreadNew.length > 0) {
        setPopups((prev) => {
          const merged = [...unreadNew.map((n) => ({ ...n, popupId: `popup_${n._id}_${Date.now()}` })), ...prev]
          return merged.slice(0, 4)
        })
      }
    } catch {
      // noop
    }
  }

  useEffect(() => {
    fetchNotifs()
    const timer = setInterval(fetchNotifs, 15000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (popups.length === 0) return
    const timer = setTimeout(() => {
      setPopups((prev) => prev.slice(0, Math.max(0, prev.length - 1)))
    }, 5000)
    return () => clearTimeout(timer)
  }, [popups])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (open && wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const markRead = async (id) => {
    try {
      await apiClient.patch(buildApiUrl(`/notifications/${id}/read`))
      setList((prev) => prev.map((item) => (item._id === id ? { ...item, read: true } : item)))
    } catch {
      // noop
    }
  }

  const markAllRead = async () => {
    try {
      await apiClient.patch(buildApiUrl('/notifications/read-all'))
      setList((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch {
      // noop
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative rounded-full p-2 transition-colors duration-300 ${
          variant === 'light'
            ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            : 'text-gray-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] px-1.5 h-[18px] text-[11px] bg-red-500 text-white rounded-full flex items-center justify-center font-semibold">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-h-[420px] overflow-y-auto bg-white text-gray-900 border border-gray-200 rounded-lg shadow-xl z-50">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
            <span className="font-semibold">Notifications</span>
            {list.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-blue-700 hover:text-blue-900"
              >
                Mark all as read
              </button>
            )}
          </div>
          {list.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">No notifications</div>
          ) : (
            <div className="p-2 space-y-2">
              {list.map((n) => (
                <button
                  key={n._id}
                  onClick={() => markRead(n._id)}
                  className={`w-full text-left p-3 rounded-md border ${n.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}
                >
                  <div className="text-sm font-semibold text-gray-900">{n.title}</div>
                  <div className="text-xs text-gray-700 mt-0.5">{n.message}</div>
                  <div className="text-[11px] text-gray-500 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="fixed top-20 right-4 z-[60] space-y-2">
        {popups.map((item) => (
          <div key={item.popupId} className="w-[320px] rounded-md border border-blue-200 bg-white shadow-lg p-3">
            <div className="text-sm font-semibold text-gray-900">{item.title}</div>
            <div className="text-xs text-gray-700 mt-1">{item.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
