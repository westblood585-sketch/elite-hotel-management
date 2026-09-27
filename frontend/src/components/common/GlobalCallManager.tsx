import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { VideoCallModal } from './VideoCallModal';
import { Phone, PhoneOff } from 'lucide-react';

export const GlobalCallManager: React.FC = () => {
    const { socket } = useSocket();
    const [incomingCall, setIncomingCall] = useState<{ sessionId: string; guestName: string; guestId: string } | null>(null);
    const [activeCallSession, setActiveCallSession] = useState<string | null>(null);
    const [currentGuestId, setCurrentGuestId] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!socket) return;

        const handleIncoming = (data: { sessionId: string; guestName: string; guestId: string }) => {
            console.log("Incoming Call:", data);
            setIncomingCall(data);
            // Play ringtone here if needed
            playRingtone();
        };

        const handleCancelled = () => {
             setIncomingCall(null);
             toast.dismiss("incoming-call-toast");
             stopRingtone();
        };

        socket.on('call:incoming', handleIncoming);
        socket.on('call:ended', handleCancelled); // If guest cancels before accept

        return () => {
            socket.off('call:incoming', handleIncoming);
            socket.off('call:ended', handleCancelled);
        };
    }, [socket]);

    const playRingtone = () => {
        try {
            if (!audioRef.current) {
                audioRef.current = new Audio('/sounds/ringtone.mp3');
                audioRef.current.loop = true;
            }
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.error("Error playing ringtone:", err));
        } catch (error) {
            console.error("Failed to initialize ringtone:", error);
        }
    };
    
    const stopRingtone = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const handleAccept = async () => {
        if (!incomingCall || !socket) return;
        
        stopRingtone();
        setIsConnecting(true);

        // Mount the modal. The VideoCallModal will handle the actual 'call:accept' emission 
        // once it successfully initializes the media stream (permissions granted).
        setActiveCallSession(incomingCall.sessionId);
        setCurrentGuestId(incomingCall.guestId);
        
        setIncomingCall(null);
        setIsConnecting(false);
    };

    const handleReject = () => {
        if (!incomingCall || !socket) return;
        stopRingtone();
        socket.emit('call:reject', { 
            sessionId: incomingCall.sessionId, 
            guestId: incomingCall.guestId 
        });
        setIncomingCall(null);
    };

    // Custom Toast UI for Incoming Call
    useEffect(() => {
        if (incomingCall) {
            toast.custom((t) => (
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-blue-500/20 w-80 flex flex-col gap-3 animation-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center animate-bounce">
                            <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Incoming Video Call</h4>
                            <p className="text-sm text-gray-500">Guest: {incomingCall.guestName}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full">
                        <button 
                            onClick={handleReject}
                            className="flex-1 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                        >
                            <PhoneOff className="w-4 h-4" /> Decline
                        </button>
                        <button 
                            onClick={handleAccept}
                            disabled={isConnecting}
                            className="flex-1 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 flex items-center justify-center gap-1"
                        >
                             {isConnecting ? 'Connecting...' : <><Phone className="w-4 h-4" /> Accept</>}
                        </button>
                    </div>
                </div>
            ), { duration: 30000, id: "incoming-call-toast" });
        } else {
            toast.dismiss("incoming-call-toast");
        }
    }, [incomingCall, isConnecting]);


    return (
        <>
            {activeCallSession && (
                <VideoCallModal 
                    isOpen={true}
                    onClose={() => {
                        setActiveCallSession(null);
                        setCurrentGuestId(null);
                    }}
                    mode="staff"
                    sessionId={activeCallSession}
                    targetUserId={currentGuestId || undefined} 
                    targetName={incomingCall?.guestName || "Guest"} // Fallback to "Guest" if name lost, but name usually in incomingCall state which is null now. 
                    // We might want to persist name too, but for now "Guest" is acceptable fallback or we add currentGuestName state.
                    initiate={false}
                />
            )}
        </>
    );
};
