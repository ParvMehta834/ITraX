import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminAssets from './pages/AdminAssets'
import EmployeeAssets from './pages/EmployeeAssets'
import EmployeeLayout from './components/employee/EmployeeLayout'
import EmployeeAssetsPage from './pages/employee/Assets'
import EmployeeOrdersPage from './pages/employee/Orders'
import EmployeeLicensesPage from './pages/employee/Licenses'
import EmployeeCategoriesPage from './pages/employee/Categories'
import EmployeeReportsPage from './pages/employee/Reports'
import EmployeeProfilePage from './pages/employee/Profile'
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
import { clearAuthSession, getAuthUser } from './utils/authStorage'

const readStoredUser = () => {
  return getAuthUser()
}

function useAuth() {
  const [user, setUser] = useState(null)
  const [isReady, setIsReady] = useState(false)
  useEffect(() => {
    setUser(readStoredUser())
    setIsReady(true)
  }, [])
  return { user, setUser, isReady }
}

function App() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const storedUser = readStoredUser()
  const currentUser = auth.user || storedUser
  const hideGlobalNavPaths = ['/login', '/signup']
  const isEmployeeArea = location.pathname.startsWith('/employee')
  const shouldShowGlobalNav = location.pathname !== '/' && !hideGlobalNavPaths.includes(location.pathname) && !isEmployeeArea

  const logout = () => {
    clearAuthSession()
    auth.setUser(null)
    navigate('/')
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* show global nav on non-home pages only; home has its own floating menubar */}
      {shouldShowGlobalNav && (
        <nav className="p-4 flex justify-between items-center">
          <div className="text-2xl font-bold">ITraX</div>
          <div className="space-x-4">
            <Link to="/">Home</Link>
            {!currentUser && <Link to="/login">Login</Link>}
            {!currentUser && <Link to="/signup">Get Started</Link>}
            {currentUser && currentUser.role === 'ADMIN' && <Link to="/admin/assets">Admin</Link>}
            {currentUser && currentUser.role === 'EMPLOYEE' && <Link to="/employee/assets">Employee</Link>}
            {currentUser && <button onClick={logout} className="ml-2">Logout</button>}
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
          <Route
            path="/admin"
            element={
              !auth.isReady
                ? <div className="text-gray-700">Loading...</div>
                : currentUser && currentUser.role === 'ADMIN'
                  ? <AdminLayout />
                  : <Navigate to="/login" />
            }
          >
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
          <Route
            path="/employee"
            element={
              !auth.isReady
                ? <div className="text-gray-700">Loading...</div>
                : currentUser && currentUser.role === 'EMPLOYEE'
                  ? <EmployeeLayout />
                  : <Navigate to="/login" />
            }
          >
            <Route index element={<Navigate to="assets" replace />} />
            <Route path="assets" element={<EmployeeAssetsPage />} />
            <Route path="orders" element={<EmployeeOrdersPage />} />
            <Route path="licenses" element={<EmployeeLicensesPage />} />
            <Route path="categories" element={<EmployeeCategoriesPage />} />
            <Route path="reports" element={<EmployeeReportsPage />} />
            <Route path="profile" element={<EmployeeProfilePage />} />
          </Route>
          <Route path="/employee/my-assets" element={<Navigate to="/employee/assets" />} />
        </Routes>
      </main>
      </div>
    </ToastProvider>
  )
}

export default App
