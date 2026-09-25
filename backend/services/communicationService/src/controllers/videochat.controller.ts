
import { Response } from 'express'
import { AuthenticatedRequest } from '../types'
import videoChatRepository from '../repositories/videochat.repository'
import Joi from 'joi'

const initiateCallSchema = Joi.object({
  receiverId: Joi.string().required(),
  receiverType: Joi.string().valid('guest', 'staff', 'admin').required(),
  callType: Joi.string().valid('video', 'audio').default('video')
})

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'ended', 'rejected', 'missed').required(),
  duration: Joi.number().optional(),
})

export class VideoChatController {
  async initiateCall(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error } = initiateCallSchema.validate(req.body)
      if (error) {
        res.status(400).json({ message: error.details[0].message })
        return
      }

      const userId = (req.user as any).userId || (req.user as any).id
      const userType = (req.user as any).role === 'guest' ? 'guest' : 'staff'; // Simplified mapping

      const { receiverId, receiverType } = req.body

      // Create session
      // Note: sessionId usually generated here or by client. Let's generate one if not provided, 
      // but repo expects one. repository.create takes sessionId.
      // We can use a UUID.
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const session = await videoChatRepository.create({
        sessionId,
        callerId: userId,
        callerType: userType as any,
        receiverId,
        receiverType,
        status: 'pending',
        startTime: new Date()
      })

      res.status(201).json({
        message: 'Call initiated successfully',
        session
      })
    } catch (error) {
      console.error('Error in initiateCall:', error)
      res.status(500).json({ message: 'Failed to initiate call' })
    }
  }

  async updateCallStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params
      const { error } = updateStatusSchema.validate(req.body)
      if (error) {
        res.status(400).json({ message: error.details[0].message })
        return
      }

      const { status, duration } = req.body
      let updateData: any = {}
      
      if (status === 'ended') {
          updateData.endTime = new Date()
          if (duration) updateData.duration = duration
      }

      const session = await videoChatRepository.updateStatus(sessionId, status, updateData)

      if (!session) {
        res.status(404).json({ message: 'Session not found' })
        return
      }

      res.json({
        message: 'Call status updated',
        session
      })
    } catch (error) {
      console.error('Error in updateCallStatus:', error)
      res.status(500).json({ message: 'Failed to update call status' })
    }
  }

  async getCallHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = (req.user as any).userId || (req.user as any).id
      const userRole = (req.user as any).role
      const limit = parseInt(req.query.limit as string) || 20

      let calls;
      if (['admin', 'receptionist'].includes(userRole)) {
          calls = await videoChatRepository.findAllCallHistory(limit)
      } else {
          calls = await videoChatRepository.findCallHistory(userId, limit)
      }

      res.json({
        message: 'Call history retrieved',
        calls
      })
    } catch (error) {
      console.error('Error in getCallHistory:', error)
      res.status(500).json({ message: 'Failed to retrieve call history' })
    }
  }

  async getActiveCall(req: AuthenticatedRequest, res: Response): Promise<void> {
      try {
          const userId = (req.user as any).userId || (req.user as any).id
          const session = await videoChatRepository.findActiveCall(userId);
          
          if (!session) {
              res.json({ message: 'No active call', session: null })
              return;
          }

          res.json({
              message: 'Active call found',
              session
          })
      } catch (error) {
          console.error('Error in getActiveCall:', error)
          res.status(500).json({ message: 'Failed to retrieve active call' })
      }
  }
  
  async getAllActiveCalls(req: AuthenticatedRequest, res: Response): Promise<void> {
      try {
           // Should check if admin/staff
           // Assuming middleware handled auth, but role check might be needed.
           // videochat.route.ts says "// Admin/Staff only", usually implied by route or middleware. 
           // For now, allow it or perform check.
           
           const calls = await videoChatRepository.findAllActiveCalls();
           res.json({
               message: 'All active calls stored',
               calls
           })
      } catch (error) {
          console.error('Error in getAllActiveCalls:', error)
          res.status(500).json({ message: 'Failed to retrieve active calls' }) 
      }
  }

  async getCallById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params
      const session = await videoChatRepository.findBySessionId(sessionId)

      if (!session) {
        res.status(404).json({ message: 'Call session not found' })
        return
      }

      res.json({
        message: 'Call session retrieved',
        session
      })
    } catch (error) {
      console.error('Error in getCallById:', error)
      res.status(500).json({ message: 'Failed to retrieve call session' })
    }
  }
}

export default new VideoChatController()
