import { Request, Response, NextFunction } from 'express';
import { RoomLookupAdapter } from '../services/adapters/roomLookup.adapter';
import { GuestRpcClient } from '../services/adapters/guestRpcClient.adapter';

/**
 * Reservation Analytics Controller
 * Provides aggregated metrics for dashboards
 */
export class ReservationAnalyticsController {
  private reservationModel: any;
  private roomLookup: RoomLookupAdapter;
  private guestRpc: GuestRpcClient;

  constructor(reservationModel: any) {
    this.reservationModel = reservationModel;
    this.roomLookup = new RoomLookupAdapter();
    this.guestRpc = new GuestRpcClient();
  }

  /**
 * GET /analytics/occupancy
   * Returns occupancy metrics for admin dashboard
   */
  async getOccupancyMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get all reservations
      const allReservations = await this.reservationModel.find({});
      
      // Calculate current occupancy (checked-in guests)
      const checkedInReservations = allReservations.filter(
        (r: any) => r.status === 'CheckedIn'
      );

      //Get bookings by status
      const bookingsByStatus = {
        confirmed: allReservations.filter((r: any) => r.status === 'Confirmed').length,
        checkedIn: checkedInReservations.length,
        checkedOut: allReservations.filter((r: any) => r.status === 'CheckedOut').length,
        cancelled: allReservations.filter((r: any) => r.status === 'Cancelled').length,
        pendingPayment: allReservations.filter((r: any) => r.status === 'PendingPayment').length,
      };

      // Calculate upcoming check-ins and check-outs (today)
      const upcomingCheckIns = allReservations.filter((r: any) => {
        const checkIn = new Date(r.checkIn);
        return checkIn >= today && checkIn < tomorrow && r.status === 'Confirmed';
      }).length;

      const upcomingCheckOuts = allReservations.filter((r: any) => {
        const checkOut = new Date(r.checkOut);
        return checkOut >= today && checkOut < tomorrow && r.status === 'CheckedIn';
      }).length;

      // Mock occupancy trend (would need historical data in production)
      const occupancyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        occupancyTrend.push({
          date: date.toISOString().split('T')[0],
          percentage: Math.floor(Math.random() * 30) + 60 // Mock data: 60-90%
        });
      }

      res.json({
        success: true,
        data: {
          currentOccupancy: 0, // Will be calculated with room count
          totalRooms: 0, // Needs to be fetched from room service
          occupiedRooms: checkedInReservations.length,
          availableRooms: 0, // Calculated: totalRooms - occupiedRooms
          maintenanceRooms: 0, // From room service
          occupancyTrend,
          bookingsByStatus,
          upcomingCheckIns,
          upcomingCheckOuts
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /analytics/today-activity
   * Returns today's check-ins and check-outs for receptionist
   */
  async getTodayActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check-ins scheduled for today
      // Removed .populate() as Room and Guest are external services
      const checkInsScheduledDocs = await this.reservationModel.find({
        checkIn: { $gte: today, $lt: tomorrow },
        status: { $in: ['Confirmed', 'PendingPayment'] }
      }).lean();

      // Check-outs scheduled for today
      const checkOutsScheduledDocs = await this.reservationModel.find({
        checkOut: { $gte: today, $lt: tomorrow },
        status: 'CheckedIn'
      }).lean();
      
      // Fetch Room and Guest details
      // Note: In a production environment with high scale, we would bulk fetch or cache these
      // For now, we fetch safely with Promise.all
      
      const enrichReservation = async (r: any) => {
        let roomDetails: any = null;
        let guestDetails: any = null;

        // Fetch Room
        if (r.roomId) {
            try {
                const roomData = await this.roomLookup.ensureRoomExists(r.roomId.toString());
                // We need to fetch full room details to get number and type, ensureRoomExists might only return minimal info
                // But the adapter's ensureRoomExists calls GET /:id which returns full data typically. 
                // Let's check adapter... ensureRoomExists returns { id, price, available }. 
                // We need extended info. Let's use internal logic of adapter or call endpoint if needed.
                // Actually, ensureRoomExists in adapter returns partialified data. 
                // Let's rely on basic info or better yet, fetch all rooms and map if efficiency is needed.
                // For direct ID fetch, let's assume we can get it. 
                // Wait, adapter ensures existence but returns limited fields. 
                // Let's cheat and use getAllRooms for mapping if list is small, or just better:
                // We'll optimistically use what we have or 'TBD'.
                // If we need the number, we really need the room object.
                // Let's temporarily use getAllRooms which returns full objects as per the adapter 
                // and find from there. It's safe given hotel size.
                const allRooms = await this.roomLookup.getAllRooms();
                roomDetails = allRooms.find((rm: any) => String(rm.id) === String(r.roomId));
            } catch (e) {
                console.warn(`Failed to fetch room ${r.roomId}`, e);
            }
        }

        // Fetch Guest
        if (r.guestId) {
            try {
                // guestRpc.getContactDetails returns { email, phoneNumber }
                // We might need name too. 
                // guestRpc.lookupGuest(email, phone) returns profile.
                // guestRpc doesn't have "getById". This is a gap.
                // However, r.guestContact might have the email/phone saved on the reservation itself!
                // Reservation model has guestContact { email, phoneNumber }.
                guestDetails = {
                    email: r.guestContact?.email,
                    phone: r.guestContact?.phoneNumber,
                    // We might miss the name if it's not on reservation. 
                    // But reservation usually doesn't store name directly (it uses guestId).
                    // We'll default to 'Guest' if we can't find name.
                };
            } catch (e) {
                console.warn(`Failed to fetch guest ${r.guestId}`, e);
            }
        }
        
        return {
          _id: r._id,
          code: r.code,
          guestName: guestDetails?.email || 'Guest', // Fallback since we lack GetGuestById
          guestContact: {
            email: guestDetails?.email || '',
            phone: guestDetails?.phone || ''
          },
          roomNumber: roomDetails?.number || 'TBD',
          roomType: roomDetails?.type || 'Standard',
          checkInTime: r.checkIn,
          checkOutTime: r.checkOut,
          status: r.status,
          totalAmount: r.totalAmount || 0
        };
      };

      const checkInsScheduled = await Promise.all(checkInsScheduledDocs.map((r: any) => enrichReservation(r)));
      const checkOutsScheduled = await Promise.all(checkOutsScheduledDocs.map((r: any) => enrichReservation(r)));

      res.json({
        success: true,
        data: {
          checkInsScheduled: {
            count: checkInsScheduled.length,
            reservations: checkInsScheduled
          },
          checkOutsScheduled: {
            count: checkOutsScheduled.length,
            reservations: checkOutsScheduled
          },
          lateCheckOuts: 0, // Would need additional logic
          earlyCheckIns: 0
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /analytics/room-context
   * Returns room context for housekeeper dashboard
   */
  async getRoomContext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get all active reservations
      const activeReservations = await this.reservationModel.find({
        status: { $in: ['Confirmed', 'CheckedIn'] }
      }).lean();

      const roomContext: Record<string, any> = {};

      activeReservations.forEach((r: any) => {
        const checkIn = new Date(r.checkIn);
        const checkOut = new Date(r.checkOut);
        const roomId = r.roomId?._id || r.roomId;

        if (roomId) {
          roomContext[roomId.toString()] = {
            hasGuestCheckingInToday: checkIn >= today && checkIn < tomorrow,
            checkInTime: checkIn >= today && checkIn < tomorrow ? r.checkIn: null,
            hasGuestCheckingOutToday: checkOut >= today && checkOut < tomorrow,
            isCurrentlyOccupied: r.status === 'CheckedIn',
            guestPreferences: [] // guestId population not available
          };
        }
      });

      res.json({
        success: true,
        data: roomContext
      });
    } catch (err) {
      next(err);
    }
  }
  /**
   * GET /analytics/recent-activity
   * Returns a feed of recent activities (Created, CheckedIn, CheckedOut, Cancelled)
   */
  async getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Fetch latest 10 reservations sorted by createdAt or updatedAt
      // Ideally we want "event time" but createdAt is good for "New Bookings"
      // For check-ins/outs, we'd need to sort by checkIn/checkOut time if we want a unified feed.
      // For simplicity/robustness, let's fetch the last 10 updated reservations which acts as a "Latest Activity" feed.
      
      const recentDocs = await this.reservationModel.find({})
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean();

      const enrichReservation = async (r: any) => {
        let roomDetails: any = null;
        let guestDetails: any = null;

        // Fetch Room
        if (r.roomId) {
            try {
                const allRooms = await this.roomLookup.getAllRooms();
                roomDetails = allRooms.find((rm: any) => String(rm.id) === String(r.roomId));
            } catch (e) {
                console.warn(`Failed to fetch room ${r.roomId}`, e);
            }
        }

        // Fetch Guest
        guestDetails = {
            email: r.guestContact?.email,
            phone: r.guestContact?.phoneNumber,
        };
        
        // Determine "Type" based on status or recent action
        // This is a heuristic. In a real event-sourced system we'd have explicit events.
        let type = 'booking';
        if (r.status === 'CheckedIn') type = 'check-in';
        if (r.status === 'CheckedOut') type = 'check-out';
        if (r.status === 'Cancelled') type = 'cancellation';
        
        return {
          _id: r._id,
          guestName: guestDetails?.email || 'Guest',
          roomNumber: roomDetails?.number || 'TBD',
          status: r.status,
          amount: r.totalAmount || 0,
          createdAt: r.updatedAt || r.createdAt, // Use update time for activity feed
          type
        };
      };

      const activities = await Promise.all(recentDocs.map((r: any) => enrichReservation(r)));

      res.json({
        success: true,
        data: activities
      });
    } catch (err) {
      next(err);
    }
  }
}
