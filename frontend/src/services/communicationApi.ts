/**
 * Communication API Service
 * Handles all HTTP requests to the communication service
 */

import { privateApi } from './instances/axiosConfig';
import type {
  ICreateConversationRequest,
  ICreateConversationResponse,
  ISendMessageRequest,
  ISendMessageResponse,
  IGetConversationsResponse,
  IGetConversationByIdResponse,
  IUpdateContextRequest,
  IUpdateContextResponse,
  IHandoffToAgentRequest,
  IHandoffToAgentResponse,
  ICloseConversationResponse,
  IGetCallHistoryResponse,
  IGetAllActiveCallsResponse,
} from '../types/communication.types';

const CHATBOT_BASE = '/communication/api/chat';


// ============================================
// Chatbot API
// ============================================

/**
 * Create a new chatbot conversation
 */
export const createConversation = async (
  data?: ICreateConversationRequest
): Promise<ICreateConversationResponse> => {
  const response = await privateApi.post<ICreateConversationResponse>(
    `${CHATBOT_BASE}/conversation`,
    data || {}
  );
  return response.data;
};



/**
 * Generate a guest token
 */
export const generateGuestToken = async (
  name: string,
  guestId?: string
): Promise<{ token: string; guestId: string; name: string }> => {
  // Use a direct axios call to avoid interceptors for this specific public endpoint if needed,
  // but since it's public (before auth middleware), standard instance is fine.
  // We use privateApi because the base URL is correct, and the auth header won't hurt (or we can use api if authBaseUrl != apiBaseUrl).
  // Checking axiosConfig: privateApi base is apiBaseUrl. api base is authBaseUrl.
  // The route is in communicationService, usually under /api/communication... likely on apiBaseUrl.
  // So privateApi is correct instance but we might need to be careful if it sends an invalid token.
  // However, our interceptor now sends guest_token if token is missing. If both missing, no header.
  const response = await privateApi.post<{ token: string; guestId: string; name: string }>(
    `${CHATBOT_BASE}/guest-token`,
    { name, guestId }
  );
  return response.data;
};

/**
 * Get all conversations for the current user
 */
export const getConversations = async (page: number = 1, limit: number = 20): Promise<IGetConversationsResponse> => {
  const response = await privateApi.get<IGetConversationsResponse>(
    `${CHATBOT_BASE}/conversations`,
    { params: { page, limit } }
  );
  return response.data;
};

/**
 * Get a specific conversation by ID
 */
export const getConversationById = async (
  conversationId: string
): Promise<IGetConversationByIdResponse> => {
  const response = await privateApi.get<IGetConversationByIdResponse>(
    `${CHATBOT_BASE}/conversation/${conversationId}`
  );
  return response.data;
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  data: ISendMessageRequest
): Promise<ISendMessageResponse> => {
  const response = await privateApi.post<ISendMessageResponse>(
    `${CHATBOT_BASE}/message`,
    data
  );
  return response.data;
};

/**
 * Update conversation context
 */
export const updateContext = async (
  conversationId: string,
  data: IUpdateContextRequest
): Promise<IUpdateContextResponse> => {
  const response = await privateApi.put<IUpdateContextResponse>(
    `${CHATBOT_BASE}/context/${conversationId}`,
    data
  );
  return response.data;
};

/**
 * Hand off conversation to a human agent
 */
export const handoffToAgent = async (data: { conversationId: string }) => {
  const response = await privateApi.post(`${CHATBOT_BASE}/handoff`, data)
  return response.data
}

/**
 * Return conversation to bot
 */
export const returnToBot = async (data: { conversationId: string }) => {
  const response = await privateApi.post(`${CHATBOT_BASE}/return-to-bot`, data)
  return response.data
}

/**
 * Close a conversation
 */
export const closeConversation = async (
  conversationId: string
): Promise<ICloseConversationResponse> => {
  const response = await privateApi.delete<ICloseConversationResponse>(
    `${CHATBOT_BASE}/conversation/${conversationId}`
  );
  return response.data;
};
// ============================================
// Video Chat API
// ============================================

const VIDEO_BASE = '/communication/api/video';

/**
 * Get call history
 */
export const getCallHistory = async (page: number = 1, limit: number = 20): Promise<IGetCallHistoryResponse> => {
  const response = await privateApi.get<IGetCallHistoryResponse>(
    `${VIDEO_BASE}/history`,
    { params: { page, limit } }
  );
  return response.data;
};

/**
 * Get all active calls (Admin/Staff)
 */
export const getAllActiveCalls = async (): Promise<IGetAllActiveCallsResponse> => {
  const response = await privateApi.get<IGetAllActiveCallsResponse>(
    `${VIDEO_BASE}/admin/active-calls`
  );
  return response.data;
};

/**
 * Log a communication event
 */
export const logCommunicationEvent = async (
  event: string,
  metadata?: Record<string, any>
): Promise<void> => {
  console.log(`[Communication Event] ${event}`, metadata);
  // Placeholder for future backend analytics call
  // await privateApi.post(`${CHATBOT_BASE}/events`, { event, metadata });
};
