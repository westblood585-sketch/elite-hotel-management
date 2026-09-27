import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store/store';
import { logout } from '../redux/slices/authSlice';

interface VoiceAssistantContextType {
  isListening: boolean;
  transcript: string;
  isProcessing: boolean;
  isSpeaking: boolean;
  toggleListening: () => void;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined);

export const VoiceAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any current speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to select a "Google US English" or similar pleasant voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
        voice.name.includes('Google US English') || 
        voice.name.includes('Samantha')
    );
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  // Command Dictionary
  const commands = [
    // --- Public / User Routes ---
    {
      patterns: [/go to home/i, /open home/i, /navigate to home/i],
      action: () => navigate('/'),
      feedback: 'Navigating to Home Page'
    },
    {
      patterns: [/go to rooms/i, /view rooms/i, /show rooms/i],
      action: () => navigate('/rooms'),
      feedback: 'Opening Rooms and Suites'
    },
    {
        patterns: [/find booking/i, /search booking/i],
        action: () => navigate('/find-booking'),
        feedback: 'Taking you to Find Booking'
    },
    {
        patterns: [/my bookings/i, /show my bookings/i],
        action: () => navigate('/bookings'),
        feedback: 'Opening your bookings'
    },
     {
        patterns: [/sign in/i, /log in/i, /login/i],
        action: () => navigate('/auth/signin'),
        feedback: 'Opening Sign In page'
    },
    {
        patterns: [/sign up/i, /register/i, /create account/i],
        action: () => navigate('/auth/signup'),
        feedback: 'Opening Sign Up page'
    },
    
    // --- Authentication Actions ---
    {
        patterns: [/sign out/i, /log out/i, /logout/i],
        action: () => {
             // Dispatch logout action
             dispatch(logout());
             navigate('/auth/signin');
        },
        feedback: 'Logging you out. Goodbye!'
    },

    // --- Admin Routes ---
    {
      patterns: [/admin dashboard/i, /open admin/i],
      action: () => navigate('/admin/dashboard'),
      feedback: 'Opening Admin Dashboard'
    },
    {
      patterns: [/manage guests/i, /admin guests/i, /show guests/i],
      action: () => navigate('/admin/guests'),
      feedback: 'Opening Guest Management'
    },
    {
        patterns: [/manage rooms/i, /admin rooms/i, /show rooms/i],
        action: () => navigate('/admin/rooms'),
        feedback: 'Opening Room Administration'
    },
    {
        patterns: [/add room/i, /new room/i, /create room/i],
        action: () => navigate('/admin/rooms/new'),
        feedback: 'Opening Add Room Page'
    },
    {
        patterns: [/manage users/i, /admin users/i, /show users/i],
        action: () => navigate('/admin/users'),
        feedback: 'Opening User Management'
    },
    {
        patterns: [/manage payments/i, /admin payments/i, /show payments/i],
        action: () => navigate('/admin/payments'),
        feedback: 'Opening Payments Dashboard'
    },
    {
        patterns: [/desk booking/i, /manage desks/i],
        action: () => navigate('/admin/desk-booking'),
        feedback: 'Opening Desk Booking Management'
    },
    {
        patterns: [/admin reservations/i, /manage reservations/i],
        action: () => navigate('/admin/reservations'),
        feedback: 'Opening Reservations Management'
    },
    {
        patterns: [/admin housekeeping/i, /manage housekeeping/i],
        action: () => navigate('/admin/housekeeping'),
        feedback: 'Opening Housekeeping Management'
    },
    {
        patterns: [/admin billing/i, /manage billing/i],
        action: () => navigate('/admin/billing'),
        feedback: 'Opening Billing Management'
    },
    {
        patterns: [/admin settings/i, /system settings/i],
        action: () => navigate('/admin/settings'),
        feedback: 'Opening System Settings'
    },
    {
        patterns: [/communications/i, /messages/i, /inbox/i],
        action: () => navigate('/admin/communications'),
        feedback: 'Opening Communications Dashboard'
    },
    
    // --- Dynamic Profile Route ---
    {
        patterns: [/go to profile/i, /my profile/i, /open profile/i],
        action: () => {
            if (user?.role === 'receptionist') navigate('/receptionist/profile');
            else if (['admin', 'housekeeper'].includes(user?.role || '')) navigate('/admin/profile');
            else navigate('/account/profile');
        },
        feedback: 'Opening your profile'
    },

    // --- Receptionist Routes ---
    {
        patterns: [/receptionist dashboard/i, /reception dashboard/i],
        action: () => navigate('/receptionist/dashboard'),
        feedback: 'Opening Receptionist Dashboard'
    },

    // --- Housekeeper Routes ---
    {
        patterns: [/housekeeper dashboard/i, /housekeeping dashboard/i],
        action: () => navigate('/housekeeper/dashboard'),
        feedback: 'Opening Housekeeper Dashboard'
    },

    // --- General Actions ---
    {
        patterns: [/go back/i, /previous page/i],
        action: () => navigate(-1),
        feedback: 'Going back'
    },
    {
        patterns: [/scroll down/i],
        action: () => window.scrollBy({ top: 500, behavior: 'smooth' }),
        feedback: 'Scrolling down'
    },
    {
        patterns: [/scroll up/i],
        action: () => window.scrollBy({ top: -500, behavior: 'smooth' }),
        feedback: 'Scrolling up'
    },
    {
        patterns: [/top of page/i, /scroll to top/i],
        action: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        feedback: 'Scrolling to top'
    }
  ];

  const processCommand = (text: string) => {
    console.log('Processing Voice Command:', text);
    setIsProcessing(true);
    
    let matched = false;

    // Remove "Hi Elite" or "Elite" prefix
    const cleanText = text.replace(/^(hi|hey|hello)?\s*elite\s*/i, '').trim();

    // Greeting check
    if (/^(hi|hello|hey)$/i.test(cleanText)) {
        speak("Hello! How can I help you today?");
        matched = true;
    } 
    else if (/^(who are you|what is this)/i.test(cleanText)) {
        speak("I am Elite, your personal hotel assistant. I can help you navigate the application.");
        matched = true;
    }
    else {
        for (const cmd of commands) {
            if (cmd.patterns.some(pattern => pattern.test(cleanText) || pattern.test(text))) {
                // Visual feedback
                toast.success(cmd.feedback, { icon: '🎙️' });
                // Audio feedback
                speak(cmd.feedback);
                // Action
                cmd.action();
                matched = true;
                break;
            }
        }
    }

    if (!matched && cleanText.length > 2) {
       // Optional: "I didn't catch that"
       // speak("Sorry, I didn't understand that command.");
    }

    setTimeout(() => {
        setIsProcessing(false);
        setTranscript('');
    }, 1500);
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Voice Assistant: Speech Recognition not supported.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Voice Assistant: Started listening');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
         setTranscript(finalTranscript.trim());
         processCommand(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setIsListening(false);
        toast.error('Microphone access denied.');
      }
    };

    recognition.onend = () => {
      if (isListening) {
        try {
            recognition.start();
        } catch (e) { /* ignore */ }
      }
    };

    recognitionRef.current = recognition;

    return () => {
       if (recognitionRef.current) recognitionRef.current.stop();
       window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      try {
        recognition.start();
        const msg = 'How can I assist you?';
        toast(msg);
        speak(msg);
      } catch (e) { /* ignore */ }
    } else {
      recognition.stop();
      setTranscript('');
      window.speechSynthesis.cancel();
    }
  }, [isListening]);

  const toggleListening = () => setIsListening(prev => !prev);
  const startListening = () => setIsListening(true);
  const stopListening = () => setIsListening(false);

  return (
    <VoiceAssistantContext.Provider value={{
      isListening,
      transcript,
      isProcessing,
      isSpeaking,
      toggleListening,
      startListening,
      stopListening,
      speak
    }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};

export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
};
