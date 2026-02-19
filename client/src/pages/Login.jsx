import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setErr(null)
    
    // Validation
    if (!email.trim()) {
      setErr('Email is required')
      return
    }
    if (!password.trim()) {
      setErr('Password is required')
      return
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })
      
      const data = await res.json()
      if (!res.ok) {
        return setErr(data.message || 'Login failed')
      }
      
      localStorage.setItem('itrax_token', data.token)
      localStorage.setItem('itrax_user', JSON.stringify(data.user))
      onLogin && onLogin(data.user)
      if (data.user.role === 'ADMIN') nav('/admin/assets')
      else nav('/employee/my-assets')
    } catch (err) {
      console.error('Login error:', err)
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setErr('Cannot connect to server. Make sure the backend is running on http://localhost:4000')
      } else {
        setErr(err.message || 'Network error - please try again')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Login</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              placeholder="your@email.com" 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
            />
          </div>
          {err && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{err}</div>}
          <button className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 mt-6">Login</button>
        </form>
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">Don't have an account? <button type="button" onClick={()=>nav('/signup')} className="text-blue-600 font-semibold hover:underline">Sign up</button></p>
        </div>
      </div>
    </div>
  )
}
