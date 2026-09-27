import { useState, useEffect } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, AlertTriangle, ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import EmptyState from '@/components/common/EmptyState'
import {
  housekeepingApi,
  type HousekeepingTask,
  type CreateTaskData,
} from '@/services/housekeepingApi'
import HousekeepingStats from '@/components/admin/housekeeping/HousekeepingStats'
import AssignTaskModal from '@/components/admin/housekeeping/AssignTaskModal'
import TaskDetailModal from '@/components/admin/housekeeping/TaskDetailModal'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface StatsData {
  total: number
  pending: number
  inProgress: number
  completed: number
  byPriority: Record<string, number>
  byType: Record<string, number>
}

const Housekeeping = () => {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([])
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    byPriority: {},
    byType: {},
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tasksRes, statsRes] = await Promise.all([
        housekeepingApi.getTasks({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch || undefined
        }),
        housekeepingApi.getStats(),
      ])

      setTasks(tasksRes.tasks)
      setTotalItems(tasksRes.pagination?.total || 0)
      setTotalPages(tasksRes.pagination?.pages || 1)
      setStats(statsRes)
    } catch (err) {
      console.error('Failed to fetch housekeeping data:', err)
      setError('Failed to load housekeeping data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter, priorityFilter, currentPage, debouncedSearch])

  const handleAssignTask = async (data: CreateTaskData) => {
    try {
      await housekeepingApi.assignTask(data)
      fetchData() // Refresh list
    } catch (err) {
      console.error('Failed to assign task:', err)
      throw err // Let modal handle error display if needed
    }
  }

  const handleViewTask = (task: HousekeepingTask) => {
    setSelectedTask(task)
    setIsDetailModalOpen(true)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

      <div className="max-w-[1920px] mx-auto relative z-10 space-y-6 px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900">Housekeeping</h1>
            <p className="text-gray-500 mt-2 font-medium">
              Manage cleaning tasks, room status, and staff assignments.
            </p>
          </div>
          <Button 
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-6 rounded-xl shadow-lg shadow-gray-900/20 transition-all hover:scale-105"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Task
          </Button>
        </div>

        <HousekeepingStats stats={stats} />

        <div className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder-gray-400 font-medium transition-all"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[160px]"
            >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
            </select>
            <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[160px]"
            >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden min-h-[400px]">
          {error && (
             <div className="p-8 flex justify-center">
                <EmptyState 
                   title="Error loading tasks"
                   description={error}
                   icon={AlertTriangle}
                   action={{ label: "Retry", onClick: fetchData }}
                />
             </div>
          )}
          
          {loading ? (
             <div className="p-6">
                <TableSkeleton rows={10} />
             </div>
          ) : !tasks || tasks?.length === 0 ? (
             <div className="flex items-center justify-center h-[400px]">
                <EmptyState
                   title={searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No tasks found' : 'No housekeeping tasks'}
                   description="Tasks will appear here once assigned."
                   icon={ClipboardList}
                />
             </div>
          ) : (
             <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200/50 bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <AnimatePresence>
                    {tasks.map((task, idx) => (
                      <motion.tr
                        key={task._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-white/80 transition-colors cursor-pointer"
                        onClick={() => handleViewTask(task)}
                      >
                        <td className="px-6 py-3 whitespace-nowrap">
                            <span className="font-bold text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm shadow-sm">
                                Room {task.roomId}
                            </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap capitalize text-sm font-bold text-gray-800">
                            {task.taskType.replace('-', ' ')}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${getStatusColor(task.status)}`}>
                            {task.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 font-medium">
                          {task.assignedTo ? (
                              <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                      {task.assignedTo.charAt(0).toUpperCase()}
                                  </div>
                                  {task.assignedTo}
                              </div>
                          ) : (
                              <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(task.createdAt), 'MMM d, HH:mm')}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right">
                          <Button 
                             variant="ghost" 
                             size="sm" 
                             className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 text-blue-600"
                             onClick={(e) => {
                               e.stopPropagation()
                               handleViewTask(task)
                             }}
                          >
                            View Details
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                    </AnimatePresence>
                  </tbody>
                </table>
             </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm">
            <div className="text-sm font-medium text-gray-500">
                Page <span className="text-gray-900 font-bold">{currentPage}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-full p-0 flex items-center justify-center bg-white hover:bg-gray-50 border-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Simplified pagination logic for better UI
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-full p-0 flex items-center justify-center transition-all ${
                          currentPage === pageNum 
                          ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-105 hover:bg-gray-800 hover:text-white" 
                          : "bg-white text-gray-500 hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-full p-0 flex items-center justify-center bg-white hover:bg-gray-50 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <AssignTaskModal 
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={handleAssignTask}
        />

        {selectedTask && (
          <TaskDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false)
              setSelectedTask(null)
            }}
            task={selectedTask}
          />
        )}
      </div>
    </div>
  )
}

export default Housekeeping
