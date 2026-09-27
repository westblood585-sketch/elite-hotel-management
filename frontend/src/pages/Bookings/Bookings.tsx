import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isPast, isFuture, isToday } from 'date-fns'
import { getMyReservations } from '@/services/reservationApi'
import type { Reservation } from '@/services/reservationApi'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

type TabType = 'active' | 'upcoming' | 'past' | 'cancelled'

const Bookings: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('active')

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const data = await getMyReservations()
      setReservations(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load your bookings')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredReservations = () => {
    return reservations.filter(res => {
      const checkIn = new Date(res.checkIn)
      const checkOut = new Date(res.checkOut)
      
      switch (activeTab) {
        case 'active':
          // Confirmed/CheckedIn and currently happening (or today)
          return (res.status === 'Confirmed' || res.status === 'CheckedIn') && 
                 (isToday(checkIn) || (isPast(checkIn) && isFuture(checkOut)))
        case 'upcoming':
          return (res.status === 'Confirmed' || res.status === 'PendingPayment') && isFuture(checkIn)
        case 'past':
          return (res.status === 'CheckedOut' || (isPast(checkOut) && res.status !== 'Cancelled'))
        case 'cancelled':
          return res.status === 'Cancelled'
        default:
          return true
      }
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800'
      case 'CheckedIn': return 'bg-blue-100 text-blue-800'
      case 'CheckedOut': return 'bg-gray-100 text-gray-800'
      case 'PendingPayment': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredReservations = getFilteredReservations()

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading">My Bookings</h1>
            <p className="mt-2 text-gray-600">Manage and view your travel history</p>
          </div>
          <button 
            onClick={() => navigate('/rooms')}
            className="mt-4 md:mt-0 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold shadow-lg hover:bg-black transition-all"
          >
            Book New Stay
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto space-x-1 bg-white p-1 rounded-xl shadow-sm mb-8 border border-gray-100">
            {['active', 'upcoming', 'past', 'cancelled'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as TabType)}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap capitalize ${
                        activeTab === tab 
                        ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    {tab} ({getFilteredReservations().length})
                </button>
            ))}
        </div>

        {/* List */}
        <div className="space-y-6">
          {filteredReservations.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900">No {activeTab} bookings</h3>
                 <p className="text-gray-500 mt-1">You don't have any reservations in this category.</p>
             </div>
          ) : (
             filteredReservations.map((res, idx) => (
                <motion.div 
                    key={res._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/book/details/${res._id}`)} // Or /bookings/:id. Let's use /bookings/:id
                >
                    <div className="flex flex-col md:flex-row">
                        {/* Image Placeholder or Actual Image if available */}
                        <div className="w-full md:w-64 h-48 bg-gray-200 flex-shrink-0 relative">
                             {/* Future: Add room image here. For now a pattern or placeholder */}
                             <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             </div>
                             <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                {res.nights} Nights
                             </div>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(res.status)}`}>
                                            {res.status}
                                        </span>
                                        <span className="text-sm text-gray-500 font-mono">#{res.code}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Booked Room {res.roomId.slice(-4)}</h3> {/* Should ideally fetch room name, but standard practice is populated or separate fetch. Let's assume Room details might be missing or populated. Check PublicReservationResponse type later. */}
                                    <p className="text-gray-500 text-sm mt-1">
                                        {format(new Date(res.checkIn), 'MMM dd, yyyy')} — {format(new Date(res.checkOut), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">{res.currency} {res.totalAmount.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Total Price</p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between items-center border-t border-gray-50 pt-4">
                                <div className="text-sm text-gray-500">
                                    {res.adults} Adults, {res.children} Children
                                </div>
                                <button className="text-primary-600 font-semibold text-sm hover:text-primary-800 flex items-center">
                                    View Details <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
             ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Bookings
