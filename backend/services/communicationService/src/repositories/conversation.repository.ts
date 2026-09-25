import Conversation, { IConversation, IMessage } from '../models/conversation.model'
import mongoose from 'mongoose'

export interface ConversationContext {
  guestId?: string
  reservationId?: string
  roomNumber?: string
  userName?: string
  checkInDate?: Date
  checkOutDate?: Date
  currentUrl?: string
}

export class ConversationRepository {
  async create(data: {
    conversationId: string
    userId: string
    userType: 'guest' | 'staff'
    context?: ConversationContext
    language?: string
  }): Promise<IConversation> {
    return await Conversation.create({
      ...data,
      messages: [],
      status: 'active',
      language: data.language || 'en',
    })
  }

  async findByConversationId(conversationId: string): Promise<IConversation | null> {
    return await Conversation.findOne({ conversationId })
  }

  async findByUserId(userId: string, limit: number = 20): Promise<IConversation[]> {
    return await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
  }

  async findAll(limit: number = 20, page: number = 1): Promise<{ conversations: IConversation[], total: number }> {
    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      Conversation.find().sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Conversation.countDocuments()
    ]);
    return { conversations, total };
  }

  async addMessage(
    conversationId: string,
    message: IMessage
  ): Promise<IConversation | null> {
    return await Conversation.findOneAndUpdate(
      { conversationId },
      { $push: { messages: message } },
      { new: true }
    )
  }

  async addMessages(
    conversationId: string,
    messages: IMessage[]
  ): Promise<IConversation | null> {
    return await Conversation.findOneAndUpdate(
      { conversationId },
      { $push: { messages: { $each: messages } } },
      { new: true }
    )
  }

  async updateContext(
    conversationId: string,
    context: Partial<ConversationContext>
  ): Promise<IConversation | null> {
    return await Conversation.findOneAndUpdate(
      { conversationId },
      { $set: { context } },
      { new: true }
    )
  }

  async updateStatus(
    conversationId: string,
    status: 'active' | 'closed' | 'handoff'
  ): Promise<IConversation | null> {
    return await Conversation.findOneAndUpdate(
      { conversationId },
      { status },
      { new: true }
    )
  }

  async findActiveConversations(limit: number = 50): Promise<IConversation[]> {
    return await Conversation.find({ status: 'active' })
      .sort({ updatedAt: -1 })
      .limit(limit)
  }

  async findHandoffConversations(limit: number = 50): Promise<IConversation[]> {
    return await Conversation.find({ status: 'handoff' })
      .sort({ updatedAt: -1 })
      .limit(limit)
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    const result = await Conversation.deleteOne({ conversationId })
    return result.deletedCount > 0
  }
}

export default new ConversationRepository()
