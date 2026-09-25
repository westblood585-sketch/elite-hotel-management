import { Request, Response, NextFunction } from 'express';

/**
 * Billing Analytics Controller
 * Provides billing metrics for dashboards
 */
export class BillingAnalyticsController {
  private billingModel: any;

  constructor(billingModel: any) {
    this.billingModel = billingModel;
  }

  /**
   * GET /analytics/status
   * Returns billing status breakdown for admin dashboard
   */
  async getBillingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allBillings = await this.billingModel.find({}).lean();

      const billingStatus = {
        paid: allBillings.filter((b: any) => b.status === 'paid').length,
        pending: allBillings.filter((b: any) => b.status === 'pending').length,
        overdue: allBillings.filter((b: any) => b.status === 'overdue').length,
        disputed: allBillings.filter((b: any) => b.disputeId).length
      };

      res.json({
        success: true,
        data: billingStatus
      });
    } catch (err) {
      next(err);
    }
  }
}
