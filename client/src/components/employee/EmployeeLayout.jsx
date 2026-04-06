import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const navItems = [
	{ to: '/employee/assets', label: 'My Assets' },
	{ to: '/employee/orders', label: 'My Orders' },
	{ to: '/employee/licenses', label: 'Licenses' },
	{ to: '/employee/categories', label: 'Categories' },
	{ to: '/employee/reports', label: 'Reports' },
	{ to: '/employee/profile', label: 'Profile' },
]

export default function EmployeeLayout() {
	const navigate = useNavigate()

	const logout = () => {
		localStorage.removeItem('itrax_token')
		localStorage.removeItem('itrax_user')
		navigate('/login')
	}

	return (
		<div className="min-h-screen bg-slate-100 text-slate-900">
			<div className="border-b border-slate-200 bg-white px-6 py-4">
				<div className="mx-auto flex max-w-7xl items-center justify-between">
					<h1 className="text-xl font-bold">Employee Portal</h1>
					<button
						onClick={logout}
						className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
					>
						Logout
					</button>
				</div>
			</div>

			<div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 md:grid-cols-[220px,1fr]">
				<aside className="rounded-lg border border-slate-200 bg-white p-3">
					<nav className="space-y-1">
						{navItems.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								className={({ isActive }) =>
									`block rounded-md px-3 py-2 text-sm font-medium ${
										isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
									}`
								}
							>
								{item.label}
							</NavLink>
						))}
					</nav>
				</aside>

				<section>
					<Outlet />
				</section>
			</div>
		</div>
	)
}
