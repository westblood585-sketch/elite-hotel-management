// routes/UserRoute.tsx
import React, { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import SnapScrollLayout from '../layouts/SnapScrollLayout'

import SearchResults from '@/components/sections/SearchResult/SearchResult'

import OTPVerification from '@/pages/OtpVerification'
import ProtectedRoute from '@/layouts/ProtectedRoute'

// Lazy load components for better performance
// Lazy load components for better performance
const Home = React.lazy(() => import('../pages/Home'))
const Booking = React.lazy(() => import('../pages/Booking'))
const Rooms = React.lazy(() => import('../pages/Rooms'))
const Bookings = React.lazy(() => import('../pages/Bookings/Bookings'))
const BookingDetails = React.lazy(() => import('../pages/Bookings/BookingDetails'))
const FindBooking = React.lazy(() => import('../pages/Bookings/FindBooking'))
const SignIn = React.lazy(() => import('../pages/Signin'))
const SignUp = React.lazy(() => import('../pages/Signup'))
const Profile = React.lazy(() => import('../pages/Profile'))
const NotFound = React.lazy(() => import('../pages/NotFound'))
const ForgotPassword = React.lazy(() => import('../pages/ForgotPassword'))
const ResetPassword = React.lazy(() => import('../pages/ResetPassword'))

const UserRoute: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Home route with snap scrolling */}
        <Route path="/" element={<SnapScrollLayout />}>
          <Route index element={<Home />} />
        </Route>

        {/* Main layout routes (with Header/Footer, no snap scrolling) */}
        <Route path="/" element={<MainLayout />}>
          <Route path="rooms" element={<Rooms />} />
          
          <Route 
            path="bookings" 
            element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="bookings/:id" 
            element={
              <ProtectedRoute>
                <BookingDetails />
              </ProtectedRoute>
            } 
          />
          <Route path="find-booking" element={<FindBooking />} />

          <Route
            path="account/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/book/:roomId" element={<Booking />} />
        </Route>

        {/* Auth layout routes (without Header/Footer) */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="otp-verify" element={<OTPVerification />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default UserRoute
