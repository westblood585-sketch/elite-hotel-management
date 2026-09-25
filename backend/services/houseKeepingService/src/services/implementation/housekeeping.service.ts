import {
  IHousekeepingService,
  AssignTaskPayload,
  CompleteTaskPayload,
  TaskStatistics,
} from '../interface/IHousekeeping.service'
import dayjs from 'dayjs'
import { HousekeepingRepository } from '../../repository/housekeeping.repository'
import { RabbitPublisher } from '../../config/rabbit.publisher'
import { HousekeepingTaskDoc, ChecklistItem } from '../../models/housekeeping.model'
import { NotFoundError } from '../../errors/NotFoundError'

export class HousekeepingService implements IHousekeepingService {
  private repo: HousekeepingRepository
  private publisher: RabbitPublisher

  constructor(repo: HousekeepingRepository, publisher: RabbitPublisher) {
    this.repo = repo
    this.publisher = publisher
  }

  async assignTask(payload: AssignTaskPayload): Promise<HousekeepingTaskDoc> {
    const task = await this.repo.create({
      roomId: payload.roomId,
      reservationId: payload.reservationId,
      assignedTo: payload.assignedTo,
      taskType: payload.taskType || 'cleaning',
      priority: payload.priority || 'normal',
      estimatedDuration: payload.estimatedDuration,
      notes: payload.notes,
      checklist: payload.checklist,
      idempotencyKey: payload.idempotencyKey,
      status: 'pending',
    })

    await this.publisher.publish(
      'housekeeping.events',
      'housekeeping.task.assigned',
      {
        event: 'housekeeping.task.assigned',
        data: task,
        createdAt: new Date().toISOString(),
      }
    )

    return task
  }

  async completeTask(
    taskId: string,
    payload: CompleteTaskPayload,
    completedBy?: string
  ): Promise<HousekeepingTaskDoc | null> {
    const existing = await this.repo.findById(taskId)
    if (!existing) throw new NotFoundError('Task not found')

    const updated = await this.repo.update(taskId, {
      status: 'completed',
      notes: payload.notes || existing.notes,
      actualDuration: payload.actualDuration,
      checklist: payload.checklist || existing.checklist,
      images: payload.images || existing.images,
      completedBy: completedBy || existing.assignedTo,
      completedAt: new Date(),
    })

    if (updated) {
      await this.publisher.publish(
        'housekeeping.events',
        'housekeeping.task.completed',
        {
          event: 'housekeeping.task.completed',
          data: updated,
          createdAt: new Date().toISOString(),
        }
      )
    }

    return updated
  }

  async getTask(taskId: string): Promise<HousekeepingTaskDoc | null> {
    return this.repo.findById(taskId)
  }

  async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled',
    notes?: string
  ): Promise<HousekeepingTaskDoc | null> {
    const existing = await this.repo.findById(taskId)
    if (!existing) throw new NotFoundError('Task not found')

    const updateData: any = { status }
    if (notes) updateData.notes = notes
    if (status === 'completed' && !existing.completedAt) {
      updateData.completedAt = new Date()
    }

    const updated = await this.repo.update(taskId, updateData)

    if (updated) {
      await this.publisher.publish(
        'housekeeping.events',
        `housekeeping.task.${status}`,
        {
          event: `housekeeping.task.${status}`,
          data: updated,
          createdAt: new Date().toISOString(),
        }
      )
    }

    return updated
  }

  async updateChecklist(
    taskId: string,
    checklist: ChecklistItem[]
  ): Promise<HousekeepingTaskDoc | null> {
    const existing = await this.repo.findById(taskId)
    if (!existing) throw new NotFoundError('Task not found')

    return this.repo.update(taskId, { checklist })
  }

  async bulkAssignTasks(
    assignedTo: string,
    roomIds: string[],
    taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown' = 'cleaning'
  ): Promise<HousekeepingTaskDoc[]> {
    const tasks: HousekeepingTaskDoc[] = []

    for (const roomId of roomIds) {
      const task = await this.repo.create({
        roomId,
        assignedTo,
        taskType,
        priority: 'normal',
        status: 'pending',
      })
      tasks.push(task)

      await this.publisher.publish(
        'housekeeping.events',
        'housekeeping.task.assigned',
        {
          event: 'housekeeping.task.assigned',
          data: task,
          createdAt: new Date().toISOString(),
          meta: { bulkAssignment: true },
        }
      )
    }

    return tasks
  }

  async getTasksByStaff(
    staffId: string,
    date?: Date
  ): Promise<HousekeepingTaskDoc[]> {
    const filter: any = { assignedTo: staffId }
    
    if (date) {
      const startOfDay = dayjs(date).startOf('day').toDate()
      const endOfDay = dayjs(date).endOf('day').toDate()
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay }
    }

    const { data } = await this.repo.findAndCount(filter, {
      sort: { createdAt: -1 },
      limit: 100,
    })
    
    return data
  }

  async getRoomHistory(
    roomId: string,
    limit: number = 10
  ): Promise<HousekeepingTaskDoc[]> {
    const { data } = await this.repo.findAndCount(
      { roomId },
      {
        sort: { completedAt: -1, createdAt: -1 },
        limit,
      }
    )
    
    return data
  }

  async getTaskStatistics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<TaskStatistics> {
    const filter: any = {}
    
    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) filter.createdAt.$gte = dayjs(dateFrom).startOf('day').toDate()
      if (dateTo) filter.createdAt.$lte = dayjs(dateTo).endOf('day').toDate()
    }

    const { data } = await this.repo.findAndCount(filter, { limit: 10000 })

    const stats: TaskStatistics = {
      totalTasks: data.length,
      completedTasks: data.filter(t => t.status === 'completed').length,
      pendingTasks: data.filter(t => t.status === 'pending').length,
      inProgressTasks: data.filter(t => t.status === 'in-progress').length,
      cancelledTasks: data.filter(t => t.status === 'cancelled').length,
      averageCompletionTime: 0,
      tasksByType: {
        cleaning: data.filter(t => t.taskType === 'cleaning').length,
        maintenance: data.filter(t => t.taskType === 'maintenance').length,
        inspection: data.filter(t => t.taskType === 'inspection').length,
        turndown: data.filter(t => t.taskType === 'turndown').length,
      },
      tasksByPriority: {
        low: data.filter(t => t.priority === 'low').length,
        normal: data.filter(t => t.priority === 'normal').length,
        high: data.filter(t => t.priority === 'high').length,
        urgent: data.filter(t => t.priority === 'urgent').length,
      },
    }

    // Calculate average completion time
    const completedTasksWithDuration = data.filter(
      t => t.status === 'completed' && t.actualDuration
    )
    if (completedTasksWithDuration.length > 0) {
      const totalDuration = completedTasksWithDuration.reduce(
        (sum, t) => sum + (t.actualDuration || 0),
        0
      )
      stats.averageCompletionTime = Math.round(totalDuration / completedTasksWithDuration.length)
    }

    return stats
  }

  async listTasks(query: {
    page?: number
    limit?: number
    roomId?: string
    reservationId?: string
    assignedTo?: string
    status?: 'pending' | 'in-progress' | 'completed' | 'cancelled' | string[]
    taskType?: 'cleaning' | 'maintenance' | 'inspection' | 'turndown' | string[]
    priority?: 'low' | 'normal' | 'high' | 'urgent' | string[]
    completedBy?: string
    dateFrom?: string | Date
    dateTo?: string | Date
    search?: string
    sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'priority'
    sortOrder?: 'asc' | 'desc'
  }) {
    const page = query.page && query.page > 0 ? query.page : 1
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
    const skip = (page - 1) * limit

    const filter: any = {}
    if (query.roomId) filter.roomId = query.roomId
    if (query.reservationId) filter.reservationId = query.reservationId
    if (query.assignedTo) filter.assignedTo = query.assignedTo
    
    // Handle array or string for filters
    if (query.status) {
      filter.status = Array.isArray(query.status) ? { $in: query.status } : query.status
    }
    if (query.taskType) {
      filter.taskType = Array.isArray(query.taskType) ? { $in: query.taskType } : query.taskType
    }
    if (query.priority) {
      filter.priority = Array.isArray(query.priority) ? { $in: query.priority } : query.priority
    }
    
    if (query.completedBy) filter.completedBy = query.completedBy
    
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {}
      if (query.dateFrom)
        filter.createdAt.$gte = dayjs(query.dateFrom).startOf('day').toDate()
      if (query.dateTo)
        filter.createdAt.$lte = dayjs(query.dateTo).endOf('day').toDate()
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i')
      filter.$or = [
        { roomId: searchRegex },
        { notes: searchRegex },
        // We can create a more complex search if needed, but this covers basics
      ]
    }

    const sortField = (query.sortBy || 'createdAt') as string
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1
    const sort = { [sortField]: sortOrder }

    const { data, total } = await this.repo.findAndCount(filter, {
      skip,
      limit,
      sort,
    })
    return { data, total, page, limit }
  }

  /**
   * Reassign a task to another staff member.
   * Only publishes an assigned event (so notifications go out).
   */
  async reassignTask(taskId: string, assignedTo: string, notes?: string) {
    const existing = await this.repo.findById(taskId)
    if (!existing) throw new NotFoundError('Task not found')

    const updated = await this.repo.reassignTask(taskId, assignedTo, notes)
    if (updated) {
      await this.publisher.publish(
        'housekeeping.events',
        'housekeeping.task.assigned',
        {
          event: 'housekeeping.task.assigned',
          data: updated,
          createdAt: new Date().toISOString(),
          meta: { reason: 'reassigned' },
        }
      )
    }
    return updated
  }
}
