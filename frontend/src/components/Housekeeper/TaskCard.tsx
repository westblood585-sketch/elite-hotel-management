import React, { useState } from 'react'
import { CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import TaskStatusBadge, { type TaskStatus } from './TaskStatusBadge'
import type { HousekeepingTask } from '@/services/housekeepingApi'

// Extended interface to include fields from the hook aggregation
interface ExtendedTask extends HousekeepingTask {
  roomNumber?: string
  roomType?: string
  roomName?: string
}

interface TaskCardProps {
  task: ExtendedTask
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onChecklistItemToggle: (taskId: string, itemIdx: number) => void
  onReportIssue: (taskId: string) => void
  onComplete: (taskId: string, notes?: string) => void
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onStatusChange, 
  onChecklistItemToggle,
  onReportIssue,
  onComplete
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [completionNotes, setCompletionNotes] = useState(task.notes || '')

  const checklist = task.checklist || [] 
  const progress = checklist.length > 0
    ? Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100)
    : 0

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  const roomDisplay = task.roomNumber || task.roomName || task.roomId || 'Unknown Room'
  const roomTypeDisplay = task.roomType || 'Standard'

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md dark:bg-gray-800/80 dark:border-gray-700">
      {/* Card Header - Always visible */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {roomDisplay}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                {roomTypeDisplay}
              </span>
              {task.priority && (
                 <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-700 border border-red-200' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                    task.priority === 'low' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    'bg-gray-100 text-gray-600 border border-gray-200'
                 }`}>
                   {task.priority}
                 </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock size={14} />
              <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>

        {/* Progress Bar (if active and has checklist) */}
        {task.status === 'in-progress' && checklist.length > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2">
            {task.status === 'pending' && (
              <button
                onClick={(e) => handleAction(e, () => onStatusChange(task._id, 'in-progress'))}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md active:scale-95 transition-transform"
              >
                Start Task
              </button>
            )}
            {task.status === 'in-progress' && (
              <button
                 onClick={(e) => handleAction(e, () => setIsExpanded(true))}
                 className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium dark:bg-gray-700 dark:text-gray-200"
              >
                View Details
              </button>
            )}
            {task.status === 'in-progress' && (progress === 100 || checklist.length === 0) && (
               <button
               onClick={(e) => handleAction(e, () => onComplete(task._id, completionNotes))}
               className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md active:scale-95 transition-transform"
             >
               Finish
             </button>
            )}
          </div>
          
          <button className="text-gray-400">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 dark:bg-gray-700/30 dark:border-gray-700 space-y-4">
          {/* Checklist */}
          {checklist.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wider dark:text-white">Checklist</h4>
              <div className="space-y-2">
                {checklist.map((item, idx) => (
                  <label 
                    key={idx} 
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer dark:bg-gray-800 dark:border-gray-600"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onChecklistItemToggle(task._id, idx)}
                      disabled={task.status === 'completed'}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                      {item.item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes & Actions */}
          <div className="pt-2">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wider dark:text-white">Notes</h4>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Add notes about this task..."
              disabled={task.status === 'completed'}
              className="w-full p-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
               onClick={() => onReportIssue(task._id)}
               className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <AlertTriangle size={16} />
              Report Issue
            </button>
            
            {task.status !== 'completed' && (
              <button
                onClick={() => onComplete(task._id, completionNotes)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md active:scale-95 transition-transform flex justify-center items-center gap-2"
              >
                <CheckCircle size={16} />
                Complete Task
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskCard

