import { Request, Response } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

// Initialize cache with 2-minute default TTL
const dashboardCache = new NodeCache({ stdTTL: 120 });

// Service URLs from environment
const SERVICES = {
  auth: process.env.AUTH_API_BASE_URL || 'http://localhost:4001',
  users: process.env.USER_API_BASE_URL || 'http://localhost:4002',
  rooms: process.env.ROOM_API_BASE_URL || 'http://localhost:4003',
  guests: process.env.GUEST_API_BASE_URL || 'http://localhost:4004',
  reservations: process.env.RESERVATION_API_BASE_URL || 'http://localhost:4005',
  payments: process.env.PAYMENT_API_BASE_URL || 'http://localhost:4006',
  billing: process.env.BILLING_API_BASE_URL || 'http://localhost:4007',
  housekeeping: process.env.HOUSEKEEPING_API_BASE_URL || 'http://localhost:4008',
  communication: process.env.COMMUNICATION_API_BASE_URL || 'http://localhost:4009',
};

interface ServiceStatus {
  [key: string]: 'healthy' | 'degraded' | 'down';
}

// Helper function to safely fetch from a service
async function safeFetch<T>(url: string, serviceName: string): Promise<{ data: T | null; status: 'healthy' | 'down' }> {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return { data: response.data, status: 'healthy' };
  } catch (error: any) {
    console.error(`[Dashboard] Failed to fetch from ${serviceName}:`, error.message);
    return { data: null, status: 'down' };
  }
}

/**
 * Admin Dashboard - Strategic Overview
 */
export const getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
  const cacheKey = 'dashboard:admin';

  // Check cache
  const cached = dashboardCache.get(cacheKey);
  if (cached) {
    res.json({ success: true, data: cached, cached: true });
    return;
  }

  try {
    // Fetch data from all services in parallel
    const results = await Promise.allSettled([
      safeFetch(`${SERVICES.payments}/analytics/revenue`, 'payments'),
      safeFetch(`${SERVICES.billing}/analytics/status`, 'billing'),
      safeFetch(`${SERVICES.reservations}/analytics/occupancy`, 'reservations'),
      safeFetch(`${SERVICES.rooms}/analytics/inventory`, 'rooms'),
      safeFetch(`${SERVICES.users}/analytics/metrics`, 'users'),
      safeFetch(`${SERVICES.housekeeping}/analytics/status`, 'housekeeping'),
      safeFetch(`${SERVICES.communication}/analytics/metrics`, 'communication'),
    ]);

    // Process results
    const [payment, billing, reservation, room, user, housekeeping, communication] = results.map(
      (result) => (result.status === 'fulfilled' ? result.value : { data: null, status: 'down' })
    );

    // Build aggregated dashboard data
    const dashboardData = {
      financialMetrics: payment.data || null,
      billingStatus: billing.data || null,
      occupancyMetrics: reservation.data || null,
      roomInventory: room.data || null,
      userMetrics: user.data || null,
      housekeepingStatus: housekeeping.data || null,
      communicationMetrics: communication.data || null,
      systemHealth: {
        services: {
          payments: payment.status,
          billing: billing.status,
          reservations: reservation.status,
          rooms: room.status,
          users: user.status,
          housekeeping: housekeeping.status,
          communication: communication.status,
        } as ServiceStatus,
        lastUpdated: new Date().toISOString(),
      },
    };

    // Cache the result
    dashboardCache.set(cacheKey, dashboardData);

    res.json({ success: true, data: dashboardData, cached: false });
  } catch (error: any) {
    console.error('[Dashboard] Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard data',
      error: error.message,
    });
  }
};

/**
 * Receptionist Dashboard - Operational Command Center
 */
export const getReceptionistDashboard = async (req: Request, res: Response): Promise<void> => {
  const cacheKey = 'dashboard:receptionist';

  // Shorter cache for receptionist (30 seconds)
  const cached = dashboardCache.get(cacheKey);
  if (cached) {
    res.json({ success: true, data: cached, cached: true });
    return;
  }

  try {
    // Fetch real-time operational data
    const results = await Promise.allSettled([
      safeFetch(`${SERVICES.reservations}/analytics/today-activity`, 'reservations'),
      safeFetch(`${SERVICES.rooms}/analytics/room-status`, 'rooms'),
      safeFetch(`${SERVICES.guests}/analytics/directory`, 'guests'),
      safeFetch(`${SERVICES.communication}/analytics/live`, 'communication'),
      safeFetch(`${SERVICES.payments}/analytics/pending`, 'payments'),
    ]);

    const [todayActivity, roomStatus, guestDirectory, liveCommunication, pendingPayments] = results.map(
      (result) => (result.status === 'fulfilled' ? result.value : { data: null, status: 'down' })
    );

    const dashboardData = {
      todayActivity: todayActivity.data || null,
      roomStatus: roomStatus.data || null,
      guestDirectory: guestDirectory.data || null,
      liveCommunication: liveCommunication.data || null,
      pendingPayments: pendingPayments.data || null,
      quickActions: {
        roomsToAssign: 0, // Calculated from reservations without room assignment
        earlyCheckInRequests: 0,
        lateCheckOutRequests: 0,
      },
      serviceHealth: {
        reservations: todayActivity.status,
        rooms: roomStatus.status,
        communication: liveCommunication.status,
      },
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 30 seconds
    dashboardCache.set(cacheKey, dashboardData, 30);

    res.json({ success: true, data: dashboardData, cached: false });
  } catch (error: any) {
    console.error('[Dashboard] Receptionist dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch receptionist dashboard data',
      error: error.message,
    });
  }
};

/**
 * Housekeeper Dashboard - Task Management
 */
export const getHousekeeperDashboard = async (req: Request, res: Response): Promise<void> => {
  const cacheKey = `dashboard:housekeeper:${req.user?.userId || 'anonymous'}`;

  // No cache for task list (always fresh)
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Fetch housekeeper-specific data
    const results = await Promise.allSettled([
      safeFetch(`${SERVICES.housekeeping}/tasks/assigned/${userId}`, 'housekeeping'),
      safeFetch(`${SERVICES.housekeeping}/analytics/my-stats/${userId}`, 'housekeeping'),
      safeFetch(`${SERVICES.reservations}/analytics/room-context`, 'reservations'),
    ]);

    const [assignedTasks, myStats, roomContext] = results.map(
      (result) => (result.status === 'fulfilled' ? result.value : { data: null, status: 'down' })
    );

    const dashboardData = {
      assignedTasks: assignedTasks.data || [],
      myStats: myStats.data || null,
      roomContext: roomContext.data || {},
      serviceHealth: {
        housekeeping: assignedTasks.status,
        reservations: roomContext.status,
      },
      lastUpdated: new Date().toISOString(),
    };

    res.json({ success: true, data: dashboardData, cached: false });
  } catch (error: any) {
    console.error('[Dashboard] Housekeeper dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch housekeeper dashboard data',
      error: error.message,
    });
  }
};

/**
 * Clear dashboard cache (admin only)
 */
export const clearDashboardCache = async (req: Request, res: Response): Promise<void> => {
  try {
    dashboardCache.flushAll();
    res.json({
      success: true,
      message: 'Dashboard cache cleared successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
};
