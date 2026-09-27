import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { IICEServer } from '../types/communication.types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  iceServers: IICEServer[];
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Get the communication service URL from env or default
const SOCKET_URL = import.meta.env.VITE_COMMUNICATION_SERVICE_URL || 'http://localhost:4009';

// Extend Window interface for the global flag
declare global {
  interface Window {
    __ACTIVE_VIDEO_CALL__?: boolean;
  }
}

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [iceServers, setIceServers] = useState<IICEServer[]>([]);

  // Function to initialize logic without depending on 'socket' state
  const connect = useCallback(() => {
    // Check for active video call to prevent interruption
    if (window.__ACTIVE_VIDEO_CALL__) {
      console.warn('Skipping socket reconnection during active video call');
      return;
    }

    // Get token from storage
    const authList = [localStorage.getItem('token'), localStorage.getItem('guest_token')];
    const validToken = authList.find(t => t);

    // Check existing socket in ref
    if (socketRef.current) {
        // If connected, check if token matches
        if (socketRef.current.connected) {
             const currentToken = (socketRef.current.auth as any)?.token;
             if (currentToken === validToken) {
                 console.log('Socket already connected with same token. Skipping reconnect.');
                 return;
             }
             console.log('Token changed. Disconnecting old socket...');
             socketRef.current.disconnect();
        } else {
             // Not connected, maybe connecting? Or closed. safe to replace.
             // But if it's strictly not connected, we can disconnect just in case.
             socketRef.current.disconnect(); 
        }
    }

    if (!validToken) {
        console.warn('Socket connect called but no token found.');
        return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: {
        token: validToken
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('ice-servers', (data: { iceServers: IICEServer[] }) => {
      console.log('🧊 Received ICE servers');
      setIceServers(data.iceServers);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    // Update state to trigger re-renders for consumers
    setSocket(socketInstance);
  }, []); // No socket dependency!

  const disconnect = useCallback(() => {
    if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
    }
  }, []);

  // Initial connect - only once
  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
          socketRef.current.disconnect();
      }
    };
  }, []); // Remove connect from dependency to prevent re-runs
  
  // Listen for token refresh events
  useEffect(() => {
    const handleTokenRefresh = () => {
         console.log("Token refreshed event received. Reconnecting socket...");
         // Use the ref to avoid dependency issues
         if (socketRef.current?.connected) {
           socketRef.current.disconnect();
         }
         // Call connect but don't add it as dependency
         const authList = [localStorage.getItem('token'), localStorage.getItem('guest_token')];
         const validToken = authList.find(t => t);
         if (validToken && socketRef.current) {
           socketRef.current.auth = { token: validToken };
           socketRef.current.connect();
         }
    };

    window.addEventListener('token-refreshed', handleTokenRefresh);
    window.addEventListener('storage', handleTokenRefresh);

    return () => {
        window.removeEventListener('token-refreshed', handleTokenRefresh);
        window.removeEventListener('storage', handleTokenRefresh);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, iceServers, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
