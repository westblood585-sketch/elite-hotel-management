import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReservationById } from '@/services/reservationApi'
import type { Reservation } from '@/services/reservationApi'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface BookingDetailsProps {
    // Optional: allow passing pre-fetched reservation (e.g. from FindBooking)
    reservation?: Reservation 
}

const BookingDetails: React.FC<BookingDetailsProps> = ({ reservation: initialReservation }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!initialReservation)
  const [reservation, setReservation] = useState<Reservation | null>(initialReservation || null)

  useEffect(() => {
    if (initialReservation) return
    if (!id) return

    const fetchDetails = async () => {
      try {
        setLoading(true)
        const data = await getReservationById(id)
        setReservation(data)
      } catch (error) {
        console.error(error)
        toast.error('Failed to load reservation details')
        navigate('/bookings')
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [id, initialReservation, navigate])

  const handleDownloadInvoice = () => {
      if (!reservation) return
      // Use window.open or hidden iframe to trigger download
      // Requires backend endpoint for invoice generation
      const billingUrl = `${import.meta.env.VITE_API_BASE_URL}/billing/reservation/${reservation._id}/download` 
      // Assuming generic endpoint exists or use id. 
      // If endpoint not ready, toast.
      toast.info("Invoice download starting...")
      window.open(billingUrl, '_blank')
  }

  if (loading) return <LoadingSpinner />
  if (!reservation) return null

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back
            </button>
            <div className="flex gap-2">
                 {/* Actions like Cancel, etc. could go here */}
                 {['Confirmed', 'CheckedOut'].includes(reservation.status) && (
                     <button 
                        onClick={handleDownloadInvoice}
                        className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm"
                     >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Invoice
                     </button>
                 )}
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header Banner */}
            <div className={`p-8 ${reservation.status === 'Cancelled' ? 'bg-red-50' : 'bg-primary-50'} border-b border-gray-100`}>
                <div className="flex justify-between items-start">
                    <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 ${
                            reservation.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                            reservation.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {reservation.status}
                        </span>
                        <h1 className="text-3xl font-bold text-gray-900 font-heading">Reservation #{reservation.code}</h1>
                    </div>
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Details */}
                <div className="space-y-8">
                     <div>
                         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Dates & Guests</h3>
                         <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 rounded-xl bg-gray-100 flex flex-col items-center justify-center text-gray-700 font-bold border border-gray-200">
                                 <span className="text-xs uppercase">{format(new Date(reservation.checkIn), 'MMM')}</span>
                                 <span className="text-lg">{format(new Date(reservation.checkIn), 'dd')}</span>
                             </div>
                             <div className="h-0.5 w-8 bg-gray-200"></div>
                             <div className="w-12 h-12 rounded-xl bg-gray-100 flex flex-col items-center justify-center text-gray-700 font-bold border border-gray-200">
                                 <span className="text-xs uppercase">{format(new Date(reservation.checkOut), 'MMM')}</span>
                                 <span className="text-lg">{format(new Date(reservation.checkOut), 'dd')}</span>
                             </div>
                         </div>
                         <p className="text-gray-600 font-medium">{reservation.nights} Nights</p>
                         <p className="text-gray-500 text-sm mt-1">{reservation.adults} Adults, {reservation.children} Children</p>
                     </div>

                     <div>
                         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Room Details</h3>
                         {/* We might not have full room object populated, depending on backend. */}
                         {/* Assuming roomId is populated or we fetched it separate. Backend usually populates roomId. */}
                         {/* If roomId is just a string, we display generic info. */}
                         <p className="text-lg font-bold text-gray-900">Room ID: {typeof reservation.roomId === 'object' ? (reservation.roomId as any).number : '...'}</p>
                         <p className="text-gray-600 text-sm">Type: {typeof reservation.roomId === 'object' ? (reservation.roomId as any).type : 'Standard'}</p>
                     </div>
                </div>

                {/* Right Column: Payment & Breakdown */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Payment Summary</h3>
                    
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Rate</span>
                            <span className="font-medium">{reservation.currency} {reservation.baseRate.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Taxes & Fees</span>
                            <span className="font-medium">{reservation.currency} {(reservation.taxes + reservation.fees).toFixed(2)}</span>
                        </div>
                        {/* Add more lines if API response has breakdown array */}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total Paid</span>
                        <span className="font-bold text-xl text-primary-700">{reservation.currency} {reservation.totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Payment Method</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            {reservation.paymentProvider === 'Stripe' ? (
                                <>
                                    <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.412C17.822 1.09 15.908.5 13.88.5 8.909.5 5.398 3.134 5.398 6.957c0 2.922 2.187 4.195 5.492 5.112 2.656.84 3.09 1.488 3.09 2.348 0 .904-.749 1.435-2.025 1.435-1.996 0-4.702-.876-6.527-1.802l-.934 5.514c2.193.856 4.701 1.336 6.963 1.336 5.378 0 8.877-2.618 8.877-6.586 0-2.837-2.074-4.225-5.357-5.164h-.001z"/></svg>
                                    Credit Card (Stripe)
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                    Razorpay / UPI
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default BookingDetails
