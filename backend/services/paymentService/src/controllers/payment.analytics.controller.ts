import { Request, Response, NextFunction } from 'express';

/**
 * Payment Analytics Controller
 * Provides payment metrics for dashboards
 */
export class PaymentAnalyticsController {
  private paymentModel: any;

  constructor(paymentModel: any) {
    this.paymentModel = paymentModel;
  }

  /**
   * GET /analytics/revenue
   * Returns revenue metrics for admin dashboard
   */
  async getRevenueMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      
      // Time periods
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Get all payments
      const allPayments = await this.paymentModel.find({}).lean();

      // Filter by status and time
      const succeededPayments = allPayments.filter((p: any) => p.status === 'succeeded');
      const refundedPayments = allPayments.filter((p: any) => p.status === 'refunded');

      const calculateTotal = (payments: any[], fromDate: Date) => {
        return payments
          .filter((p: any) => new Date(p.createdAt) >= fromDate)
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      };

      const totalRevenue = succeededPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const refundedAmount = refundedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const pendingPayments = allPayments.filter((p: any) => p.status === 'initiated');

      const averageTransactionValue = succeededPayments.length > 0
        ? totalRevenue / succeededPayments.length
        : 0;

      res.json({
        success: true,
        data: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          pendingPayments: pendingPayments.length,
          pendingAmount: pendingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
          refundedAmount: Math.round(refundedAmount * 100) / 100,
          averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
          revenueByPeriod: {
            today: calculateTotal(succeededPayments, startOfToday),
            week: calculateTotal(succeededPayments, startOfWeek),
            month: calculateTotal(succeededPayments, startOfMonth),
            year: calculateTotal(succeededPayments, startOfYear)
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /analytics/pending
   * Returns pending payments for receptionist dashboard
   */
  async getPendingPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pendingPayments = await this.paymentModel.find({
        status: 'initiated'
      }).populate('reservationId').populate('guestId').lean();

      const formattedPayments = pendingPayments.map((p: any) => ({
        reservationId: p.reservationId?._id || p.reservationId,
        guestName: p.guestId?.fullName || p.guestContact?.email || 'Guest',
        amount: p.amount,
        currency: p.currency,
        dueDate: p.createdAt // Or could be from reservation checkout date
      }));

      res.json({
        success: true,
        data: {
          count: pendingPayments.length,
          totalAmount: pendingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
          reservations: formattedPayments
        }
      });
    } catch (err) {
      next(err);
    }
  }
  /**
   * GET /analytics/revenue/chart
   * Returns time-series revenue data for charts
   */
  async getRevenueTimeSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, interval = 'day' } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ success: false, message: 'Start date and end date are required' });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      // Ensure end date includes the full day
      end.setHours(23, 59, 59, 999);

      // Define grouping format based on interval
      let groupBy: any = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };

      if (interval === 'month') {
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
      }

      const revenueData = await this.paymentModel.aggregate([
        {
          $match: {
            status: 'succeeded',
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: groupBy,
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      // Format data for frontend
      const formattedData = revenueData.map((item: any) => {
        const { year, month, day } = item._id;
        let dateLabel = '';
        
        if (interval === 'month') {
          // Format as "Jan 2024"
          const date = new Date(year, month - 1);
          dateLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else {
          // Format as "Jan 01"
          const date = new Date(year, month - 1, day);
          dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        }

        return {
          date: dateLabel,
          amount: item.amount,
          fullDate: new Date(year, month - 1, day || 1).toISOString()
        };
      });

      res.json({
        success: true,
        data: formattedData
      });
    } catch (err) {
      next(err);
    }
  }
}
