import { NextFunction, Request, Response } from 'express';
import { IRoomService } from '../../services/interface/IRoom.service';
import { successResponse } from '../../utils/response.handler';
import { HttpStatus } from '../../enums/http.status';

export class RoomAnalyticsController {
  private roomService: IRoomService;

  constructor(roomService: IRoomService) {
    this.roomService = roomService;
  }

  /**
   * GET /analytics/inventory
   * Returns room inventory breakdown by type
   */
  async getInventoryAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get all rooms
      const allRooms = await this.roomService.listRooms({});

      if (!allRooms || !allRooms.data) {
        res.json({
          success: true,
          data: {
            byType: {},
            averageDailyRate: 0,
            revPAR: 0
          }
        });
        return;
      }

      const rooms = allRooms.data;

      // Group by type
      const byType: Record<string, { total: number; available: number }> = {};
      let totalPrice = 0;
      let totalRooms = 0;

      rooms.forEach((room: any) => {
        const type = room.type?.toLowerCase() || 'standard';
        
        if (!byType[type]) {
          byType[type] = { total: 0, available: 0 };
        }

        byType[type].total += 1;
        if (room.available) {
          byType[type].available += 1;
        }

        totalPrice += room.price || 0;
        totalRooms += 1;
      });

      // Calculate metrics
      const averageDailyRate = totalRooms > 0 ? totalPrice / totalRooms : 0;
      const totalOccupied = totalRooms - Object.values(byType).reduce((sum, t) => sum + t.available, 0);
      const revPAR = totalRooms > 0 ? (totalOccupied * averageDailyRate) / totalRooms : 0;

      res.json({
        success: true,
        data: {
          byType,
          averageDailyRate: Math.round(averageDailyRate * 100) / 100,
          revPAR: Math.round(revPAR * 100) / 100,
          totalRooms,
          occupiedRooms: totalOccupied
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /analytics/room-status
   * Returns room status grid for receptionist dashboard
   */
  async getRoomStatusGrid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allRooms = await this.roomService.listRooms({});

      if (!allRooms || !allRooms.data) {
        res.json({
          success: true,
          data: {
            grid: [],
            quickStats: {
              readyForCheckIn: 0,
              awaitingCleaning: 0,
              outOfOrder: 0
            }
          }
        });
        return;
      }

      const rooms = allRooms.data;

      const grid = rooms.map((room: any) => ({
        roomId: room._id,
        roomNumber: room.number,
        type: room.type,
        status: room.available ? 'available' : 'occupied',
        // Note: housekeeping status will be enriched by gateway if needed
      }));

      const quickStats = {
        readyForCheckIn: rooms.filter((r: any) => r.available).length,
        awaitingCleaning: 0, // This would come from housekeeping service
        outOfOrder: 0
      };

      res.json({
        success: true,
        data: {
          grid,
          quickStats
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
