import { HousekeepingTaskDoc, ChecklistItem } from '../../models/housekeeping.model'

/**
 * Payload for assigning a housekeeping task
 */
export interface AssignTaskPayload {
  roomId: string
  reservationId?: string
  assignedTo?: string
  taskType?: 'cleaning' | 'maintenance' | 'inspection' | 'turndown'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  estimatedDuration?: number
  notes?: string
  checklist?: ChecklistItem[]
  idempotencyKey?: string
}

/**
 * Payload for completing a task
 */
export interface CompleteTaskPayload {
  notes?: string
  actualDuration?: number
  checklist?: ChecklistItem[]
  images?: string[]
}

/**
 * Task statistics
 */
export interface TaskStatistics {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  inProgressTasks: number
  cancelledTasks: number
  averageCompletionTime: number // in minutes
  tasksByType: {
    cleaning: number
    maintenance: number
    inspection: number
    turndown: number
  }
  tasksByPriority: {
    low: number
    normal: number
    high: number
    urgent: number
  }
}

/**
 * Contract for HousekeepingService
 */
export interface IHousekeepingService {
  // Core operations
  assignTask(payload: AssignTaskPayload): Promise<HousekeepingTaskDoc>
  completeTask(
    taskId: string,
    payload: CompleteTaskPayload,
    completedBy?: string
  ): Promise<HousekeepingTaskDoc | null>
  getTask(taskId: string): Promise<HousekeepingTaskDoc | null>
  
  // New enhanced operations
  updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled',
    notes?: string
  ): Promise<HousekeepingTaskDoc | null>
  
  updateChecklist(
    taskId: string,
    checklist: ChecklistItem[]
  ): Promise<HousekeepingTaskDoc | null>
  
  bulkAssignTasks(
    assignedTo: string,
    roomIds: string[],
    taskType?: 'cleaning' | 'maintenance' | 'inspection' | 'turndown'
  ): Promise<HousekeepingTaskDoc[]>
  
  getTasksByStaff(
    staffId: string,
    date?: Date
  ): Promise<HousekeepingTaskDoc[]>
  
  getRoomHistory(
    roomId: string,
    limit?: number
  ): Promise<HousekeepingTaskDoc[]>
  
  getTaskStatistics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<TaskStatistics>
}
