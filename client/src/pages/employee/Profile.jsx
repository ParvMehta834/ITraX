import React, { useEffect, useState } from 'react'
import employeeService from '../../services/employeeService'
import { getAuthUser, setAuthSession } from '../../utils/authStorage'

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', department: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const body = await employeeService.getProfile()
        const user = body?.user || null
        setProfile(user)
        setForm({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          phone: user?.phone || '',
          department: user?.department || '',
          password: ''
        })
      } catch {
        setProfile(null)
      }
    }

    load()
  }, [])

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
        department: form.department,
        ...(form.password.trim() ? { password: form.password } : {})
      }
      const result = await employeeService.updateProfile(payload)
      const user = result?.user || profile
      setProfile(user)
      setForm((prev) => ({ ...prev, password: '' }))

      const existing = getAuthUser() || {}
      setAuthSession({ user: { ...existing, ...user, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() } })

      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
      {!profile ? (
        <p className="mt-6 text-slate-500">Profile unavailable.</p>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">First Name</label>
              <input name="firstName" value={form.firstName} onChange={onChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
              <input name="lastName" value={form.lastName} onChange={onChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input value={profile.email || ''} readOnly className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={onChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
              <input name="department" value={form.department} onChange={onChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">New Password (optional)</label>
            <input name="password" type="password" value={form.password} onChange={onChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900" />
          </div>

          {message && (
            <div className={`rounded-md px-3 py-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div>
            <button onClick={onSave} disabled={saving} className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
