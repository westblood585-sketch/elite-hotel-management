import type { RootState } from '@/redux/store/store'
import type { ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

interface AdminProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
}

const AdminProtectedRoute = ({ children, allowedRoles = ['admin', 'receptionist', 'housekeeper'] }: AdminProtectedRouteProps) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />
  }

  // Check if user has admin or staff role
  if (!allowedRoles.includes(user?.role || '')) {
     // If user is authenticated but doesn't have the right role, 
     // redirect them to their own authorized dashboard or home
     if (user?.role === 'receptionist') return <Navigate to="/receptionist/dashboard" replace />
     if (user?.role === 'housekeeper') return <Navigate to="/housekeeper/dashboard" replace />
     if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
     
     return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default AdminProtectedRoute
