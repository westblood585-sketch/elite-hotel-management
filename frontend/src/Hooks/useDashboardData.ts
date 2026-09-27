import { useEffect } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { dashboardApi, type AdminDashboardData, type ReceptionistDashboardData, type HousekeeperDashboardData } from '@/services/dashboardApi';

type DashboardRole = 'admin' | 'receptionist' | 'housekeeper';

/**
 * Hook to fetch dashboard data based on user role
 * Implements role-specific caching and refetch strategies
 */
export function useDashboardData(role: DashboardRole) {
  const query = useQuery({
    queryKey: ['dashboard', role],
    queryFn: () => {
      switch (role) {
        case 'admin':
          return dashboardApi.getAdminDashboard();
        case 'receptionist':
          return dashboardApi.getReceptionistDashboard();
        case 'housekeeper':
          return dashboardApi.getHousekeeperDashboard();
      }
    },
    // Role-specific configurations
    refetchInterval: role === 'receptionist' ? 30000 : 60000, // Receptionist: 30s, others: 60s
    staleTime: role === 'admin' ? 120000 : 30000, // Admin data can be older
    retry: 2,
    refetchOnWindowFocus: role !== 'admin', // Admin doesn't need constant refetch
  });

  // Error logging side effect (replaces deprecated onError)
  useEffect(() => {
    if (query.isError) {
      console.error(`[Dashboard] Failed to fetch ${role} dashboard:`, query.error);
    }
  }, [query.isError, query.error, role]);

  return query;
}

/**
 * Hook specifically for admin dashboard with proper typing
 */
export function useAdminDashboard(options?: Omit<UseQueryOptions<AdminDashboardData>, 'queryKey' | 'queryFn'>) {
  return useQuery<AdminDashboardData>({
    queryKey: ['dashboard', 'admin'],
    queryFn: dashboardApi.getAdminDashboard,
    refetchInterval: 60000, // 1 minute
    staleTime: 120000, // 2 minutes
    retry: 2,
    ...options,
  });
}

/**
 * Hook specifically for receptionist dashboard with proper typing
 */
export function useReceptionistDashboard(options?: Omit<UseQueryOptions<ReceptionistDashboardData>, 'queryKey' | 'queryFn'>) {
  return useQuery<ReceptionistDashboardData>({
    queryKey: ['dashboard', 'receptionist'],
    queryFn: dashboardApi.getReceptionistDashboard,
    refetchInterval: 30000, // 30 seconds - more frequent for operational data
    staleTime: 30000,
    retry: 2,
    refetchOnWindowFocus: true,
    ...options,
  });
}

/**
 * Hook specifically for housekeeper dashboard with proper typing
 */
export function useHousekeeperDashboard(options?: Omit<UseQueryOptions<HousekeeperDashboardData>, 'queryKey' | 'queryFn'>) {
  return useQuery<HousekeeperDashboardData>({
    queryKey: ['dashboard', 'housekeeper'],
    queryFn: dashboardApi.getHousekeeperDashboard,
    refetchInterval: 45000, // 45 seconds
    staleTime: 30000,
    retry: 2,
    refetchOnWindowFocus: true,
    ...options,
  });
}
