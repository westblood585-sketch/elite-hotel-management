import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from '@/layouts/AdminLayout'
import AdminProtectedRoute from '@/layouts/AdminProtectedRoute'

// Lazy load components
const ReceptionistDashboard = React.lazy(() => import('@pages/Admin/ReceptionistDashboard'))
const AdminRooms = React.lazy(() => import('@pages/Admin/Rooms'))
const AdminReservations = React.lazy(() => import('@pages/Admin/Reservations'))
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

const ReceptionistRoute: React.FC = () => {
  return (
    <AdminProtectedRoute allowedRoles={['receptionist', 'admin']}>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<ReceptionistDashboard />} />
            <Route path="dashboard" element={<ReceptionistDashboard />} />
            <Route path="desk-booking" element={<DeskBooking />} />
            
            <Route path="rooms" element={<AdminRooms />} />
            <Route path="rooms/new" element={<RoomForm />} />
            <Route path="rooms/edit/:id" element={<RoomForm />} />
            <Route path="rooms/:id" element={<RoomDetail />} />
            <Route path="reservations" element={<AdminReservations />} />
            <Route path="billing" element={<Billing />} />
            <Route path="payments" element={<Payments />} />
            <Route path="housekeeping" element={<Housekeeping />} />
            <Route path="guests" element={<AdminGuests />} />
            <Route path="communications" element={<Communications />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Redirect legacy or unknown routes back to dashboard */}
            <Route path="*" element={<Navigate to="/receptionist/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </AdminProtectedRoute>
  )
}

export default ReceptionistRoute
