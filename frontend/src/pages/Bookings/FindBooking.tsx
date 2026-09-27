import React, { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { lookupPublicReservation } from '@/services/publicApi'
import type { Reservation } from '@/services/reservationApi'
import BookingDetails from './BookingDetails'
import { motion } from 'framer-motion'
import { Search, CalendarDays, KeyRound, Mail, Phone, Loader2, ArrowRight } from 'lucide-react'

const findBookingSchema = z.object({
  code: z.string().min(1, 'Reservation code is required'),
  contact: z.string().min(1, 'Email or Phone is required'),
})

const FindBooking: React.FC = () => {
  const [code, setCode] = useState('')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [reservation, setReservation] = useState<Reservation | null>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = findBookingSchema.safeParse({ code, contact })
    if (!validation.success) {
      toast.error((validation as any).error.errors[0].message)
      return
    }

    try {
      setLoading(true)
      const data = await lookupPublicReservation(code, contact)
      if (data) {
        setReservation(data)
        toast.success("Reservation found!")
      } else {
        toast.error("No booking found with these details.")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || "Failed to find booking")
    } finally {
      setLoading(false)
    }
  }

  if (reservation) {
    // Render details view if found
    return <BookingDetails reservation={reservation} />
  }

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-amber-50 flex items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>
      <div className="fixed top-20 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 p-8 md:p-12 overflow-hidden relative">
            
            {/* Subtle Texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

            <div className="text-center mb-10 relative">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  className="w-20 h-20 bg-gradient-to-br from-amber-50 to-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/60 rotate-3"
                >
                    <CalendarDays className="w-10 h-10 text-amber-900" />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">Find Your Booking</h1>
                <p className="text-gray-500 text-sm md:text-base max-w-xs mx-auto">Access your reservation details and manage your stay.</p>
            </div>

            <form onSubmit={handleLookup} className="space-y-6 relative">
                <div className="space-y-2 group">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Reservation Code</label>
                    <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                        <input 
                            type="text" 
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="RES-123456"
                            className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-mono uppercase tracking-wide placeholder:font-sans placeholder:normal-case placeholder:text-gray-400 text-gray-800"
                        />
                    </div>
                </div>

                <div className="space-y-2 group">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email or Phone</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-600 transition-colors flex flex-col">
                           {/* Simple icon switch could go here based on input type, keeping simple for now */}
                           <Mail className="w-5 h-5 absolute opacity-100 transition-opacity" />
                        </div>
                        <input 
                            type="text" 
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="email@example.com"
                            className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none text-gray-800 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <div className="pt-4">
                  <button 
                      type="submit"
                      disabled={loading || !code || !contact}
                      className="w-full py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold text-lg hover:from-black hover:to-gray-900 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2 group"
                  >
                      {loading ? (
                          <>
                           <Loader2 className="animate-spin w-5 h-5" />
                           Searching...
                          </>
                      ) : (
                          <>
                            Find Booking
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                      )}
                  </button>
                </div>
            </form>

            <div className="mt-8 text-center bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
                 <p className="text-sm text-gray-500">
                    Need assistance? <a href="/contact" className="text-amber-800 font-bold hover:underline">Contact Support</a>
                 </p>
            </div>
        </div>
      </motion.div>
    </div>
  )
}

export default FindBooking
