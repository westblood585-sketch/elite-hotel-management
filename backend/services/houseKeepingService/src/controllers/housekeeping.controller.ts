import { Request, Response } from 'express'
import { HousekeepingService } from '../services/implementation/housekeeping.service'
import { asyncHandler } from '../middleware/asyncHandler'
import { CustomeRequest } from '../interfaces/CustomRequest'

export class HousekeepingController {
  constructor(private svc: HousekeepingService) {}

  assignTask = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const payload = req.body
    const task = await this.svc.assignTask(payload)
    res.status(201).json({ success: true, data: task })
  })

  reportIssue = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const { roomId, description, priority } = req.body
    const reportedBy = req.user?.id
    
    // Create a maintenance task
    const task = await this.svc.assignTask({
      roomId,
      taskType: 'maintenance',
      priority: priority || 'high',
      notes: `Reported by ${req.user?.role || 'staff'}: ${description}`,
      // Optionally assign to maintenance team or leave unassigned
      assignedTo: undefined, 
    })
    
    res.status(201).json({ success: true, data: task, message: 'Issue reported successfully' })
  })

  completeTask = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const taskId = req.params.id
    const { notes, actualDuration, checklist, images } = req.body
    const completedBy = req.user?.id // From auth middleware
    
    const updated = await this.svc.completeTask(
      taskId,
      { notes, actualDuration, checklist, images },
      completedBy
    )
    res.json({ success: true, data: updated })
  })

  updateTaskStatus = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const taskId = req.params.id
    const { status, notes } = req.body
    const updated = await this.svc.updateTaskStatus(taskId, status, notes)
    res.json({ success: true, data: updated })
  })

  updateChecklist = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const taskId = req.params.id
    const { checklist } = req.body
    const updated = await this.svc.updateChecklist(taskId, checklist)
    res.json({ success: true, data: updated })
  })

  bulkAssignTasks = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const { assignedTo, roomIds, taskType } = req.body
    const tasks = await this.svc.bulkAssignTasks(assignedTo, roomIds, taskType)
    res.status(201).json({ 
      success: true, 
      data: tasks,
      message: `${tasks.length} tasks created successfully`
    })
  })

  getTasksByStaff = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const staffId = req.params.staffId
    const date = req.query.date ? new Date(req.query.date as string) : undefined
    const tasks = await this.svc.getTasksByStaff(staffId, date)
    res.json({ success: true, data: tasks, total: tasks.length })
  })

  getRoomHistory = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const roomId = req.params.roomId
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
    const history = await this.svc.getRoomHistory(roomId, limit)
    res.json({ success: true, data: history, total: history.length })
  })

  getTaskStatistics = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
    const stats = await this.svc.getTaskStatistics(dateFrom, dateTo)
    res.json({ success: true, data: stats })
  })

  getTask = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const task = await this.svc.getTask(req.params.id)
    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found' })
    res.json({ success: true, data: task })
  })

  listTasks = asyncHandler(async (req: CustomeRequest, res: Response) => {
    // validated query was applied at route-level
    const q = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      roomId: req.query.roomId as string | undefined,
      reservationId: req.query.reservationId as string | undefined,
      assignedTo: req.query.assignedTo as string | undefined,
      status: req.query.status as any,
      taskType: req.query.taskType as any,
      priority: req.query.priority as any,
      completedBy: req.query.completedBy as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      search: req.query.search as string | undefined,
      sortBy: (req.query.sortBy as any) || 'createdAt',
      sortOrder: (req.query.sortOrder as any) || 'desc',
    }

    const result = await this.svc.listTasks(q)
    res.json({ success: true, ...result })
  })

  reassignTask = asyncHandler(async (req: CustomeRequest, res: Response) => {
    const taskId = req.params.id
    const { assignedTo, notes } = req.body
    const updated = await this.svc.reassignTask(taskId, assignedTo, notes)
    res.json({ success: true, data: updated })
  })
}
