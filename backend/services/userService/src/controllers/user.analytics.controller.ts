import { Request, Response, NextFunction } from 'express';

/**
 * User/Guest Analytics Controller
 * Provides user metrics for dashboards
 */
export class UserAnalyticsController {
  private userModel: any;

  constructor(userModel: any) {
    this.userModel = userModel;
  }

  /**
   * GET /analytics/metrics
   * Returns user metrics for admin dashboard
   */
  async getUserMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allUsers = await this.userModel.find({}).lean();

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newGuestsThisMonth = allUsers.filter((u: any) => {
        return u.role === 'user' && new Date(u.createdAt) >= startOfMonth;
      }).length;

      const staffCount = {
        admin: allUsers.filter((u: any) => u.role === 'admin').length,
        receptionist: allUsers.filter((u: any) => u.role === 'receptionist').length,
        housekeeper: allUsers.filter((u: any) => u.role === 'housekeeper').length
      };

      const pendingApprovals = allUsers.filter((u: any) => u.isApproved === 'pending').length;

      res.json({
        success: true,
        data: {
          totalGuests: allUsers.filter((u: any) => u.role === 'user').length,
          newGuestsThisMonth,
          returningGuests: 0, // Would need booking history to calculate
          staffCount,
          pendingApprovals
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
