// layouts/AuthLayout.tsx
import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store/store'

const AuthLayout: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user?.role === 'receptionist') return <Navigate to="/receptionist/dashboard" replace />
    if (user?.role === 'housekeeper') return <Navigate to="/housekeeper/dashboard" replace />
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  )
}

export default AuthLayout
