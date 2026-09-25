import { Request } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import mongoose from 'mongoose'

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export type CallStatus = 'pending' | 'active' | 'ended' | 'rejected' | 'missed'
export type UserType = 'guest' | 'staff'

export interface IceCandidate {
  candidate: string
  sdpMLineIndex: number | null
  sdpMid: string | null
}

export interface WebRTCOffer {
  type: 'offer'
  sdp: string
}

export interface WebRTCAnswer {
  type: 'answer'
  sdp: string
}

export interface CallInitiateData {
  receiverId: string
  receiverType: UserType
}

export interface SocketUser {
  userId: string
  userType: UserType
  role?: string // 'admin', 'receptionist', 'guest'
  socketId: string
}

export interface Message {
  sender: 'user' | 'bot' | 'agent'
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
}

export interface ConversationContext {
  guestId?: mongoose.Types.ObjectId
  reservationId?: mongoose.Types.ObjectId
  roomNumber?: string
  userName?: string
  checkInDate?: Date
  checkOutDate?: Date
}
