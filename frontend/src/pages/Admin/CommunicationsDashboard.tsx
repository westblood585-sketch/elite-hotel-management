import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { MessageSquare, Video, BarChart3, Clock, Users, ChevronLeft, ChevronRight, AlertTriangle, X } from 'lucide-react';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import {
  getConversations,
  getCallHistory,
  getAllActiveCalls,
  handoffToAgent,
  logCommunicationEvent,
} from '../../services/communicationApi';
import type { IConversation, IVideoChatSession } from '../../types/communication.types';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'conversations' | 'calls' | 'stats';

export const CommunicationsDashboard: React.FC = () => {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [calls, setCalls] = useState<IVideoChatSession[]>([]);
  const [activeCalls, setActiveCalls] = useState<IVideoChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<IConversation | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Stabilize loadData with useCallback
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'conversations') {
        const response = await getConversations(currentPage, itemsPerPage);
        setConversations(response.conversations);
        if (response.pagination) {
            setTotalPages(response.pagination.pages);
        } else {
             setTotalPages(1);
        }
      } else if (activeTab === 'calls') {
        const response = await getCallHistory(currentPage, itemsPerPage);
        setCalls(response.calls);
        
        // Parallel fetch for active calls if on calls tab
        const activeResponse = await getAllActiveCalls();
        setActiveCalls(activeResponse.calls);

        if (response.pagination) {
             setTotalPages(response.pagination.pages);
        } else {
             setTotalPages(1);
        }
      } else {
        // Ensure stats tab also populates data if needed, or re-fetch active calls/convos count
        const [convosRes, callsRes, activeRes] = await Promise.all([
             getConversations(1, 1000), // Get all for simplified stats, ideally backend provides proper stats endpoint
             getCallHistory(1, 1000),
             getAllActiveCalls()
        ]);
        setConversations(convosRes.conversations);
        setCalls(callsRes.calls);
        setActiveCalls(activeRes.calls);
        setLoading(false); 
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load communication data. Please try again.');
    } finally {
      if (activeTab !== 'stats') setLoading(false);
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    // Reset page to 1 on tab change
    setCurrentPage(1); 
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]); // activeTab/currentPage changes triggering loadData changes

  // Listen for socket events to auto-update
  useEffect(() => {
    if (!socket) return;

    let timeoutId: NodeJS.Timeout;
    const handleUpdate = () => {
        // Debounce: Wait 2s before reloading to prevent spam
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
             loadData();
        }, 2000);
    };

    socket.on('videochat.call.initiated', handleUpdate);
    socket.on('videochat.call.active', handleUpdate);
    socket.on('videochat.call.ended', handleUpdate);
    socket.on('videochat.call.rejected', handleUpdate);
    
    // Polling fallback (Increased to 30s)
    const interval = setInterval(() => {
        if (activeTab === 'calls') { // Only poll if viewing calls
            getAllActiveCalls().then(res => setActiveCalls(res.calls)).catch(console.error);
        }
    }, 30000); 

    return () => {
        socket.off('videochat.call.initiated', handleUpdate);
        socket.off('videochat.call.active', handleUpdate);
        socket.off('videochat.call.ended', handleUpdate);
        socket.off('videochat.call.rejected', handleUpdate);
        clearInterval(interval);
        clearTimeout(timeoutId);
    };
  }, [socket, activeTab, loadData]);

  const handleTakeOver = async (conversationId: string) => {
    try {
      await handoffToAgent({ conversationId });
      alert('Conversation taken over successfully');
      loadData();
      
      logCommunicationEvent('conversation_takeover', { conversationId });
    } catch (error) {
      console.error('Failed to take over conversation:', error);
      alert('Failed to take over conversation');
    }
  };

  const handleReturnToBot = async (conversationId: string) => {
    try {
      // Dynamically import to ensure it's available
      const { returnToBot } = await import('../../services/communicationApi'); 
      await returnToBot({ conversationId });
      alert('Conversation returned to bot successfully');
      loadData();
      
      logCommunicationEvent('conversation_return_to_bot', { conversationId });
    } catch (error) {
      console.error('Failed to return conversation to bot:', error);
      alert('Failed to return conversation to bot');
    }
  };

  const getCallStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-200',
      ended: 'bg-gray-100 text-gray-700 border-gray-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      missed: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      pending: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getConversationStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-200',
      handoff: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      closed: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 px-6 py-4 rounded-b-3xl border-t border-gray-100">
         <div className="text-sm text-gray-500 font-medium">
             Page <span className="text-gray-900 font-bold">{currentPage}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
         </div>
         <div className="flex items-center gap-2">
            <button
               onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
               disabled={currentPage === 1}
               className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
               <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  // Simplified logic for brevity in this view
                  return (
                    <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            currentPage === pageNum
                            ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-105'
                            : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                        }`}
                    >
                        {pageNum}
                    </button>
                  )
               })}
            </div>
            <button
               onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
               disabled={currentPage === totalPages}
               className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
               <ChevronRight size={18} />
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

      <div className="max-w-[1920px] mx-auto relative z-10 space-y-8 px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900">Communications</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage chatbot conversations and video calls.</p>
          </div>
          
          {/* Glass Tabs */}
          <div className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 shadow-sm">
            {(['conversations', 'calls', 'stats'] as const).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                        activeTab === tab
                        ? 'bg-white text-gray-900 shadow-md scale-100'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                    }`}
                >
                    {tab === 'conversations' && <MessageSquare className="w-4 h-4" />}
                    {tab === 'calls' && <Video className="w-4 h-4" />}
                    {tab === 'stats' && <BarChart3 className="w-4 h-4" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
        {error ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex items-center justify-center h-64 bg-white/50 backdrop-blur-sm rounded-3xl border border-red-100"
          >
             <EmptyState
               title="Error loading data"
               description={error}
               icon={AlertTriangle}
               action={{ label: 'Retry', onClick: loadData }}
             />
          </motion.div>
        ) : loading && activeTab !== 'stats' ? ( // Stats fetches its own data slightly differently in useEffect
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <TableSkeleton rows={8} />
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Conversations Tab */}
            {activeTab === 'conversations' && (
              <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                  <table className="min-w-full">
                    <thead className="border-b border-gray-200/50 bg-gray-50/50">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Messages</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                        <th className="px-8 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {conversations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-20">
                            <EmptyState
                              title="No conversations found"
                              description="There are no active conversations at the moment."
                              icon={MessageSquare}
                            />
                          </td>
                        </tr>
                      ) : (
                        conversations.map((convo, idx) => (
                          <motion.tr 
                            key={convo.conversationId} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group hover:bg-white/80 transition-colors"
                          >
                            <td className="px-8 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                      {/*{(convo.context?.userName || convo.userId || 'U').charAt(0).toUpperCase()}*/}
                                      U
                                  </div>
                                  <div className="text-sm font-bold text-gray-900">
                                    {convo.context?.userName || convo.userId.substring(0, 8)}
                                  </div>
                              </div>
                            </td>
                            <td className="px-8 py-4 whitespace-nowrap">
                              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wide">{convo.userType}</span>
                            </td>
                            <td className="px-8 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900">{convo.messages.length}</span>
                              </div>
                            </td>
                            <td className="px-8 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs font-bold rounded-full capitalize border ${getConversationStatusBadge(
                                  convo.status
                                )}`}
                              >
                                {convo.status}
                              </span>
                            </td>
                            <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                              {new Date(convo.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-8 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => setSelectedConversation(convo)}
                                className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors mr-3"
                              >
                                View
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination()}
              </div>
            )}

            {/* Calls Tab */}
            {activeTab === 'calls' && (
              <div className="space-y-8">
                {/* Active Calls */}
                {activeCalls.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-3xl p-6 backdrop-blur-md"
                    >
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-800">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Active Live Calls ({activeCalls.length})
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-green-800 uppercase">Caller</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-green-800 uppercase">Receiver</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-green-800 uppercase">Started</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-green-800 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeCalls.map(call => (
                                        <tr key={call.sessionId} className="border-b border-green-500/10">
                                            <td className="px-4 py-3 text-sm font-bold text-gray-800">{call.callerId.substring(0, 8)}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-gray-800">{call.receiverId.substring(0, 8)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{new Date(call.startTime).toLocaleTimeString()}</td>
                                            <td className="px-4 py-3"><span className="px-2 py-1 bg-green-200 text-green-800 rounded-lg text-xs font-bold uppercase">Live</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Call History */}
                <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                             <Clock className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Call History</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="border-b border-gray-200/50 bg-gray-50/50">
                          <tr>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Caller</th>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Receiver</th>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {calls.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-20">
                                <EmptyState
                                  title="No call history"
                                  description="No past video calls found."
                                  icon={Video}
                                />
                              </td>
                            </tr>
                          ) : (
                            calls.map((call, idx) => (
                              <motion.tr 
                                key={call.sessionId} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group hover:bg-white/80 transition-colors"
                              >
                                <td className="px-8 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {call.callerId.substring(0, 8)} <span className="text-xs text-gray-400">({call.callerType})</span>
                                  </div>
                                </td>
                                <td className="px-8 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {call.receiverId.substring(0, 8)} <span className="text-xs text-gray-400">({call.receiverType})</span>
                                  </div>
                                </td>
                                <td className="px-8 py-4 whitespace-nowrap text-sm font-mono text-gray-600 font-bold">
                                  {formatDuration(call.duration)}
                                </td>
                                <td className="px-8 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-3 py-1 inline-flex text-xs font-bold rounded-full capitalize border ${getCallStatusBadge(
                                      call.status
                                    )}`}
                                  >
                                    {call.status}
                                  </span>
                                </td>
                                <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(call.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination()}
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                         <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Conversations</h3>
                        <p className="text-3xl font-extrabold text-gray-900">{conversations.length}</p>
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3 text-sm text-gray-600">
                     Active: <span className="font-bold text-blue-600">{conversations.filter((c) => c.status === 'active').length}</span>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                         <Video className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Calls</h3>
                        <p className="text-3xl font-extrabold text-gray-900">{calls.length}</p>
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3 text-sm text-gray-600">
                     Active Sessions: <span className="font-bold text-green-600">{activeCalls.length}</span>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                         <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Avg Duration</h3>
                        <p className="text-3xl font-extrabold text-gray-900">
                            {formatDuration(
                                Math.floor(
                                calls.reduce((sum, call) => sum + (call.duration || 0), 0) / calls.length || 0
                                )
                            )}
                        </p>
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3 text-sm text-gray-600">
                     Time spent engaging
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
                   <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
                         <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Handoff Rate</h3>
                        <p className="text-3xl font-extrabold text-gray-900">
                            {conversations.length > 0
                                ? Math.round(
                                    (conversations.filter((c) => c.status === 'handoff').length /
                                    conversations.length) *
                                    100
                                )
                                : 0}
                            <span className="text-lg text-gray-400 ml-1">%</span>
                        </p>
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3 text-sm text-gray-600">
                     Bot to Human
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Conversation Detail Modal */}
      <AnimatePresence>
      {selectedConversation && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <MessageSquare size={20} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-gray-900">Conversation Details</h2>
                    <p className="text-xs text-gray-500">{selectedConversation.conversationId}</p>
                 </div>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {selectedConversation.messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                    <EmptyState
                        title="No messages"
                        description="This conversation has no messages yet."
                        icon={MessageSquare}
                    />
                </div>
              ) : (
                selectedConversation.messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {msg.sender === 'user' ? 'U' : 'B'}
                  </div>
                  <div className={`flex flex-col max-w-[70%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-5 py-3 text-sm shadow-sm ${
                        msg.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                <button
                   onClick={() => setSelectedConversation(null)}
                   className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                   Close
                </button>
                {selectedConversation.status !== 'handoff' ? (
                  <button
                    onClick={() => {
                        handleTakeOver(selectedConversation.conversationId);
                        setSelectedConversation(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <Users size={16} />
                    Take Over Conversation
                  </button>
                ) : (
                  <button
                    onClick={() => {
                        handleReturnToBot(selectedConversation.conversationId);
                        setSelectedConversation(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Return to Bot
                  </button>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default CommunicationsDashboard;
