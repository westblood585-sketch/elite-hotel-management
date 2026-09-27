import { privateApi } from '@/services/instances/axiosConfig';

// Dashboard API service for aggregated data
export const dashboardApi = {
  /**
   * Get Admin Dashboard data
   * Aggregates financial, occupancy, user, and system health metrics
   */



  /**
   * Get Admin Dashboard data
   * Aggregates financial, occupancy, user, housekeeping, billing and system health metrics
   */
  getAdminDashboard: async (): Promise<AdminDashboardData> => {
    try {
      // Fetch data from multiple services in parallel
      const [
        occupancyRes,
        userRes,
        inventoryRes,
        revenueRes,
        billingRes,
        housekeepingRes
      ] = await Promise.allSettled([
        privateApi.get('/reservations/analytics/occupancy'),
        privateApi.get('/users/analytics/metrics'),
        privateApi.get('/rooms/analytics/inventory'),
        privateApi.get('/payments/analytics/revenue'),
        privateApi.get('/billing/analytics/status'),
        privateApi.get('/housekeeping/analytics/status')
      ]);

      // Helper to extract data or return null
      const extract = (res: PromiseSettledResult<any>) => 
        res.status === 'fulfilled' && res.value.data.success ? res.value.data.data : null;

      const occupancyData = extract(occupancyRes);
      const userData = extract(userRes);
      const inventoryData = extract(inventoryRes);
      const revenueData = extract(revenueRes);
      const billingData = extract(billingRes);
      const housekeepingData = extract(housekeepingRes);

      // System health estimation based on response success
      const systemHealth = {
        services: {
          payments: revenueRes.status === 'fulfilled' ? 'healthy' : 'degraded',
          billing: billingRes.status === 'fulfilled' ? 'healthy' : 'degraded',
          reservations: occupancyRes.status === 'fulfilled' ? 'healthy' : 'degraded',
          rooms: inventoryRes.status === 'fulfilled' ? 'healthy' : 'degraded',
          users: userRes.status === 'fulfilled' ? 'healthy' : 'degraded',
          housekeeping: housekeepingRes.status === 'fulfilled' ? 'healthy' : 'degraded',
          communication: 'healthy' // Not fetched yet
        },
        lastUpdated: new Date().toISOString()
      };

      return {
        financialMetrics: revenueData ? {
          totalRevenue: revenueData.totalRevenue || 0,
          pendingPayments: revenueData.pendingPayments || 0,
          pendingAmount: revenueData.pendingAmount || 0,
          refundedAmount: revenueData.refundedAmount || 0,
          averageTransactionValue: revenueData.averageTransactionValue || 0,
          revenueByPeriod: revenueData.revenueByPeriod || { today: 0, week: 0, month: 0, year: 0 }
        } : null,
        billingStatus: billingData || null,
        occupancyMetrics: occupancyData ? {
          ...occupancyData,
          totalRooms: inventoryData?.totalRooms || occupancyData.totalRooms,
          availableRooms: inventoryData?.totalRooms 
            ? inventoryData.totalRooms - (occupancyData.occupiedRooms || 0) - (occupancyData.maintenanceRooms || 0)
            : occupancyData.availableRooms
        } : null,
        roomInventory: inventoryData || null,
        userMetrics: userData || null,
        housekeepingStatus: housekeepingData || null,
        communicationMetrics: null, // Placeholder
        systemHealth: systemHealth as any
      };
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      throw error;
    }
  },

  /**
   * Get Receptionist Dashboard data
   * Real-time operational data for front desk
   */
  getReceptionistDashboard: async (): Promise<ReceptionistDashboardData> => {
    try {
       const [todayActivityRes, roomStatusRes] = await Promise.allSettled([
         privateApi.get('/reservations/analytics/today-activity'),
         privateApi.get('/rooms/analytics/room-status')
       ]);
       
       const extract = (res: PromiseSettledResult<any>) => 
         res.status === 'fulfilled' && res.value.data.success ? res.value.data.data : null;

       return {
         todayActivity: extract(todayActivityRes),
         roomStatus: extract(roomStatusRes),
         guestDirectory: null,
         liveCommunication: null,
         pendingPayments: null,
         quickActions: {
           roomsToAssign: 0,
           earlyCheckInRequests: 0,
           lateCheckOutRequests: 0
         },
         serviceHealth: {
           reservations: todayActivityRes.status === 'fulfilled' ? 'healthy' : 'down',
           rooms: roomStatusRes.status === 'fulfilled' ? 'healthy' : 'down',
           communication: 'healthy'
         },
         lastUpdated: new Date().toISOString()
       };
    } catch (error) {
       console.error('Error fetching receptionist dashboard:', error);
       throw error;
    }
  },

  /**
   * Get Housekeeper Dashboard data
   * Task-focused view with assigned tasks
   */
  getHousekeeperDashboard: async (): Promise<HousekeeperDashboardData> => {
    // Get current user from store to filter tasks
    const state = (await import('@/redux/store/store')).store.getState();
    const userId = state.auth.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const [tasksRes, statsRes] = await Promise.all([
        // Housekeepers can call listTasks. Filter by their ID.
        privateApi.get(`/housekeeping/tasks`, { 
          params: { assignedTo: userId, status: ['pending', 'in-progress', 'urgent'] },
          paramsSerializer: {
            indexes: null // Serializes arrays as status=1&status=2 (no brackets)
          }
        }),
        // Analytics might be restricted or available.
        // If my-stats exists and is accessible:
        privateApi.get(`/housekeeping/analytics/my-stats/${userId}`).catch(() => ({ data: { data: null } }))
      ]);

      return {
        assignedTasks: tasksRes.data.data || [],
        myStats: statsRes.data.data || null,
        roomContext: {}, // Placeholder
        serviceHealth: {
          housekeeping: 'healthy',
          reservations: 'healthy'
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching housekeeper dashboard:', error);
      // Fallback structure to prevent UI crash
      return {
        assignedTasks: [],
        myStats: null,
        roomContext: {},
        serviceHealth: { housekeeping: 'down', reservations: 'down' },
        lastUpdated: new Date().toISOString()
      };
    }
  },

  /**
   * Clear dashboard cache (Admin only)
   */
  clearCache: async () => {
    const { data } = await privateApi.post('/dashboard/cache/clear');
    return data;
  },

  /**
   * Get Revenue Chart Data
   * @param startDate ISO date string
   * @param endDate ISO date string
   * @param interval 'day' | 'month' (default: 'day')
   */
  getRevenueChartData: async (startDate: string, endDate: string, interval: 'day' | 'month' = 'day') => {
    try {
      const { data } = await privateApi.get('/payments/analytics/revenue/chart', {
        params: { startDate, endDate, interval }
      });
      return data.data; // Returns { date: string, amount: number }[]
    } catch (error) {
      console.error('Error fetching revenue chart data:', error);
      return [];
    }
  },

  /**
   * Get Recent Activity Data
   */
  getRecentActivity: async () => {
    try {
      const { data } = await privateApi.get('/reservations/analytics/recent-activity');
      return data.data; // Returns Activity[]
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }
};

// TypeScript interfaces for dashboard data
export interface AdminDashboardData {
  financialMetrics: {
    totalRevenue: number;
    pendingPayments: number;
    pendingAmount: number;
    refundedAmount: number;
    averageTransactionValue: number;
    revenueByPeriod: {
      today: number;
      week: number;
      month: number;
      year: number;
    };
  } | null;
  billingStatus: {
    paid: number;
    pending: number;
    overdue: number;
    disputed: number;
  } | null;
  occupancyMetrics: {
    currentOccupancy: number;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    maintenanceRooms: number;
    occupancyTrend: Array<{
      date: string;
      percentage: number;
    }>;
    bookingsByStatus: {
      confirmed: number;
      checkedIn: number;
      checkedOut: number;
      cancelled: number;
      pendingPayment: number;
    };
    upcomingCheckIns: number;
    upcomingCheckOuts: number;
  } | null;
  roomInventory: {
    byType: Record<string, { total: number; available: number }>;
    averageDailyRate: number;
    revPAR: number;
    totalRooms: number;
    occupiedRooms: number;
  } | null;
  userMetrics: {
    totalGuests: number;
    newGuestsThisMonth: number;
    returningGuests: number;
    staffCount: {
      admin: number;
      receptionist: number;
      housekeeper: number;
    };
    pendingApprovals: number;
  } | null;
  housekeepingStatus: {
    cleanRooms: number;
    dirtyRooms: number;
    inProgressRooms: number;
    inspectionPendingRooms: number;
    averageCleaningTime: number;
    tasksOverdue: number;
  } | null;
  communicationMetrics: {
    activeChatSessions: number;
    videoCallsToday: number;
    pendingMessages: number;
    averageResponseTime: number;
  } | null;
  systemHealth: {
    services: {
      payments: 'healthy' | 'degraded' | 'down';
      billing: 'healthy' | 'degraded' | 'down';
      reservations: 'healthy' | 'degraded' | 'down';
      rooms: 'healthy' | 'degraded' | 'down';
      users: 'healthy' | 'degraded' | 'down';
      housekeeping: 'healthy' | 'degraded' | 'down';
      communication: 'healthy' | 'degraded' | 'down';
    };
    lastUpdated: string;
  };
}

export interface ReceptionistDashboardData {
  todayActivity: any;
  roomStatus: any;
  guestDirectory: any;
  liveCommunication: any;
  pendingPayments: any;
  quickActions: {
    roomsToAssign: number;
    earlyCheckInRequests: number;
    lateCheckOutRequests: number;
  };
  serviceHealth: {
    reservations: 'healthy' | 'down';
    rooms: 'healthy' | 'down';
    communication: 'healthy' | 'down';
  };
  lastUpdated: string;
}

export interface HousekeeperDashboardData {
  assignedTasks: any[];
  myStats: any;
  roomContext: Record<string, any>;
  serviceHealth: {
    housekeeping: 'healthy' | 'down';
    reservations: 'healthy' | 'down';
  };
  lastUpdated: string;
}
