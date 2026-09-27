// App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import UserRoute from './routes/UserRoute'
import AdminRoute from './routes/AdminRoute'
import ReceptionistRoute from './routes/ReceptionistRoute'
import HousekeeperRoute from './routes/HousekeeperRoute'
import { ChatbotProvider } from './contexts/ChatbotContext'
import { SocketProvider } from './contexts/SocketContext'
import { VoiceAssistantProvider } from './contexts/VoiceAssistantContext'
import ChatbotWidget from './components/common/ChatbotWidget'
import { GlobalCallManager } from '@/components/common/GlobalCallManager'
import { VoiceIndicator } from './components/common/VoiceIndicator'
import { Toaster } from 'sonner'
import './i18n/config'

const App: React.FC = () => {
  return (
    <SocketProvider>
      <ChatbotProvider>
        <Router>
          <VoiceAssistantProvider>
            <div className="min-h-screen bg-white transition-colors duration-300">
              <Routes>
                <Route path="/admin/*" element={<AdminRoute />} />
                <Route path="/receptionist/*" element={<ReceptionistRoute />} />
                <Route path="/housekeeper/*" element={<HousekeeperRoute />} />
                <Route path="/*" element={<UserRoute />} />
              </Routes>
              
              {/* Global Communication Widgets */}
              <ChatbotWidget />
              <GlobalCallManager />
              <VoiceIndicator />
              <Toaster position="top-right" richColors closeButton />
            </div>
          </VoiceAssistantProvider>
        </Router>
      </ChatbotProvider>
    </SocketProvider>
  )
}

export default App
