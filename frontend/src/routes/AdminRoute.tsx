import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminLayout from '@/layouts/AdminLayout'
import AdminProtectedRoute from '@/layouts/AdminProtectedRoute'

// Lazy load admin components
const Dashboard = React.lazy(() => import('@pages/Admin/Dashboard'))
const AdminRooms = React.lazy(() => import('@pages/Admin/Rooms'))
const AdminReservations = React.lazy(() => import('@pages/Admin/Reservations'))
const AdminUsers = React.lazy(() => import('@pages/Admin/Users'))
const AdminSettings = React.lazy(() => import('@pages/Admin/Settings'))
const AdminGuests = React.lazy(() => import('@pages/Admin/Guests'))
const RoomDetail = React.lazy(() => import('@/pages/Admin/RoomDetail'))
const RoomForm = React.lazy(() => import('@/pages/Admin/RoomForm'))
const Billing = React.lazy(() => import('@/pages/Admin/Billing'))
const Payments = React.lazy(() => import('@/pages/Admin/Payments'))
const Housekeeping = React.lazy(() => import('@/pages/Admin/Housekeeping'))
const Communications = React.lazy(() => import('@/pages/Admin/CommunicationsDashboard'))
const Profile = React.lazy(() => import('@/pages/Admin/Profile'))
const DeskBooking = React.lazy(() => import('@/pages/Admin/DeskBooking'))

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

const AdminRoute: React.FC = () => {
  return (
    <AdminProtectedRoute allowedRoles={['admin']}>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<AdminLayout />}>
            {/* Role-based dashboard - automatically renders correct dashboard based on user role */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="desk-booking" element={<DeskBooking />} />
            
            <Route path="rooms" element={<AdminRooms />} />
            <Route path="rooms/new" element={<RoomForm />} />
            <Route path="rooms/edit/:id" element={<RoomForm />} />
            <Route path="rooms/:id" element={<RoomDetail />} />
            <Route path="reservations" element={<AdminReservations />} />
            <Route path="billing" element={<Billing />} />
            <Route path="payments" element={<Payments />} />
            <Route path="housekeeping" element={<Housekeeping />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="guests" element={<AdminGuests />} />
            <Route path="communications" element={<Communications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Suspense>
    </AdminProtectedRoute>
  )
}

export default AdminRoute
