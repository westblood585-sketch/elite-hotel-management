import { Request, Response, NextFunction } from 'express';

/**
 * Housekeeping Analytics Controller
 * Provides housekeeping metrics and task data for dashboards
 */
export class HousekeepingAnalyticsController {
  private taskModel: any;

  constructor(taskModel: any) {
    this.taskModel = taskModel;
  }

  /**
   * GET /analytics/status
   * Returns housekeeping status for admin dashboard
   */
  async getHousekeepingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allTasks = await this.taskModel.find({}).lean();

      const cleanRooms = allTasks.filter((t: any) => t.status === 'completed' && t.taskType === 'cleaning').length;
      const dirtyRooms = allTasks.filter((t: any) => t.status === 'pending' && t.taskType === 'cleaning').length;
      const inProgressRooms = allTasks.filter((t: any) => t.status === 'in-progress').length;
      const inspectionPendingRooms = allTasks.filter((t: any) => t.taskType === 'inspection' && t.status === 'pending').length;

      // Calculate average cleaning time
      const completedTasks = allTasks.filter((t: any) => t.status === 'completed' && t.startedAt && t.completedAt);
      const totalTime = completedTasks.reduce((sum: number, t: any) => {
        const start = new Date(t.startedAt).getTime();
        const end = new Date(t.completedAt).getTime();
        return sum + (end - start);
      }, 0);
      const averageCleaningTime = completedTasks.length > 0
        ? Math.round((totalTime / completedTasks.length) / (1000 * 60)) // Convert to minutes
        : 0;

      // Tasks overdue
      const now = new Date();
      const tasksOverdue = allTasks.filter((t: any) => {
        return t.status !== 'completed' && t.dueBy && new Date(t.dueBy) < now;
      }).length;

      res.json({
        success: true,
        data: {
          cleanRooms,
          dirtyRooms,
          inProgressRooms,
          inspectionPendingRooms,
          averageCleaningTime,
          tasksOverdue
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /analytics/my-stats/:userId
   * Returns personal stats for housekeeper dashboard
   */
  async getMyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 7);

      const startOfMonth = new Date(today);
      startOfMonth.setDate(1);

      // Get user's tasks
      const allUserTasks = await this.taskModel.find({ assignedTo: userId }).lean();
      const completedTasks = allUserTasks.filter((t: any) => t.status === 'completed');

      const countCompleted = (fromDate: Date) => {
        return completedTasks.filter((t: any) => new Date(t.completedAt) >= fromDate).length;
      };

      // Calculate average completion time
      const tasksWithTime = completedTasks.filter((t: any) => t.startedAt && t.completedAt);
      const totalTime = tasksWithTime.reduce((sum: number, t: any) => {
        const start = new Date(t.startedAt).getTime();
        const end = new Date(t.completedAt).getTime();
        return sum + (end - start);
      }, 0);
      const averageCompletionTime = tasksWithTime.length > 0
        ? Math.round((totalTime / tasksWithTime.length) / (1000 * 60))
        : 0;

      const pendingTasks = allUserTasks.filter((t: any) => t.status === 'pending').length;
      
      const now = new Date();
      const overdueTasksCount = allUserTasks.filter((t: any) => {
        return t.status !== 'completed' && t.dueBy && new Date(t.dueBy) < now;
      }).length;

      // Calculate on-time completion rate
      const tasksWithDueDate = completedTasks.filter((t: any) => t.dueBy);
      const onTimeCompletions = tasksWithDueDate.filter((t: any) => {
        return new Date(t.completedAt) <= new Date(t.dueBy);
      }).length;
      const onTimeCompletionRate = tasksWithDueDate.length > 0
        ? Math.round((onTimeCompletions / tasksWithDueDate.length) * 100)
        : 100;

      res.json({
        success: true,
        data: {
          tasksCompleted: {
            today: countCompleted(today),
            week: countCompleted(startOfWeek),
            month: countCompleted(startOfMonth)
          },
          averageCompletionTime,
          pendingTasks,
          overdueTasksCount,
          performance: {
            onTimeCompletionRate,
            qualityScore: 95 // Mock - would come from inspection results
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
