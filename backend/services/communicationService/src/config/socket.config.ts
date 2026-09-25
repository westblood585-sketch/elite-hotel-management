import { Server, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { SocketUser } from '../types'
import { setupRedisAdapter } from './redis-adapter'
import { registerCallHandlers } from '../socket/callHandler'
import videochatRepository from '../repositories/videochat.repository'

const connectedUsers = new Map<string, SocketUser>()
const activeCallPartners = new Map<string, string>() // Key: UserId, Value: PartnerId

export const setActiveCallPair = (user1: string, user2: string) => {
    activeCallPartners.set(user1, user2);
    activeCallPartners.set(user2, user1);
}

export const clearActiveCallPair = (userId: string) => {
    const partnerId = activeCallPartners.get(userId);
    if (partnerId) {
        activeCallPartners.delete(partnerId);
        activeCallPartners.delete(userId);
    }
}

export const initializeSocketIO = async (httpServer: HTTPServer): Promise<Server> => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  // Setup Redis Adapter if configured
  if (process.env.REDIS_URL) {
    try {
      await setupRedisAdapter(io)
    } catch (error) {
      console.warn('⚠️ Failed to connect to Redis, falling back to in-memory adapter')
    }
  }

  // Authentication middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token
      
      if (!token) {
        return next(new Error('Authentication token required'))
      }

          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload
          // Standardize: Ensure userId is set from id
          socket.data.user = { ...decoded, userId: decoded.id }
          return next()
    } catch (error) {
      next(new Error('Invalid authentication token'))
    }
  })


  io.on('connection', (socket: Socket) => {
    const userPayload = socket.data.user as JwtPayload
    // Map token payload 'id' to 'userId' for consistency in this service
    const userId = userPayload.userId || userPayload.id
    
    console.log(`🔌 User connected: ${userId} (${userPayload.role})`)

    // Register user
    connectedUsers.set(userId, {
      userId: userId,
      userType: userPayload.role === 'admin' || userPayload.role === 'receptionist' || userPayload.role === 'staff' ? 'staff' : 'guest',
      role: userPayload.role,
      socketId: socket.id,
    })

    // Register Call Handlers
    registerCallHandlers(io, socket)

    // Handle disconnection
    socket.on('disconnect', async () => {
      const userPayload = socket.data.user as JwtPayload
      const userId = userPayload.userId || userPayload.id
      
      const existingUser = connectedUsers.get(userId)
      if (existingUser && existingUser.socketId === socket.id) {
        connectedUsers.delete(userId)
        console.log(`🔌 User disconnected: ${userId}`)
        
        // Handle Active Call Disconnect
        const partnerId = activeCallPartners.get(userId);
        if (partnerId) {
            console.log(`[Call] Partner ${userId} disconnected. Ending call for ${partnerId}`);
            const partnerSocket = connectedUsers.get(partnerId);
            if (partnerSocket) {
                io.to(partnerSocket.socketId).emit('call:ended', {
                    endedBy: userId,
                    reason: 'Partner disconnected'
                });
            }
            // Clear pair
            clearActiveCallPair(userId);
        }

        // DB Update: End any active sessions for this user
        try {
             const activeSession = await videochatRepository.findActiveCall(userId);
             if (activeSession) {
                 const endTime = new Date();
                 const startTime = activeSession.startTime ? new Date(activeSession.startTime) : new Date();
                 const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

                 await videochatRepository.updateStatus(activeSession.sessionId, 'ended', {
                     endTime,
                     duration,
                     metadata: { reason: 'User disconnected' }
                 });
                 console.log(`[Call] Auto-ended session ${activeSession.sessionId} due to disconnect`);
             }
        } catch (err) {
            console.error('[Call] Failed to auto-end session on disconnect:', err);
        }

      } else {
        // console.log(`🔌 Stale socket disconnected for user: ${userId} (ignored)`)
      }
    })
  })

  return io
}

export const getConnectedUser = (userId: string): SocketUser | undefined => {
  return connectedUsers.get(userId)
}

export const isUserOnline = (userId: string): boolean => {
  return connectedUsers.has(userId)
}

export const getOnlineStaff = (): { userId: string; role: string }[] => {
  const staff: { userId: string; role: string }[] = []
  connectedUsers.forEach((user) => {
    if (user.userType === 'staff') {
      staff.push({ userId: user.userId, role: user.role || 'staff' })
    }
  })
  return staff
}
