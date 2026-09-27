import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { type HousekeepingTask } from '@/services/housekeepingApi'
import { format } from 'date-fns'
import { CheckCircle2, Clock, User, AlertCircle } from 'lucide-react'

interface TaskDetailModalProps {
  task: HousekeepingTask | null
  isOpen: boolean
  onClose: () => void
}

const TaskDetailModal = ({ task, isOpen, onClose }: TaskDetailModalProps) => {
  if (!task) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle className="text-xl">
              Task Details - Room {task.roomId}
            </DialogTitle>
            <Badge className={getStatusColor(task.status)}>
              {task.status.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Key Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Task Type</span>
                <p className="font-medium capitalize">{task.taskType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Priority</span>
                <p className="font-medium capitalize flex items-center gap-2">
                  {task.priority === 'urgent' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {task.priority}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Assigned To</span>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {task.assignedTo || 'Unassigned'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Created At</span>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(task.createdAt), 'PPp')}
                </p>
              </div>
            </div>

            <Separator />

            {/* Checklist */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Checklist</h4>
                <div className="space-y-2">
                  {task.checklist.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-md bg-gray-50"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          item.completed ? 'text-green-500' : 'text-gray-300'
                        }`}
                      />
                      <span
                        className={
                          item.completed
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900'
                        }
                      >
                        {item.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {task.notes && (
              <div className="space-y-2">
                <h4 className="font-medium">Notes</h4>
                <div className="p-3 bg-yellow-50 rounded-md text-sm text-yellow-900">
                  {task.notes}
                </div>
              </div>
            )}

            {/* Completion Info */}
            {task.status === 'completed' && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4 bg-green-50 p-4 rounded-md">
                  <div className="space-y-1">
                    <span className="text-sm text-green-700">Completed By</span>
                    <p className="font-medium text-green-900">
                      {task.completedBy || 'Unknown'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-green-700">Completed At</span>
                    <p className="font-medium text-green-900">
                      {task.completedAt
                        ? format(new Date(task.completedAt), 'PPp')
                        : '-'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TaskDetailModal
