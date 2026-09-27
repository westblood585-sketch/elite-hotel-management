import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import HousekeeperLayout from '@/layouts/HousekeeperLayout'
import AdminProtectedRoute from '@/layouts/AdminProtectedRoute'

// Correct path to new Housekeeper pages (we will create these next)
const Dashboard = React.lazy(() => import('@/pages/Housekeeper/Dashboard'))
const Profile = React.lazy(() => import('@/pages/Profile'))

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
  </div>
)

const HousekeeperRoute: React.FC = () => {
  return (
    <AdminProtectedRoute allowedRoles={['housekeeper', 'admin']}>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HousekeeperLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Suspense>
    </AdminProtectedRoute>
  )
}

export default HousekeeperRoute
