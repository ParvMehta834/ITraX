import React, { useMemo, useState } from 'react'
import Avatar from '../components/Avatar'
import employeeService from '../services/employeeService'
import { getAuthUser, setAuthSession } from '../utils/authStorage'

export default function AdminProfile() {
  const user = useMemo(() => {
    return getAuthUser() || { name: 'User' }
  }, [])

  const [form, setForm] = useState({
    firstName: user?.firstName || (user?.name || '').split(' ')[0] || '',
    lastName: user?.lastName || (user?.name || '').split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        ...(form.password.trim() ? { password: form.password } : {})
      }

      const result = await employeeService.updateProfile(payload)
      const updatedUser = result?.user || {}
      setAuthSession({ user: { ...user, ...updatedUser, name: `${updatedUser.firstName || form.firstName} ${updatedUser.lastName || form.lastName}`.trim() } })
      setForm((prev) => ({ ...prev, password: '' }))
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-6 mb-6">
          <Avatar name={user?.name || 'User'} size="large" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {user?.name || 'User'}
            </h1>
            <p className="text-slate-600 text-lg">
              {user?.role || 'Administrator'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Full Name
          </label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={onChange}
            className="w-full px-4 py-2 bg-white rounded-lg text-slate-900 border border-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={onChange}
            className="w-full px-4 py-2 bg-white rounded-lg text-slate-900 border border-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            readOnly
            className="w-full px-4 py-2 bg-slate-50 rounded-lg text-slate-900 border border-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Role
          </label>
          <input
            type="text"
            value={user?.role || ''}
            readOnly
            className="w-full px-4 py-2 bg-slate-50 rounded-lg text-slate-900 border border-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Phone
          </label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={onChange}
            className="w-full px-4 py-2 bg-white rounded-lg text-slate-900 border border-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            New Password (optional)
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="Leave blank to keep current password"
            className="w-full px-4 py-2 bg-white rounded-lg text-slate-900 border border-slate-200"
          />
        </div>

        {message && (
          <div className={`text-sm px-4 py-2 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
