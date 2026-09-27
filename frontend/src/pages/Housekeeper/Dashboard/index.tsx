import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Clock, RefreshCw, ClipboardList } from 'lucide-react'
import EmptyState from '@/components/common/EmptyState'
import { format } from 'date-fns'
import { useHousekeeperDashboard } from '@/Hooks/useDashboardData'
import { LoadingWidget } from '@/components/shared/LoadingWidget'
import { ErrorWidget } from '@/components/shared/ErrorWidget'
import { toast } from 'sonner'
import TaskCard from '@/components/Housekeeper/TaskCard'
import { housekeepingApi } from '@/services/housekeepingApi'
import { Button } from '@/components/ui/button'

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
)

const Dashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useHousekeeperDashboard()
  const [filter, setFilter] = useState('all') // 'all', 'urgent', 'pending'
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  
  if (isLoading) return <LoadingWidget variant="grid" count={4} />
  if (error) return <ErrorWidget title="Error" message="Failed to load dashboard" severity="error" />

  const tasks = data?.assignedTasks || []
  
  // Stats calculation
  const urgentCount = tasks.filter((t: any) => t.priority === 'urgent').length
  const pendingCount = tasks.filter((t: any) => t.status === 'pending').length
  const completedCount = tasks.filter((t: any) => t.status === 'completed').length

  const filteredTasks = tasks.filter((t: any) => {
    if (filter === 'urgent') return t.priority === 'urgent'
    if (filter === 'pending') return t.status === 'pending'
    return true
  })

  // Sort by priority
  const sortedTasks = [...filteredTasks].sort((a: any, b: any) => {
    const priorityWeight = { urgent: 3, high: 2, normal: 1, low: 0 }
    return (priorityWeight[b.priority as keyof typeof priorityWeight] || 0) - 
           (priorityWeight[a.priority as keyof typeof priorityWeight] || 0)
  })

  // --- Handlers ---

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await housekeepingApi.updateTaskStatus(taskId, newStatus)
      toast.success(`Task marked as ${newStatus}`)
      refetch()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleChecklistToggle = async (taskId: string, itemIdx: number) => {
    const task = tasks.find((t: any) => t._id === taskId)
    if (!task || !task.checklist) return

    const newChecklist = [...task.checklist]
    newChecklist[itemIdx] = { ...newChecklist[itemIdx], completed: !newChecklist[itemIdx].completed }

    try {
      // Optimistic update could go here, but for now we wait
      await housekeepingApi.updateChecklist(taskId, newChecklist)
      refetch()
    } catch (error) {
      toast.error('Failed to update checklist')
    }
  }

  const handleComplete = async (taskId: string, notes?: string) => {
    try {
      await housekeepingApi.completeTask(taskId, { notes })
      toast.success('Task completed! Great job.')
      refetch()
    } catch (error) {
      toast.error('Failed to complete task')
    }
  }

  const handleReportIssue = (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsReportModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={AlertCircle} label="Urgent Tasks" value={urgentCount} color="bg-red-500" />
        <StatCard icon={Clock} label="Pending" value={pendingCount} color="bg-orange-500" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedCount} color="bg-green-500" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'urgent', 'pending'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors whitespace-nowrap ${
              filter === f 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-4">
        {sortedTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 flex justify-center">
             <EmptyState
                title="No tasks found"
                description={filter !== 'all' ? `No ${filter} tasks assigned.` : "You have no assigned tasks."}
                icon={ClipboardList}
             />
          </div>
        ) : (
          sortedTasks.map((task: any) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={task._id}
              transition={{ duration: 0.2 }}
            >
              <TaskCard 
                task={task}
                onStatusChange={handleStatusChange}
                onChecklistItemToggle={handleChecklistToggle}
                onReportIssue={handleReportIssue}
                onComplete={handleComplete}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Simple Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
                 <h3 className="text-lg font-bold">Report Issue</h3>
                 <p className="text-gray-500 text-sm">Describe the maintenance issue found in the room.</p>
                 <textarea 
                    className="w-full border rounded-xl p-3 h-32 focus:ring-2 focus:ring-slate-900 outline-none resize-none" 
                    placeholder="e.g. Broken lamp, Leaking tap..."
                    id="issue-description"
                 />
                 <div className="flex justify-end gap-3">
                     <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
                     <Button 
                        className="bg-red-600 hover:bg-red-700 text-white" 
                        onClick={async () => {
                            const desc = (document.getElementById('issue-description') as HTMLTextAreaElement).value
                            if (!desc) return toast.error("Please describe the issue")
                            
                            if (selectedTaskId) {
                              const task = tasks.find((t: any) => t._id === selectedTaskId)
                              try {
                                await housekeepingApi.reportIssue({
                                  roomId: task?.roomId?._id || task?.roomId, // Handle populated or ID
                                  description: desc,
                                  priority: 'high'
                                })
                                toast.success("Issue reported to maintenance")
                                setIsReportModalOpen(false)
                              } catch (e) {
                                toast.error("Failed to report issue")
                              }
                            }
                        }}
                     >
                        Report Issue
                     </Button>
                 </div>
             </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
