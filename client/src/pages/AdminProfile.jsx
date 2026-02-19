import React from 'react'
import Avatar from '../components/Avatar'

export default function AdminProfile() {
  const user = JSON.parse(localStorage.getItem('itrax_user') || '{"name":"User"}')

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
            value={user?.name || ''}
            readOnly
            className="w-full px-4 py-2 bg-slate-50 rounded-lg text-slate-900 border border-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
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

        <div className="pt-4 border-t border-slate-200">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
}
