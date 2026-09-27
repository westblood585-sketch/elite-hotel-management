import React, { useState } from 'react';
import { User, Key, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GuestInfoFormProps {
  onSubmit: (name: string, roomNumber?: string) => Promise<void>;
  onCancel: () => void;
}

export const GuestInfoForm: React.FC<GuestInfoFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(name, roomNumber);
    } catch (error) {
      console.error('Failed to submit guest info:', error);
      toast.error('Failed to start guest session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-md">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
          <User className="w-8 h-8 text-white relative -rotate-3" />
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900">Welcome Guest</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
            Please provide your details to start chatting with our concierge or join a call.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-gray-700 ml-1 uppercase tracking-wider">Your Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                placeholder="John Doe"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-gray-700 ml-1 uppercase tracking-wider">Room Number <span className="text-gray-400 font-normal lowercase">(optional)</span></label>
            <div className="relative group">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                placeholder="101"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:bg-gray-900 text-white font-medium py-3 rounded-xl shadow-lg shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2 group mt-4 disabled:opacity-70 disabled:active:scale-100"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Start Chatting
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
      
      <div className="p-4 text-center border-t border-gray-100">
        <button 
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
        >
          Close Widget
        </button>
      </div>
    </div>
  );
};
