import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from "@/redux/store/store";
import AdminDashboard from '@/pages/Admin/Dashboard';
import ReceptionistDashboard from '@/pages/Admin/ReceptionistDashboard';
import HousekeeperDashboard from '@/pages/Housekeeper/Dashboard';

/**
 * Role-based dashboard router
 * Renders the appropriate dashboard based on user's role
 */
const RoleBasedDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Default to admin dashboard if role is undefined or unknown
  const role = user?.role?.toLowerCase();

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'receptionist':
      return <ReceptionistDashboard />;
    case 'housekeeper':
      return <HousekeeperDashboard />;
    default:
      // Fallback to admin dashboard
      return <AdminDashboard />;
  }
};

export default RoleBasedDashboard;
