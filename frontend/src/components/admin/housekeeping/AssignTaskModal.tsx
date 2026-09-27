import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type CreateTaskData } from '@/services/housekeepingApi'
import { getUsersByRole, type UserProfile } from '@/services/userApi'
import { fetchRooms, type Room } from '@/services/adminApi'

interface AssignTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (data: CreateTaskData) => Promise<void>
}

const AssignTaskModal = ({ isOpen, onClose, onAssign }: AssignTaskModalProps) => {
  const [loading, setLoading] = useState(false)
  
  // Housekeeper search state
  const [housekeepers, setHousekeepers] = useState<UserProfile[]>([])
  const [hkSearchQuery, setHkSearchQuery] = useState('')
  const [isHkDropdownOpen, setIsHkDropdownOpen] = useState(false)
  
  // Room search state
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomSearchQuery, setRoomSearchQuery] = useState('')
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false)

  const [formData, setFormData] = useState<CreateTaskData>({
    roomId: '',
    taskType: 'cleaning',
    priority: 'normal',
    assignedTo: '',
    notes: '',
    estimatedDuration: 30,
  })

  useEffect(() => {
    if (isOpen) {
      fetchHousekeepers()
      loadRooms()
      // Reset form
      setFormData({
        roomId: '',
        taskType: 'cleaning',
        priority: 'normal',
        assignedTo: '',
        notes: '',
        estimatedDuration: 30,
      })
      setHkSearchQuery('')
      setRoomSearchQuery('')
    }
  }, [isOpen])

  const fetchHousekeepers = async () => {
    try {
      const data = await getUsersByRole('housekeeper')
      setHousekeepers(data)
    } catch (error) {
      console.error('Failed to fetch housekeepers:', error)
    }
  }

  const loadRooms = async () => {
    try {
      const response = await fetchRooms({ limit: 100 })
      setRooms(response.data)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onAssign(formData)
      onClose()
    } catch (error) {
      console.error('Failed to assign task:', error)
    } finally {
      setLoading(false)
    }
  }

  // Housekeeper filtering
  const filteredHousekeepers = housekeepers.filter(hk => 
    hk.fullName.toLowerCase().includes(hkSearchQuery.toLowerCase()) ||
    hk.email.toLowerCase().includes(hkSearchQuery.toLowerCase())
  )

  const handleSelectHousekeeper = (hk: UserProfile) => {
    setFormData({ ...formData, assignedTo: hk._id })
    setHkSearchQuery(hk.fullName)
    setIsHkDropdownOpen(false)
  }

  const handleHkSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHkSearchQuery(e.target.value)
    setIsHkDropdownOpen(true)
    if (formData.assignedTo) {
       setFormData({ ...formData, assignedTo: '' })
    }
  }

  // Room filtering
  const filteredRooms = rooms.filter(room => 
    room.number.toString().includes(roomSearchQuery) ||
    (room.type && room.type.toLowerCase().includes(roomSearchQuery.toLowerCase()))
  )

  const handleSelectRoom = (room: Room) => {
    setFormData({ ...formData, roomId: room.number.toString() }) // Assuming roomId is usually the room number string in this context, or use room._id if backend expects that. Keeping consistent with previous usage of 'e.g. 101' which implies number.
    setRoomSearchQuery(room.number.toString())
    setIsRoomDropdownOpen(false)
  }

  const handleRoomSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomSearchQuery(e.target.value)
    setIsRoomDropdownOpen(true)
    // Clear room if user types something new
    if (formData.roomId) {
        setFormData({ ...formData, roomId: '' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-visible">
        <DialogHeader>
          <DialogTitle>Assign New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label htmlFor="roomId">Room ID</Label>
               <Input
                id="room-search"
                required
                value={roomSearchQuery}
                onChange={handleRoomSearchChange}
                onFocus={() => setIsRoomDropdownOpen(true)}
                placeholder="Search..."
                autoComplete="off"
              />
              {isRoomDropdownOpen && roomSearchQuery && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto left-0">
                    {filteredRooms.length > 0 ? (
                        filteredRooms.map((room) => (
                            <div
                                key={room._id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => handleSelectRoom(room)}
                            >
                                <div className="font-medium">Room {room.number}</div>
                                <div className="text-xs text-gray-500">{room.type}</div>
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">No rooms found</div>
                    )}
                </div>
              )}
               {/* Keep actual roomId in state, validation logic uses formData.roomId */}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskType">Task Type</Label>
              <Select
                value={formData.taskType}
                onValueChange={(value) =>
                  setFormData({ ...formData, taskType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="turndown">Turndown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Est. Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedDuration: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="assignedTo">Assign To (Housekeeper)</Label>
            <Input
                id="housekeeper-search"
                value={hkSearchQuery}
                onChange={handleHkSearchChange}
                onFocus={() => setIsHkDropdownOpen(true)}
                placeholder="Search housekeeper..."
                autoComplete="off"
            />
            {isHkDropdownOpen && hkSearchQuery && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto left-0">
                    {filteredHousekeepers.length > 0 ? (
                        filteredHousekeepers.map((hk) => (
                            <div
                                key={hk._id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => handleSelectHousekeeper(hk)}
                            >
                                <div className="font-medium">{hk.fullName}</div>
                                <div className="text-xs text-gray-500">{hk.email}</div>
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">No housekeepers found</div>
                    )}
                </div>
            )}
             <input type="hidden" name="assignedTo" value={formData.assignedTo} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Special instructions..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AssignTaskModal
