import { privateApi } from '@/services/instances/axiosConfig'

export interface HousekeepingTask {
  _id: string
  roomId: string
  reservationId?: string
  assignedTo?: string
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  estimatedDuration?: number
  actualDuration?: number
  completedBy?: string
  completedAt?: Date
  checklist?: { item: string; completed: boolean }[]
  notes?: string
  images?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateTaskData {
  roomId: string
  taskType: string
  priority: string
  assignedTo?: string
  estimatedDuration?: number
  notes?: string
  checklist?: { item: string }[]
}

export interface TaskFilters {
  status?: string
  priority?: string
  taskType?: string
  assignedTo?: string
  roomId?: string
  page?: number
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
}

export const housekeepingApi = {
  getTasks: async (params?: TaskFilters) => {
    const response = await privateApi.get<{
      tasks: HousekeepingTask[]
      pagination: {
        total: number
        page: number
        limit: number
        pages: number
      }
    }>('/housekeeping/tasks', { params })
    return response.data
  },

  getTask: async (id: string) => {
    const response = await privateApi.get<HousekeepingTask>(`/housekeeping/tasks/${id}`)
    return response.data
  },

  assignTask: async (data: CreateTaskData) => {
    const response = await privateApi.post<HousekeepingTask>('/housekeeping/tasks/assign', data)
    return response.data
  },

  reportIssue: async (data: { roomId: string; description: string; priority: string }) => {
    const response = await privateApi.post<HousekeepingTask>('/housekeeping/tasks/report', data)
    return response.data
  },

  updateTaskStatus: async (id: string, status: string) => {
    const response = await privateApi.patch<HousekeepingTask>(`/housekeeping/tasks/${id}/status`, { status })
    return response.data
  },

  updateChecklist: async (id: string, checklist: { item: string; completed: boolean }[]) => {
    const response = await privateApi.patch<HousekeepingTask>(`/housekeeping/tasks/${id}/checklist`, { checklist })
    return response.data
  },

  completeTask: async (id: string, data: { notes?: string; images?: string[] }) => {
    const response = await privateApi.post<HousekeepingTask>(`/housekeeping/tasks/${id}/complete`, data)
    return response.data
  },

  getStats: async () => {
    const response = await privateApi.get<{
      total: number
      pending: number
      inProgress: number
      completed: number
      byPriority: Record<string, number>
      byType: Record<string, number>
    }>('/housekeeping/statistics')
    return response.data
  },

  getRoomHistory: async (roomId: string) => {
    const response = await privateApi.get<HousekeepingTask[]>(`/housekeeping/rooms/${roomId}/history`)
    return response.data
  },

  getStaffTasks: async (staffId: string) => {
    const response = await privateApi.get<HousekeepingTask[]>(`/housekeeping/staff/${staffId}/tasks`)
    return response.data
  },
}
