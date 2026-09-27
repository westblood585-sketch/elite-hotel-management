import { useState } from 'react'
import { Workflow, WorkflowStep } from '@/services/workflowApi'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, ArrowDown } from 'lucide-react'

interface WorkflowBuilderProps {
  initialData: Workflow | null
  onSave: (data: Partial<Workflow>) => void
  onCancel: () => void
}

const WorkflowBuilder = ({ initialData, onSave, onCancel }: WorkflowBuilderProps) => {
  const [name, setName] = useState(initialData?.name || '')
  const [trigger, setTrigger] = useState(initialData?.trigger || 'manual')
  const [steps, setSteps] = useState<WorkflowStep[]>(initialData?.steps || [])

  const addStep = () => {
    const newStep: WorkflowStep = {
      stepId: steps.length + 1,
      type: 'create_task',
      params: {
        title: 'New Task',
        priority: 'normal',
        taskType: 'cleaning'
      }
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    // Reindex steps
    newSteps.forEach((step, i) => {
      step.stepId = i + 1
    })
    setSteps(newSteps)
  }

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps]
    if (field === 'type') {
      newSteps[index].type = value
      // Reset params based on type
      if (value === 'create_task') {
        newSteps[index].params = { title: 'New Task', priority: 'normal', taskType: 'cleaning' }
      } else if (value === 'wait') {
        newSteps[index].params = { delayMinutes: 30 }
      } else if (value === 'notify') {
        newSteps[index].params = { message: 'Workflow notification' }
      }
    } else {
      newSteps[index].params = { ...newSteps[index].params, [field]: value }
    }
    setSteps(newSteps)
  }

  const handleSave = () => {
    if (!name) return
    onSave({
      name,
      trigger: trigger as any,
      steps,
      isActive: true
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{initialData ? 'Edit Workflow' : 'Create Workflow'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <Card className="p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4">Workflow Settings</h3>
          <div className="space-y-4">
            <div>
              <Label>Workflow Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Checkout Protocol" />
            </div>
            <div>
              <Label>Trigger Event</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Trigger</SelectItem>
                  <SelectItem value="reservation_checkout">Guest Checkout</SelectItem>
                  <SelectItem value="task_completed">Task Completed</SelectItem>
                  <SelectItem value="room_status_change">Room Status Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Steps Builder */}
        <div className="lg:col-span-2 space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="p-6 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                      STEP {step.stepId}
                    </span>
                    <Select 
                      value={step.type} 
                      onValueChange={(v) => updateStep(index, 'type', v)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create_task">Create Task</SelectItem>
                        <SelectItem value="wait">Wait / Delay</SelectItem>
                        <SelectItem value="notify">Send Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeStep(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Step Params */}
                <div className="space-y-4">
                  {step.type === 'create_task' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Task Title</Label>
                          <Input 
                            value={step.params.title || ''} 
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            placeholder="Task Title"
                          />
                        </div>
                        <div>
                          <Label>Priority</Label>
                          <Select 
                            value={step.params.priority || 'normal'} 
                            onValueChange={(v) => updateStep(index, 'priority', v)}
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
                      <div>
                        <Label>Assign To</Label>
                        <Select 
                          value={step.params.assignTo || ''} 
                          onValueChange={(v) => updateStep(index, 'assignTo', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee strategy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="same_user">Same User (Triggerer)</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {step.type === 'wait' && (
                    <div>
                      <Label>Delay (Minutes)</Label>
                      <Input 
                        type="number" 
                        value={step.params.delayMinutes || 0} 
                        onChange={(e) => updateStep(index, 'delayMinutes', parseInt(e.target.value))}
                      />
                    </div>
                  )}

                  {step.type === 'notify' && (
                    <div>
                      <Label>Message</Label>
                      <Input 
                        value={step.params.message || ''} 
                        onChange={(e) => updateStep(index, 'message', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </Card>
              
              {index < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="text-gray-400" />
                </div>
              )}
            </div>
          ))}

          <Button variant="outline" className="w-full border-dashed py-8" onClick={addStep}>
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>

          <div className="flex justify-end gap-4 mt-8">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save Workflow</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkflowBuilder
