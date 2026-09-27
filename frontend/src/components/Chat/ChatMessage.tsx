import React from 'react';
import { IMessage } from '../../types/communication.types';
import { format } from 'date-fns';
import { User, Bot, Headphones } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming cn utility exists, usually in shadcn/ui or similar setups. If not, I'll use template literals.

// Fallback for cn if not present in user's codebase, though commonly used with Tailwind
// I'll assume standard React setup. If cn is missing, I will check later or just use strings.
// Safest is to use a local helper or simple string interpolation for now if I am unsure.
// But looking at dependencies, clsx and tailwind-merge are present, so cn is likely.
// I will just use standard className logic for safety.

interface ChatMessageProps {
  message: IMessage;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const isAgent = message.sender === 'agent';

  // Format time (handling potential string dates from JSON)
  const time = message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : '';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
          ${isUser ? 'bg-primary-600 text-white' : 
            isBot ? 'bg-violet-100 text-violet-600' : 'bg-orange-100 text-orange-600'}`}>
          {isUser && <User size={14} />}
          {isBot && <Bot size={14} />}
          {isAgent && <Headphones size={14} />}
        </div>

        {/* Message Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm
            ${isUser ? 
                'bg-primary-600 text-white rounded-br-none' : 
                'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
            }`}>
            {message.content}
            </div>
            
            {/* Metadata / Time */}
            <span className="text-[10px] text-gray-400 mt-1 px-1">
                {time}
                {isBot && message.intent && (
                    <span className="ml-2 opacity-50 hidden group-hover:inline">
                        • {message.intent}
                    </span>
                )}
            </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
