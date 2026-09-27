import React from 'react';
import { useVoiceAssistant } from '../../contexts/VoiceAssistantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';

export const VoiceIndicator: React.FC = () => {
  const { isListening, transcript, isProcessing, isSpeaking } = useVoiceAssistant();

  if (!isListening) return null;

  return (
    <AnimatePresence>
      {(transcript || isProcessing || isSpeaking) && (
        <motion.div
           initial={{ opacity: 0, y: 50, scale: 0.9 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, y: 20, scale: 0.9 }}
           className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-3"
        >
          {/* Main Visualizer */}
          <div className="bg-black/80 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 min-w-[300px] justify-center">
            
            {/* Animated Icon */}
            <div className="relative">
                <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${isSpeaking ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                <div className={`${isSpeaking ? 'bg-blue-600' : 'bg-red-600'} rounded-full p-2 relative z-10 transition-colors duration-300`}>
                    <Mic size={20} className="text-white" />
                </div>
            </div>

            {/* Transcript Text */}
            <div className="font-medium text-lg whitespace-nowrap overflow-hidden text-ellipsis max-w-[400px]">
                {isProcessing ? (
                    <span className="text-gray-400 animate-pulse">Thinking...</span>
                ) : isSpeaking ? (
                    <span className="text-blue-400">Speaking...</span>
                ) : (
                    <span className="capitalize">"{transcript}"</span>
                )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
