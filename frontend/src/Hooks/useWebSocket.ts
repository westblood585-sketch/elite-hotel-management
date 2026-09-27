/**
 * WebSocket Hook for Communication Service
 * Manages WebSocket connection for real-time messaging and video call signaling
 */

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import type {
  IICEServersEvent,
  ICallIncomingEvent,
  ICallAnsweredEvent,
  ICallRejectedEvent,
  ICallEndedEvent,
  IICECandidateEvent,
  ICallErrorEvent,
} from '../types/communication.types';
import { logCommunicationEvent } from '../services/communicationApi';
import { useSocket } from '../contexts/SocketContext';

interface WebSocketEventHandlers {
  onICEServers?: (data: IICEServersEvent) => void;
  onCallIncoming?: (data: ICallIncomingEvent) => void;
  onCallAnswered?: (data: ICallAnsweredEvent) => void;
  onCallRejected?: (data: ICallRejectedEvent) => void;
  onCallEnded?: (data: ICallEndedEvent) => void;
  onICECandidate?: (data: IICECandidateEvent) => void;
  onCallError?: (data: ICallErrorEvent) => void;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, data: any) => void;
}

/**
 * Custom hook for managing WebSocket connection to communication service
 * Now uses the global SocketContext
 */
export const useWebSocket = (handlers?: WebSocketEventHandlers): UseWebSocketReturn => {
  const { socket, isConnected: connected } = useSocket();
  
  // Store handlers in ref to avoid re-attaching listeners on every render if handlers change
  const handlersRef = useRef(handlers);
  
  // Update ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!socket || !connected) return;

    // Define handlers that call the current ref
    const onICEServers = (data: IICEServersEvent) => {
      console.log('[WebSocket] Received ICE servers');
      handlersRef.current?.onICEServers?.(data);
    };

    const onCallIncoming = (data: ICallIncomingEvent) => {
      console.log('[WebSocket] 📞 Incoming call from:', data.callerId);
      handlersRef.current?.onCallIncoming?.(data);
      
      logCommunicationEvent('call_incoming', {
        sessionId: data.sessionId,
        callerId: data.callerId,
        callerType: data.callerType,
      });
    };

    const onCallAnswered = (data: ICallAnsweredEvent) => {
      console.log('[WebSocket] ✅ Call answered:', data.sessionId);
      handlersRef.current?.onCallAnswered?.(data);
      
      logCommunicationEvent('call_answered', {
        sessionId: data.sessionId,
      });
    };

    const onCallRejected = (data: ICallRejectedEvent) => {
      console.log('[WebSocket] ❌ Call rejected:', data.sessionId);
      handlersRef.current?.onCallRejected?.(data);
      
      logCommunicationEvent('call_rejected', {
        sessionId: data.sessionId,
      });
    };

    const onCallEnded = (data: ICallEndedEvent) => {
      console.log('[WebSocket] 📴 Call ended:', data.sessionId);
      handlersRef.current?.onCallEnded?.(data);
      
      logCommunicationEvent('call_ended', {
        sessionId: data.sessionId,
      });
    };

    const onICECandidate = (data: IICECandidateEvent) => {
      console.log('[WebSocket] Received ICE candidate');
      handlersRef.current?.onICECandidate?.(data);
    };

    const onCallError = (data: ICallErrorEvent) => {
      console.error('[WebSocket] ❌ Call error:', data.message);
      handlersRef.current?.onCallError?.(data);
      
      logCommunicationEvent('call_error', {
        message: data.message,
        sessionId: data.sessionId,
      });
    };

    // Attach listeners
    socket.on('ice-servers', onICEServers);
    socket.on('call:incoming', onCallIncoming);
    socket.on('call:answered', onCallAnswered);
    socket.on('call:rejected', onCallRejected);
    socket.on('call:ended', onCallEnded);
    socket.on('call:ice-candidate', onICECandidate);
    socket.on('call:error', onCallError);

    // Cleanup listeners
    return () => {
      socket.off('ice-servers', onICEServers);
      socket.off('call:incoming', onCallIncoming);
      socket.off('call:answered', onCallAnswered);
      socket.off('call:rejected', onCallRejected);
      socket.off('call:ended', onCallEnded);
      socket.off('call:ice-candidate', onICECandidate);
      socket.off('call:error', onCallError);
    };
  }, [socket, connected]);

  const emit = (event: string, data: any) => {
    if (!socket || !connected) {
      console.warn('[WebSocket] Cannot emit - not connected');
      return;
    }
    console.log(`[WebSocket] Emitting: ${event}`, data);
    socket.emit(event, data);
  };

  return {
    socket,
    connected,
    emit,
  };
};

export default useWebSocket;
