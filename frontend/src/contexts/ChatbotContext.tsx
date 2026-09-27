/**
 * Chatbot Context Provider
 * Global state management for chatbot widget
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { IConversation } from '../types/communication.types';

interface ChatbotContextType {
  isOpen: boolean;
  isMinimized: boolean;
  unreadCount: number;
  currentConversation: IConversation | null;
  
  
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
  minimizeWidget: () => void;
  maximizeWidget: () => void;
  setCurrentConversation: (conversation: IConversation | null) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentConversation, setCurrentConversation] = useState<IConversation | null>(null);

  const openWidget = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0); // Reset unread when opening
  }, []);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleWidget = useCallback(() => {
    if (isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }, [isOpen, openWidget, closeWidget]);

  const minimizeWidget = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizeWidget = useCallback(() => {
    setIsMinimized(false);
    setUnreadCount(0); // Reset unread when maximizing
  }, []);

  const incrementUnreadCount = useCallback(() => {
    if (isMinimized || !isOpen) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [isMinimized, isOpen]);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Persist widget state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('chatbotWidgetState');
    if (savedState) {
      try {
        const { isOpen: savedIsOpen } = JSON.parse(savedState);
        setIsOpen(savedIsOpen);
      } catch (error) {
        console.error('Failed to parse chatbot widget state:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatbotWidgetState', JSON.stringify({ isOpen }));
  }, [isOpen]);




  const value: ChatbotContextType = {
    isOpen,
    isMinimized,
    unreadCount,
    currentConversation,
    openWidget,
    closeWidget,
    toggleWidget,
    minimizeWidget,
    maximizeWidget,
    setCurrentConversation,
    incrementUnreadCount,
    resetUnreadCount,
  };

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
};

export const useChatbot = (): ChatbotContextType => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  return context;
};

export default ChatbotContext;
