import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminAssets from './pages/AdminAssets'
import EmployeeAssets from './pages/EmployeeAssets'
import AdminLayout from './components/AdminLayout'
import AdminEmployees from './pages/AdminEmployees'
import AdminAddAsset from './pages/AdminAddAsset'
import AdminCategories from './pages/AdminCategories'
import AdminLocations from './pages/AdminLocations'
import AdminInventory from './pages/AdminInventory'
import AdminLicenses from './pages/AdminLicenses'
import AdminReports from './pages/AdminReports'
import AssetDetail from './pages/AssetDetail'
import Tracking from './pages/Tracking'
import AdminProfile from './pages/AdminProfile'
import ToastProvider from './components/Toast'

function useAuth() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    const raw = localStorage.getItem('itrax_user')
    if (raw) setUser(JSON.parse(raw))
  }, [])
  return { user, setUser }
}

function App() {
  const auth = useAuth()
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('itrax_token')
    localStorage.removeItem('itrax_user')
    auth.setUser(null)
    navigate('/')
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* show global nav on non-home pages only; home has its own floating menubar */}
      {useLocation().pathname !== '/' && (
        <nav className="p-4 flex justify-between items-center">
          <div className="text-2xl font-bold">ITraX</div>
          <div className="space-x-4">
            <Link to="/">Home</Link>
            {!auth.user && <Link to="/login">Login</Link>}
            {!auth.user && <Link to="/signup">Get Started</Link>}
            {auth.user && auth.user.role === 'ADMIN' && <Link to="/admin/assets">Admin</Link>}
            {auth.user && auth.user.role === 'EMPLOYEE' && <Link to="/employee/my-assets">My Assets</Link>}
            {auth.user && <button onClick={logout} className="ml-2">Logout</button>}
          </div>
        </nav>
      )}

      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login onLogin={auth.setUser} />} />
          <Route path="/signup" element={<Signup onSignup={auth.setUser} />} />
          <Route path="/admin" element={auth.user && auth.user.role === 'ADMIN' ? <AdminLayout /> : <Navigate to="/login" replace />}>
            <Route path="assets" element={<AdminAssets />} />
            <Route path="assets/add" element={<AdminAddAsset />} />
            <Route path="assets/:id" element={<AssetDetail />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="locations" element={<AdminLocations />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="licenses" element={<AdminLicenses />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="tracking" element={<Tracking />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
          <Route path="/employee/my-assets" element={auth.user && auth.user.role === 'EMPLOYEE' ? <EmployeeAssets /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
      </div>
    </ToastProvider>
  )
}

export default App
