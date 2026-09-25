import VideoChatSession, { IVideoChatSession, CallStatus, UserType } from '../models/videoChatSession.model'
import mongoose from 'mongoose'

export class VideoChatRepository {
  async create(data: {
    sessionId: string
    callerId: string
    receiverId: string
    callerType: UserType
    receiverType: UserType
    status?: CallStatus
    startTime?: Date
  }): Promise<IVideoChatSession> {
    return await VideoChatSession.create({
      ...data,
      startTime: data.startTime || new Date(),
    })
  }

  async findBySessionId(sessionId: string): Promise<IVideoChatSession | null> {
    return await VideoChatSession.findOne({ sessionId })
  }

  async updateStatus(
    sessionId: string,
    status: CallStatus,
    additionalData?: {
      endTime?: Date
      duration?: number
      metadata?: any
    }
  ): Promise<IVideoChatSession | null> {
    const updateData: any = { status, ...additionalData }
    
    return await VideoChatSession.findOneAndUpdate(
      { sessionId },
      updateData,
      { new: true }
    )
  }

  async findCallHistory(
    userId: string,
    limit: number = 50
  ): Promise<IVideoChatSession[]> {
    return await VideoChatSession.find({
      $or: [{ callerId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
  }

  async findAllCallHistory(limit: number = 50): Promise<IVideoChatSession[]> {
    return await VideoChatSession.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
  }

  async findActiveCall(userId: string): Promise<IVideoChatSession | null> {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    return await VideoChatSession.findOne({
      $and: [
        { $or: [{ callerId: userId }, { receiverId: userId }] },
        { 
          $or: [
            { status: 'active' },
            { status: 'pending', startTime: { $gt: twoMinutesAgo } }
          ]
        }
      ]
    })
  }

  async findAllActiveCalls(): Promise<IVideoChatSession[]> {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    return await VideoChatSession.find({
      $or: [
        { status: 'active' },
        { status: 'pending', startTime: { $gt: twoMinutesAgo } }
      ]
    }).sort({ startTime: -1 })
  }

  async updateEndTimeAndDuration(
    sessionId: string,
    endTime: Date,
    duration: number
  ): Promise<IVideoChatSession | null> {
    return await VideoChatSession.findOneAndUpdate(
      { sessionId },
      { endTime, duration },
      { new: true }
    )
  }

  async addMetadata(
    sessionId: string,
    metadata: {
      reason?: string
      notes?: string
      quality?: 'excellent' | 'good' | 'fair' | 'poor'
    }
  ): Promise<IVideoChatSession | null> {
    return await VideoChatSession.findOneAndUpdate(
      { sessionId },
      { $set: { metadata } },
      { new: true }
    )
  }
}

export default new VideoChatRepository()
