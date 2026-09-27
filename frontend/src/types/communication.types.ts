/**
 * Communication Service Type Definitions
 * Defines interfaces for chatbot conversations and video chat sessions
 */

// ============================================
// Chatbot Types
// ============================================

export type MessageSender = 'user' | 'bot' | 'agent';

export interface IMessage {
  sender: MessageSender;
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
}

export interface IConversationContext {
  guestId?: string;
  reservationId?: string;
  roomNumber?: string;
  userName?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  currentUrl?: string; // [NEW]
}

export type ConversationStatus = 'active' | 'closed' | 'handoff';

export interface IConversation {
  _id?: string;
  conversationId: string;
  userId: string;
  userType: 'guest' | 'staff';
  messages: IMessage[];
  context?: IConversationContext;
  status: ConversationStatus;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Video Chat Types
// ============================================

export type CallStatus = 'pending' | 'active' | 'ended' | 'rejected' | 'missed';
export type UserType = 'guest' | 'staff';

export interface ICallMetadata {
  reason?: string;
  notes?: string;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface IVideoChatSession {
  _id?: string;
  sessionId: string;
  callerId: string;
  receiverId: string;
  callerType: UserType;
  receiverType: UserType;
  status: CallStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  recordingUrl?: string;
  metadata?: ICallMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// WebSocket Event Types
// ============================================

export interface IICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface IICEServersEvent {
  iceServers: IICEServer[];
}

export interface ICallOfferEvent {
  sessionId: string;
  receiverId: string;
  offer: RTCSessionDescriptionInit;
}

export interface ICallIncomingEvent {
  sessionId: string;
  callerId: string;
  callerType: UserType;
  callerName?: string;
  offer: RTCSessionDescriptionInit;
}

export interface ICallAnswerEvent {
  sessionId: string;
  callerId: string;
  answer: RTCSessionDescriptionInit;
}

export interface ICallAnsweredEvent {
  sessionId: string;
  answer: RTCSessionDescriptionInit;
}

export interface IICECandidateEvent {
  sessionId: string;
  targetUserId: string;
  candidate: RTCIceCandidateInit;
}

export interface ICallRejectEvent {
  sessionId: string;
  callerId: string;
}

export interface ICallRejectedEvent {
  sessionId: string;
}

export interface ICallHangupEvent {
  sessionId: string;
  targetUserId: string;
}

export interface ICallEndedEvent {
  sessionId: string;
}

export interface ICallErrorEvent {
  message: string;
  sessionId?: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface IPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ICreateConversationRequest {
  context?: IConversationContext;
}

export interface ICreateConversationResponse {
  message: string;
  conversationId: string;
  conversation: IConversation;
}

export interface ISendMessageRequest {
  conversationId: string;
  message: string;
  image?: string; // [NEW]
}

export interface ISendMessageResponse {
  message: string;
  conversation: IConversation;
}

export interface IGetConversationsResponse {
  message: string;
  count: number;
  conversations: IConversation[];
  pagination?: IPagination;
}

export interface IGetConversationByIdResponse {
  message: string;
  conversation: IConversation;
}

export interface IUpdateContextRequest {
  context: IConversationContext;
}

export interface IUpdateContextResponse {
  message: string;
  conversation: IConversation;
}

export interface IHandoffToAgentRequest {
  conversationId: string;
  _id?: string; // Optional if needed for some calls
}

export interface IHandoffToAgentResponse {
  message: string;
  conversation: IConversation;
}

export interface ICloseConversationResponse {
  message: string;
  conversation: IConversation;
}

export interface IInitiateCallRequest {
  receiverId: string;
  receiverType: UserType;
  metadata?: {
    reason?: string;
  };
}

export interface IInitiateCallResponse {
  message: string;
  sessionId: string;
  session: IVideoChatSession;
}

export interface IUpdateCallStatusRequest {
  status: CallStatus;
  metadata?: ICallMetadata;
}

export interface IUpdateCallStatusResponse {
  message: string;
  session: IVideoChatSession;
}

export interface IGetCallHistoryResponse {
  message: string;
  count: number;
  calls: IVideoChatSession[];
  pagination?: IPagination;
}

export interface IGetActiveCallResponse {
  message: string;
  call: IVideoChatSession | null;
}

export interface IGetAllActiveCallsResponse {
  message: string;
  count: number;
  calls: IVideoChatSession[];
}

// ============================================
// Analytics/Logging Event Types
// ============================================

export interface ICommunicationAnalyticsEvent {
  eventType: 'conversation_created' | 'message_sent' | 'message_received' | 'conversation_closed' | 
             'handoff_requested' | 'call_initiated' | 'call_answered' | 'call_rejected' | 'call_ended';
  userId: string;
  userType: UserType;
  conversationId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ICommunicationMetrics {
  totalConversations: number;
  activeConversations: number;
  averageResponseTime: number; // in seconds
  handoffRate: number; // percentage
  totalCalls: number;
  activeCalls: number;
  averageCallDuration: number; // in seconds
  callSuccessRate: number; // percentage
}
