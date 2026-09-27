import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2, Loader2, User } from 'lucide-react'; 
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'guest' | 'staff';
  sessionId: string | null; // Null for guest initially
  targetName?: string; 
  targetUserId?: string; // Explicit ID of the other user
  initiate?: boolean;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  mode,
  sessionId: initialSessionId,
  targetName,
  targetUserId,
  initiate
}) => {
  const { socket } = useSocket();
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [targetId, setTargetId] = useState<string | null>(targetUserId || null);
  
  // Refs for stable access in listeners
  const sessionIdRef = useRef(initialSessionId);
  const targetIdRef = useRef(targetUserId || null);
  const modeRef = useRef(mode);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // Guard Refs to prevent duplicate signaling
  const hasEmittedAcceptRef = useRef(false);
  const hasEmittedOfferRef = useRef(false);
  const isNegotiatingRef = useRef(false);
  const initInProgressRef = useRef(false);
  useEffect(() => { targetIdRef.current = targetId; }, [targetId]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  
  // Window size tracking for snap logic
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Snap Position State (default to bottom-right)
  // Snap Position State
  const [snapPosition, setSnapPosition] = useState({ x: 0, y: 0 });

  const calculateSnapPosition = (targetX: number, targetY: number) => {
      const modalWidth = 256; 
      const modalHeight = 192; 
      const margin = 24; 
      
      // Calculate max offsets from center (0,0)
      const maxDX = (windowSize.width / 2) - (modalWidth / 2) - margin;
      const maxDY = (windowSize.height / 2) - (modalHeight / 2) - margin;

      // Determine closest quadrant based on current drag position
      // targetX/Y are relative to center if we use dragConstraints or just logic
      // But info.point.x is page coordinates (0 to width)
      
      // Convert page coordinates to center-relative
      const relativeX = targetX - (windowSize.width / 2);
      const relativeY = targetY - (windowSize.height / 2);

      const isLeft = relativeX < 0;
      const isTop = relativeY < 0;

      return {
          x: isLeft ? -maxDX : maxDX,
          y: isTop ? -maxDY : maxDY
      };
  };

  const onDragEnd = (_: any, info: any) => {
    if (!isMinimized) return;
    const snapped = calculateSnapPosition(info.point.x, info.point.y);
    setSnapPosition(snapped);
  };
  
  // Initialize snap position or Recalculate on Resize
  useEffect(() => {
      if (isMinimized) {
           // Default or Re-snap to current quadrant?
           // For simplicity, let's just re-snap to the closest corner based on current 'snapPosition'
           // If we just minimized, default to Bottom-Right.
             const modalWidth = 256; 
             const modalHeight = 192; 
             const margin = 24; 
             const maxDX = (windowSize.width / 2) - (modalWidth / 2) - margin;
             const maxDY = (windowSize.height / 2) - (modalHeight / 2) - margin;
             
             // If we are already minimized, we want to stay in relative corner
             // Heuristic: Check sign of current x/y
             const isLeft = snapPosition.x < 0;
             const isTop = snapPosition.y < 0;
             
             // Initial check (first minimize): snapPosition is 0,0. Default to Bottom-Right (false, false)
             setSnapPosition({
                 x: isLeft ? -maxDX : maxDX,
                 y: isTop ? -maxDY : maxDY
             });
      } else {
          setSnapPosition({ x: 0, y: 0 });
      }
  }, [isMinimized, windowSize]);
  
  // Call State
  const [status, setStatus] = useState<'initializing' | 'calling' | 'connected' | 'reconnecting' | 'rejected' | 'ended'>('initializing');
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // const localVideoRef = useRef<HTMLVideoElement>(null); // Replaced by callback ref pattern
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);


  // Queue for ICE candidates generated before we have a targetId
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);



  // Ref to hold the active stream for reliable cleanup
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize Media and Call
  useEffect(() => {
    if (!isOpen || !socket) return;
    
    // Prevent double initialization
    if (initInProgressRef.current) return;
    initInProgressRef.current = true;

    let isMounted = true;

    const initializeMedia = async () => {
        try {
            console.time("getUserMedia");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            console.timeEnd("getUserMedia");
            
            if (isMounted) {
                // Store in BOTH ref (for cleanup) and state (for UI/buttons)
                localStreamRef.current = stream;
                setLocalStream(stream);
                setIsMuted(false);
                setIsVideoOff(false);
                
                // Add Tracks to Ref
                const pc = new RTCPeerConnection({
                   iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });
                peerConnection.current = pc;

                console.log("[VideoCallModal] Adding tracks to PC");
                stream.getTracks().forEach(track => {
                    console.log(`[VideoCallModal] Adding track: ${track.kind} ${track.id}`);
                    pc.addTrack(track, stream);
                });

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        const currentTargetId = targetIdRef.current || targetId;
                        if (sessionId && currentTargetId) {
                            socket.emit('call:signal', {
                                targetId: currentTargetId,
                                type: 'ice-candidate',
                                signal: event.candidate
                            });
                        } else {
                            console.log("[VideoCallModal] No targetId yet, queuing ICE candidate");
                            iceCandidatesQueue.current.push(event.candidate);
                        }
                    }
                };

                pc.onconnectionstatechange = () => {
                   console.log("[VideoCallModal] Connection State:", pc.connectionState);
                };
                
                pc.oniceconnectionstatechange = () => {
                    console.log("[VideoCallModal] ICE Connection State:", pc.iceConnectionState);
                };

                pc.onsignalingstatechange = () => {
                    console.log("[VideoCallModal] Signaling State:", pc.signalingState);
                    isNegotiatingRef.current = (pc.signalingState !== 'stable');
                };

                pc.ontrack = (event) => {
                   console.log("[VideoCallModal] Received Remote Track:", event.streams[0].id, event.track.kind);
                   if (event.streams && event.streams[0]) {
                       setRemoteStream(event.streams[0]);
                       setStatus('connected');
                   }
                };
                
                // Initiate Flow (Guest)
                if (mode === 'guest' && initiate) {
                    setStatus('calling');
                    const guestName = localStorage.getItem('guest_name') || 'Guest';
                    socket.emit('call:initiate', { guestName });
                } 
                // Staff Flow (Accepting)
                if (mode === 'staff' && sessionId && targetId) {
                     if (!hasEmittedAcceptRef.current) {
                         console.log("[VideoCallModal] Media ready. Emitting call:accept to", targetId);
                         socket.emit('call:accept', { 
                             sessionId: sessionId, 
                             guestId: targetId 
                         });
                         hasEmittedAcceptRef.current = true;
                     }
                }
            } else {
                 // Mounted false by the time we got stream -> stop immediately
                 stream.getTracks().forEach(track => track.stop());
            }

        } catch (err) {
            console.error("Media Access Error", err);
            toast.error("Could not access camera/microphone");
            onClose();
        }
    };

    initializeMedia();

    return () => {
        isMounted = false;
        initInProgressRef.current = false;
        
        // CLEANUP USING REF which is always fresh
        if (localStreamRef.current) {
            console.log("[VideoCallModal] Clean up: Stopping tracks from ref");
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                track.enabled = false; // Extra measure
            });
            localStreamRef.current = null;
        }

        // Also close PC
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        
        // Reset state
        setLocalStream(null);
        setRemoteStream(null);
        setSessionId(null);
        setTargetId(null);
    };
  }, [isOpen, socket]); // Run once on open


  // Socket Events
  useEffect(() => {
      if (!socket) return;

      // Guest: Call Accepted
      const handleCallAccepted = async (data: { sessionId: string, staffId: string, staffName: string }) => {
          console.log("[VideoCallModal] Received call:accepted:", data);
          
          if (modeRef.current === 'guest') {
              console.log("[VideoCallModal] Mode is guest, setting session and target");
              setSessionId(data.sessionId);
              setTargetId(data.staffId);
              
              // Verify PC exists
              const pc = peerConnection.current;
              if (pc) {
                  try {
                    if (hasEmittedOfferRef.current) return;
                    isNegotiatingRef.current = true;
                    console.log("[VideoCallModal] Creating offer...");
                    const offer = await pc.createOffer();
                    console.log("[VideoCallModal] Offer created, setting local description");
                    await pc.setLocalDescription(offer);
                    
                    console.log("[VideoCallModal] Emitting call:signal (offer) to", data.staffId);
                     socket.emit('call:signal', {
                        targetId: data.staffId,
                        type: 'offer',
                        signal: offer
                    });
                    hasEmittedOfferRef.current = true;

                    // Flush queued ICE candidates AFTER sending offer
                    if (iceCandidatesQueue.current.length > 0) {
                        console.log(`[VideoCallModal] Flushing ${iceCandidatesQueue.current.length} queued ICE candidates`);
                        iceCandidatesQueue.current.forEach(candidate => {
                            socket.emit('call:signal', {
                                targetId: data.staffId,
                                type: 'ice-candidate',
                                signal: candidate
                            });
                        });
                        iceCandidatesQueue.current = [];
                    }

                  } catch (err) {
                    console.error("[VideoCallModal] Error creating offer:", err);
                  }
              } else {
                  console.error("[VideoCallModal] PeerConnection is null! Retrying in 500ms");
                  // Optional retry logic if needed, but PC should be ready
                  setTimeout(async () => {
                       const retryPc = peerConnection.current;
                       if (retryPc) {
                           const offer = await retryPc.createOffer();
                           await retryPc.setLocalDescription(offer);
                           socket.emit('call:signal', { targetId: data.staffId, type: 'offer', signal: offer });
                           
                           // Flush queue in retry too
                           if (iceCandidatesQueue.current.length > 0) {
                               iceCandidatesQueue.current.forEach(candidate => {
                                   socket.emit('call:signal', { targetId: data.staffId, type: 'ice-candidate', signal: candidate });
                               });
                               iceCandidatesQueue.current = [];
                           }
                       }
                  }, 500);
              }
          }
      };

      const handleCallSignal = async (data: { senderId: string, type: 'offer' | 'answer' | 'ice-candidate', signal: any }) => {
          const pc = peerConnection.current;
          if (!pc) return;

          console.log(`[VideoCallModal] Received signal ${data.type} from ${data.senderId}`);

          // For Staff, we lock onto the sender if not already set (or if we trust the signal)
          // For Guest, we expect signal from Staff
          
          // Using ref to check if we need to lock target
          if (!targetIdRef.current && data.senderId) {
               setTargetId(data.senderId);
          }

          if (data.type === 'offer') {
              if (pc.signalingState !== 'stable') return;
              isNegotiatingRef.current = true;
              await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              
              // Send answer back to SENDER (whoever sent the offer)
              socket.emit('call:signal', {
                  targetId: data.senderId,
                  type: 'answer',
                  signal: answer
              });
          } else if (data.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          } else if (data.type === 'ice-candidate') {
              await pc.addIceCandidate(new RTCIceCandidate(data.signal));
          }
      };

      const handleCallRejected = () => {
          setStatus('rejected');
          toast.error("Staff is currently busy.");
          setTimeout(onClose, 3000);
      };

      const handleCallEnded = (data: any) => {
          // Relaxed check:
          // If we receive "call:ended" and we are NOT initializing, verify basics.
          // IF sessionId is present, match it. IF NOT, check if endedBy matches targetId.
          
          if (statusRef.current === 'initializing') {
              // Just return, don't execute close logic.
              return;
          }

          const currentSessionId = sessionIdRef.current;
          
          // Debug logs
          console.log(`[VideoCallModal] call:ended received. Session: ${data.sessionId} vs Current: ${currentSessionId}`);

          // If strict mismatch (both exist but unequal), ignore.
          if (data.sessionId && currentSessionId && data.sessionId !== currentSessionId) {
             console.warn("[VideoCallModal] mismatched session ID on call end. Ignoring common stale event.");
             // If the user effectively ended it, we should trust the 'status' + event receipt usually.
             // We rely on TargetID check. If data.endedBy === targetIdRef.current, then YES, end it.
             
             if (data.endedBy && data.endedBy !== targetIdRef.current) {
                 return; // Ended by someone else?
             }
          }
          
          console.log("[VideoCallModal] Processing Call End.");
          setStatus('ended');
          toast.info("Call ended.");
          
          // FIX: Auto-close for everyone after 2 seconds
          setTimeout(onClose, 2000);
      };

      const handleCallError = (err: any) => {
         toast.error(err.message || "Call failed");
         // On error (like "User not found"), we probably SHOULD auto-close or show error state
         // setTimeout(onClose, 3000);
      };

      socket.on('call:accepted', handleCallAccepted);
      socket.on('call:signal', handleCallSignal);
      socket.on('call:rejected', handleCallRejected);
      socket.on('call:ended', handleCallEnded);
      socket.on('call:error', handleCallError);

      return () => {
          socket.off('call:accepted', handleCallAccepted);
          socket.off('call:signal', handleCallSignal);
          socket.off('call:rejected', handleCallRejected);
          socket.off('call:ended', handleCallEnded);
          socket.off('call:error', handleCallError);
      };
      // Minimized dependencies to prevent re-binding
  }, [socket]);

  // Robust Video Attachment using useEffect
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
      const videoEl = localVideoRef.current;
      if (videoEl && localStream) {
          console.log("[VideoCallModal] Attaching local stream to video element via useEffect");
           // Ensure muted to avoid feedback and allow autoplay
          videoEl.muted = true;
          videoEl.srcObject = localStream;
          videoEl.play().catch(e => console.error("[VideoCallModal] Error playing local video:", e));
      }
  }, [localStream]); 


  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(e => console.error("Error playing remote video:", e));
    }
  }, [remoteStream, isMinimized]);


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] flex items-center justify-center 
            ${isMinimized ? 'pointer-events-none' : 'bg-black/80 backdrop-blur-md'}`}
      >
        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ 
                scale: 1, 
                opacity: 1,
                x: isMinimized ? snapPosition.x : 0, 
                y: isMinimized ? snapPosition.y : 0,
                width: isMinimized ? 256 : '100%',
                height: isMinimized ? 192 : '85vh',
            }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag={isMinimized}
            dragMomentum={false}
            onDragEnd={onDragEnd}
            
            // Important: We use a fixed-centered layout strategy now for smooth transform
            style={{ 
                maxWidth: isMinimized ? 'none' : '64rem', // max-w-5xl
            }}
            
            className={`overflow-hidden relative shadow-2xl bg-gray-900 border border-white/10
                ${isMinimized 
                    ? 'rounded-2xl z-50 pointer-events-auto cursor-move' 
                    : 'w-full rounded-3xl'
                }
            `}
        >
            {/* Header / Maximize Button */}
            {isMinimized ? (
                 <div className="absolute top-2 right-2 z-50">
                    <button 
                        onClick={() => setIsMinimized(false)}
                        className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                 </div>
            ) : (
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white text-xl font-bold tracking-tight">{targetName || (mode === 'guest' ? 'Elite Staff' : 'Guest')}</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 animate-pulse'}`} />
                                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider">{status === 'calling' ? 'Calling...' : status}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsMinimized(true)} className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-md transition-all">
                        <Minimize2 className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Remote Video (Main) */}
            <div className="relative w-full h-full bg-black flex items-center justify-center">
                {remoteStream && status !== 'ended' ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
                ) : (
                    <div className="flex flex-col items-center justify-center text-white/50 gap-6">
                        {status === 'ended' ? (
                             <div className="text-center">
                                 <PhoneOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                 <h3 className="text-2xl font-bold text-white mb-2">Call Ended</h3>
                                 <p className="text-white/60 mb-6">The video call session has ended.</p>
                                 <button 
                                    onClick={onClose}
                                    className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
                                 >
                                    Close Window
                                 </button>
                             </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
                                    </div>
                                    <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" style={{ animationDuration: '1.5s' }}/>
                                </div>
                                {!isMinimized && (
                                    <p className="text-lg font-light tracking-wide text-white/40">
                                    {status === 'calling' ? 'Waiting for response...' : 'Connecting...'}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Local Video (PIP) - HIDE IF MINIMIZED to avoid blocking view, or make it tiny */}
                {/* User complained about layout issues. Hiding self in mini-mode is standard. */}
                <motion.div 
                    layout
                    drag
                    dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} 
                    className={`absolute overflow-hidden shadow-2xl border border-white/20 bg-gray-800 z-30 cursor-move group
                        ${isMinimized ? 'opacity-0 pointer-events-none' : 'bottom-8 right-8 w-64 h-40 rounded-2xl'}
                    `}
                >
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        onLoadedMetadata={(e) => {
                            console.log("[VideoCallModal] Local video metadata loaded, forcing play");
                            e.currentTarget.play().catch(err => console.error("[VideoCallModal] Force play failed:", err));
                        }}
                        onCanPlay={() => console.log("[VideoCallModal] Local video can play")}
                        className="w-full h-full object-cover transition-opacity" // Removed opacity-80 for debugging
                    />
                    {!localStream && <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">No Camera</div>}
                </motion.div>
            </div>

            {/* Controls */}
            {!isMinimized && (
                <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 z-20">
                    <button 
                        onClick={() => {
                             if (localStream) {
                                  // If currently NOT muted, we want to MUTE (enable=false)
                                  // If currently Muted, we want to UNMUTE (enable=true)
                                  const newMutedState = !isMuted;
                                  localStream.getAudioTracks().forEach(t => t.enabled = !newMutedState);
                                  setIsMuted(newMutedState);
                             }
                        }}
                        className={`p-4 rounded-full backdrop-blur-2xl border transition-all duration-300 ${isMuted ? 'bg-red-500/90 border-red-500 text-white' : 'bg-black/40 border-white/10 text-white hover:bg-black/60 hover:scale-110'}`}
                    >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button 
                        onClick={() => {
                            socket?.emit('call:end', { targetId, sessionId });
                            onClose();
                        }}
                        className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-900/30 transition-all hover:scale-110 active:scale-95"
                    >
                        <PhoneOff className="w-8 h-8 fill-current" />
                    </button>

                    <button 
                        onClick={() => {
                             if (localStream) {
                                 const newVideoState = !isVideoOff;
                                 localStream.getVideoTracks().forEach(t => t.enabled = !newVideoState);
                                 setIsVideoOff(newVideoState);
                             }
                        }}
                        className={`p-4 rounded-full backdrop-blur-2xl border transition-all duration-300 ${isVideoOff ? 'bg-red-500/90 border-red-500 text-white' : 'bg-black/40 border-white/10 text-white hover:bg-black/60 hover:scale-110'}`}
                    >
                        {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </button>
                </div>
            )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
