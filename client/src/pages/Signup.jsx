import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Signup({ onSignup }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [err, setErr] = useState(null)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setErr(null)
    
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setErr('First and last name are required')
      return
    }
    if (!email.trim()) {
      setErr('Email is required')
      return
    }
    if (!password.trim()) {
      setErr('Password is required')
      return
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters')
      return
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password })
      })
      
      const data = await res.json()
      if (!res.ok) {
        return setErr(data.message || 'Signup failed')
      }
      
      localStorage.setItem('itrax_token', data.token)
      localStorage.setItem('itrax_user', JSON.stringify(data.user))
      onSignup && onSignup(data.user)
      if (data.user.role === 'ADMIN') nav('/admin/assets')
      else nav('/employee/my-assets')
    } catch (err) {
      console.error('Signup error:', err)
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Account</h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input 
                value={firstName} 
                onChange={e=>setFirstName(e.target.value)} 
                placeholder="John" 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input 
                value={lastName} 
                onChange={e=>setLastName(e.target.value)} 
                placeholder="Doe" 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
              />
            </div>
          </div>
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
          <button className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 mt-6">Sign Up</button>
        </form>
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">Already have an account? <button type="button" onClick={()=>nav('/login')} className="text-blue-600 font-semibold hover:underline">Login</button></p>
        </div>
      </div>
    </div>
  )
}
