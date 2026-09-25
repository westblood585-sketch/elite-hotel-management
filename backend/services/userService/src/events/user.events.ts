// src/events/user.events.ts

export enum UserEventType {
    USER_CREATED = 'user.created',
    USER_UPDATED = 'user.updated',
    USER_DELETED = 'user.deleted',
    USER_APPROVED = 'user.approved',
    USER_VERIFIED = 'user.verified',
    USER_AVATAR_UPDATED = 'user.avatar.updated',
  }
  
  export interface UserEventPayload {
    eventType: UserEventType
    userId: string
    timestamp: Date
    data: {
      _id: string
      fullName: string
      email: string
      phoneNumber: string
      role: string
      isVerified: boolean
      isApproved: string
      avatar?: { publicId: string; url: string }
      createdAt: Date
      updatedAt: Date | null
    }
    metadata?: {
      updatedFields?: string[] // For USER_UPDATED events
    }
  }
