import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { format, addDays, differenceInCalendarDays } from 'date-fns'
import {
  fetchPublicRoomById,
  getQuote,
  createPublicReservation,
  searchAvailableRooms,
  type PublicRoom,
  type QuoteResponse,
  type GuestDetails,
  lookupGuest,
} from '@/services/publicApi'
import { toast } from 'sonner'
import { DetailSkeleton } from '@/components/common/LoadingSkeleton'
import { z } from 'zod'
import StripePaymentModal from '@/components/shared/StripePaymentModal'
import { useRazorpay } from '@/Hooks/useRazorpay'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, 
  ChevronRight, 
  CreditCard, 
  User, 
  Calendar, 
  Users, 
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
  Mail,
  Phone,
  BedDouble,
  Receipt
} from 'lucide-react'

// ============= STEPS =============
// 1. Review
// 2. Guest Details
// 3. Payment
// 4. Confirmation

const Booking: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [step, setStep] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [room, setRoom] = useState<PublicRoom | null>(null)
  
  // Booking Data State
  const [checkIn, setCheckIn] = useState<string>(
    searchParams.get('checkIn') || format(new Date(), 'yyyy-MM-dd')
  )
  const [checkOut, setCheckOut] = useState<string>(
    searchParams.get('checkOut') || format(addDays(new Date(), 1), 'yyyy-MM-dd')
  )
  const [guests, setGuests] = useState<number>(() => {
      const g = searchParams.get('guests')
      return g ? parseInt(g) : 0 
  })

  // Track if guests value came from URL or user interaction
  const [guestsSetByUser, setGuestsSetByUser] = useState<boolean>(!!searchParams.get('guests'))

  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  })
  
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [paymentProvider, setPaymentProvider] = useState<'Stripe' | 'Razorpay'>('Razorpay')
  const [confirmedReservation, setConfirmedReservation] = useState<any>(null)
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [showStripeModal, setShowStripeModal] = useState<boolean>(false)
  
  // Availability State
  const [isCheckingAvailability, setIsCheckingAvailability] = useState<boolean>(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  // Guest Lookup State
  const [isGuestLookupMode, setIsGuestLookupMode] = useState<boolean>(true)
  const [lookupValue, setLookupValue] = useState<string>('')
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false)
  
  const isRazorpayLoaded = useRazorpay()

  // 1. Fetch Room Details
  useEffect(() => {
    if (!roomId) return

    const loadRoom = async () => {
      try {
        setIsLoading(true)
        const roomData = await fetchPublicRoomById(roomId)
        setRoom(roomData)
        
        if (!guestsSetByUser) {
             setGuests(roomData.capacity || 2)
        } else if (guests === 0) {
             setGuests(roomData.capacity || 2)
        }

        setIsLoading(false)
      } catch (err) {
        toast.error('Failed to load room details')
        navigate('/rooms')
      }
    }
    loadRoom()
  }, [roomId, navigate])

  // 2. Check Availability and Fetch Quote
  useEffect(() => {
    const checkAvailabilityAndQuote = async () => {
      if (!roomId || !checkIn || !checkOut || !guests || !room) return
      
      if (new Date(checkIn) >= new Date(checkOut)) {
          setAvailabilityError("Check-out date must be after check-in date")
          setQuote(null)
          return
      }

      try {
        setIsCheckingAvailability(true)
        setAvailabilityError(null)
        setQuote(null)

        const availableRooms = await searchAvailableRooms({
            checkIn,
            checkOut,
            adults: guests,
        })

        const isAvailable = availableRooms.some(r => r._id === roomId || (r as any).id === roomId)

        if (!isAvailable) {
            setAvailabilityError("This room is not available for the selected dates.")
            setIsCheckingAvailability(false)
            return
        }

        const quoteData = await getQuote({
          roomId,
          checkIn,
          checkOut,
          adults: guests,
          currency: 'INR',
        })
        setQuote(quoteData)
      } catch (err) {
        console.error("Failed to check availability or get quote", err)
        setAvailabilityError("Failed to verify availability. Please try again.")
        setQuote(null)
      } finally {
        setIsCheckingAvailability(false)
      }
    }

    checkAvailabilityAndQuote()
  }, [roomId, checkIn, checkOut, guests, room])

  const handleCreateReservation = async () => {
    if (!roomId || !quote) return
    
    try {
      setIsLoading(true)
      const res = await createPublicReservation({
        roomId,
        checkIn,
        checkOut,
        adults: guests,
        guestDetails,
        paymentProvider,
        requiresPrepayment: true,
        currency: quote.currency,
      })
      
      if (res.status === 'PendingPayment') {
        if (paymentProvider === 'Razorpay' && res.paymentOrder) {
          handleRazorpayPayment(res)
        } else if (paymentProvider === 'Stripe' && res.paymentClientSecret) {
          setStripeClientSecret(res.paymentClientSecret)
          setConfirmedReservation(res)
          setShowStripeModal(true)
        }
      } else {
        setConfirmedReservation(res)
        setStep(4)
      }
      setIsLoading(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to create reservation')
      setIsLoading(false)
    }
  }

  const handleGuestLookup = async () => {
    if (!lookupValue) return
    
    setIsLookingUp(true)
    try {
        const emailSchema = z.string().email()
        const phoneSchema = z.string().min(10)

        const isEmail = emailSchema.safeParse(lookupValue).success
        const isPhone = !isEmail && phoneSchema.safeParse(lookupValue).success

        if (!isEmail && !isPhone) {
            toast.error("Please enter a valid email address or phone number")
            setIsLookingUp(false)
            return
        }

        const email = isEmail ? lookupValue : undefined
        const phone = isPhone ? lookupValue : undefined
        
        const guest = await lookupGuest(email, phone)
        
        if (guest) {
            setGuestDetails({
                firstName: guest.firstName,
                lastName: guest.lastName || '',
                email: guest.email,
                phoneNumber: guest.phoneNumber
            })
            setIsGuestLookupMode(false)
            toast.success(`Welcome back, ${guest.firstName}!`)
            setStep(3)
        } else {
             setIsGuestLookupMode(false)
             setGuestDetails(prev => ({
                 ...prev,
                 email: isEmail ? lookupValue : prev.email,
                 phoneNumber: isPhone ? lookupValue : prev.phoneNumber
             }))
             toast.info("We couldn't find your details. Please enter them below.")
        }
    } catch (err) {
        console.error(err)
        setIsGuestLookupMode(false)
    } finally {
        setIsLookingUp(false)
    }
  }

  const handleRazorpayPayment = (reservation: any) => {
    if (!isRazorpayLoaded) {
      toast.error('Payment gateway not ready. Please refresh.')
      return
    }
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: reservation.paymentOrder.amount,
      currency: reservation.paymentOrder.currency,
      name: 'Elite Hotel',
      description: `Booking for ${room?.name}`,
      order_id: reservation.paymentOrder.id,
      handler: async function () {
        setConfirmedReservation(reservation)
        setStep(4)
        toast.success('Payment Successful!')
      },
      prefill: {
        name: `${guestDetails.firstName} ${guestDetails.lastName}`,
        email: guestDetails.email,
        contact: guestDetails.phoneNumber,
      },
      theme: {
        color: '#D97706',
      },
    }

    const rzp1 = new (window as any).Razorpay(options)
    rzp1.open()
  }

  if (isLoading && step === 1 && !room) {
    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <DetailSkeleton />
            </div>
        </div>
    )
  }

  if (!room) return null

  const steps = [
      { id: 1, label: 'Review', icon: <Check size={16} /> },
      { id: 2, label: 'Guest Details', icon: <User size={16} /> },
      { id: 3, label: 'Payment', icon: <CreditCard size={16} /> },
      { id: 4, label: 'Done', icon: <Sparkles size={16} /> },
  ]
  
  const nights = quote?.nights || (checkIn && checkOut ? Math.max(1, differenceInCalendarDays(new Date(checkOut), new Date(checkIn))) : 1)

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-amber-50">
      {/* Decorative Background */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>
      <div className="fixed top-20 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
        
        {/* Navigation & Header */}
        <div className="mb-8 flex items-center justify-between">
           <button 
             onClick={() => {
                if(step > 1 && step < 4) setStep(step - 1)
                else navigate(-1)
             }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 text-sm font-medium text-gray-600 hover:bg-white/80 transition-all hover:shadow-sm"
           >
              <ArrowLeft size={16} />
              {step > 1 && step < 4 ? 'Previous Step' : 'Back to Room'}
           </button>
        </div>

        {/* Wizard Progress */}
        <div className="mb-12 relative max-w-3xl mx-auto">
            <div className="flex justify-between items-center relative z-10">
              {steps.map((s) => (
                <div key={s.id} className="flex flex-col items-center group cursor-default">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 shadow-xl ${
                       step >= s.id 
                       ? 'bg-amber-900 border-amber-900 text-white shadow-amber-900/20 scale-100 rotate-0' 
                       : 'bg-white/80 border-white text-gray-400 shadow-gray-200/50 scale-90 rotate-45'
                   }`}>
                     <div className={step >= s.id ? 'rotate-0' : '-rotate-45'}>{s.icon}</div>
                   </div>
                   <span className={`mt-3 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${step >= s.id ? 'text-amber-900' : 'text-gray-400'}`}>
                       {s.label}
                   </span>
                </div>
              ))}
            </div>
            {/* Connecting Line */}
            <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200/50 -z-0">
               <div className="h-full bg-amber-900/20 transition-all duration-500 ease-out" style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}></div>
            </div>
        </div>

        {/* Main Glass Card */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden"
        >
             <AnimatePresence mode="wait">
                {/* Step 1: Summary / Review */}
                {step === 1 && (
                <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 md:p-12 lg:p-16"
                >
                    <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-8 text-center">Confirm Your Dates</h2>
                    
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Left: Room Preview */}
                        <div className="space-y-6">
                            <div className="relative rounded-3xl overflow-hidden shadow-lg group">
                                <img 
                                    src={room.image?.url || room.images?.[0]?.url} 
                                    alt={room.name} 
                                    className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1 shadow-black/50 drop-shadow-md">{room.name}</h3>
                                        <p className="text-white/90 font-medium">Room #{room.number}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {room.amenities?.slice(0, 5).map(amenity => (
                                    <span key={amenity} className="px-4 py-2 bg-white/50 border border-white/60 text-gray-700 text-xs font-semibold rounded-full backdrop-blur-sm">
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Right: Controls & Quote */}
                        <div className="space-y-8">
                            <div className="bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-sm space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            <Calendar size={14} className="text-amber-600"/> Check-in
                                        </label>
                                        <input 
                                            type="date"
                                            value={checkIn}
                                            min={format(new Date(), 'yyyy-MM-dd')}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/80 border border-transparent rounded-xl focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/20 outline-none font-semibold text-gray-900 cursor-pointer shadow-sm transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            <Calendar size={14} className="text-amber-600"/> Check-out
                                        </label>
                                        <input 
                                            type="date"
                                            value={checkOut}
                                            min={checkIn ? format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/80 border border-transparent rounded-xl focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/20 outline-none font-semibold text-gray-900 cursor-pointer shadow-sm transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                     <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        <Users size={14} className="text-amber-600"/> Guests
                                     </label>
                                     <div className="relative">
                                        <input 
                                            type="number"
                                            min="1"
                                            max={room.capacity}
                                            value={guests}
                                            onChange={(e) => {
                                                setGuests(parseInt(e.target.value))
                                                setGuestsSetByUser(true)
                                            }}
                                            className="w-full px-4 py-3 bg-white/80 border border-transparent rounded-xl focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/20 outline-none font-semibold text-gray-900 shadow-sm transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 bg-gray-100/50 px-2 py-1 rounded-md">Max {room.capacity}</span>
                                     </div>
                                </div>
                            </div>
                            
                            {/* Availability Feedback */}
                            {isCheckingAvailability && (
                                <div className="flex justify-center items-center py-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                    <Loader2 className="animate-spin text-amber-600 mr-2" size={20} />
                                    <span className="text-amber-900 font-medium">Checking availability...</span>
                                </div>
                            )}

                            {availabilityError && (
                                <div className="bg-red-50/90 border border-red-100 text-red-700 px-6 py-4 rounded-2xl flex items-start shadow-sm">
                                    <ShieldCheck className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">Not Available</p>
                                        <p className="text-sm opacity-90">{availabilityError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Quote Display */}
                            {quote && !isCheckingAvailability && !availabilityError && (
                                <div className="bg-amber-50/50 border border-amber-100/50 p-6 rounded-2xl space-y-4">
                                     <div className="flex items-center gap-2 mb-2">
                                        <Receipt size={18} className="text-amber-700" />
                                        <h4 className="font-bold text-gray-900">Price Breakdown</h4>
                                     </div>
                                     <div className="space-y-2">
                                        {quote.breakdown?.map((item, i) => (
                                            <div key={i} className="flex justify-between text-sm items-center">
                                                <span className="text-gray-600">{item.label}</span>
                                                <span className="font-medium text-gray-900 tracking-wide font-mono">{quote.currency} {Math.abs(item.amount).toFixed(2)}</span>
                                            </div>
                                        ))}
                                     </div>
                                     <div className="border-t border-amber-200/50 pt-4 flex justify-between items-center">
                                        <span className="font-bold text-lg text-gray-900">Total</span>
                                        <span className="font-bold text-2xl text-amber-900 font-mono tracking-tight">{quote.currency} {quote.total.toFixed(2)}</span>
                                     </div>
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setStep(2)}
                                disabled={!quote || !!availabilityError || isCheckingAvailability}
                                className="w-full py-5 bg-amber-900 text-white rounded-2xl font-bold text-lg hover:bg-amber-950 transition-all shadow-xl hover:shadow-2xl hover:shadow-amber-900/20 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 group"
                            >
                                Continue Details <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </motion.div>
                )}

                {/* Step 2: Guest Details */}
                {step === 2 && (
                <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 md:p-12 lg:p-16 max-w-3xl mx-auto"
                >
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2 text-center">Guest Information</h2>
                    <p className="text-center text-gray-500 mb-10">We need a few details to secure your reservation.</p>

                    {isGuestLookupMode ? (
                        <div className="space-y-8">
                             <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-center">
                                 <p className="text-blue-900 font-medium text-sm">
                                    Returning guest? Eneter your email or phone and we'll fill the rest.
                                 </p>
                             </div>

                             <div className="relative group">
                                <input 
                                    type="text"
                                    value={lookupValue}
                                    onChange={(e) => setLookupValue(e.target.value)}
                                    placeholder="Enter email or phone..."
                                    className="w-full px-6 py-5 bg-white/60 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-xl transition-all shadow-sm group-hover:bg-white/80"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleGuestLookup()
                                    }}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                     {isLookingUp && <Loader2 className="animate-spin text-amber-600" />}
                                </div>
                             </div>

                             <button 
                                onClick={handleGuestLookup}
                                disabled={!lookupValue || isLookingUp}
                                className="w-full py-4 bg-amber-900 text-white rounded-2xl font-bold hover:bg-amber-950 transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
                             >
                                {isLookingUp ? 'Searching...' : 'Continue'}
                             </button>

                             <div className="text-center">
                                <button onClick={() => setIsGuestLookupMode(false)} className="text-sm font-bold text-gray-500 hover:text-amber-900 underline decoration-2 underline-offset-4 transition-colors">
                                    Or enter details manually
                                </button>
                             </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">First Name</label>
                                    <input 
                                        type="text" 
                                        value={guestDetails.firstName}
                                        onChange={e => setGuestDetails({...guestDetails, firstName: e.target.value})}
                                        className="w-full px-5 py-3 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Last Name</label>
                                    <input 
                                        type="text" 
                                        value={guestDetails.lastName}
                                        onChange={e => setGuestDetails({...guestDetails, lastName: e.target.value})}
                                        className="w-full px-5 py-3 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
                                    <input 
                                        type="email" 
                                        value={guestDetails.email}
                                        onChange={e => setGuestDetails({...guestDetails, email: e.target.value})}
                                        className="w-full pl-12 pr-5 py-3 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
                                    <input 
                                        type="tel" 
                                        value={guestDetails.phoneNumber}
                                        onChange={e => setGuestDetails({...guestDetails, phoneNumber: e.target.value})}
                                        className="w-full pl-12 pr-5 py-3 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-8">
                                <button 
                                    onClick={() => setIsGuestLookupMode(true)}
                                    className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => setStep(3)}
                                    disabled={!guestDetails.firstName || !guestDetails.email || !guestDetails.phoneNumber}
                                    className="flex-1 py-4 bg-amber-900 text-white rounded-2xl font-bold hover:bg-amber-950 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
                                >
                                    Proceed to Payment
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 md:p-12 lg:p-16 max-w-3xl mx-auto"
                >
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center">Secure Payment</h2>
                    
                    <div className="space-y-4 mb-10">
                        <div 
                            onClick={() => setPaymentProvider('Razorpay')}
                            className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 group flex items-start gap-4 ${
                                paymentProvider === 'Razorpay' 
                                ? 'border-amber-600 bg-amber-50/50 shadow-lg shadow-amber-900/5' 
                                : 'border-gray-100 bg-white/40 hover:border-amber-200 hover:bg-white/60'
                            }`}
                        >
                            <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentProvider === 'Razorpay' ? 'border-amber-600' : 'border-gray-300'}`}>
                                {paymentProvider === 'Razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900">Razorpay / UPI</h3>
                                <p className="text-gray-500 text-sm mt-1">Pay securely with any UPI app, NetBanking, or Wallet.</p>
                            </div>
                        </div>

                        <div 
                            onClick={() => setPaymentProvider('Stripe')}
                            className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 group flex items-start gap-4 ${
                                paymentProvider === 'Stripe' 
                                ? 'border-amber-600 bg-amber-50/50 shadow-lg shadow-amber-900/5' 
                                : 'border-gray-100 bg-white/40 hover:border-amber-200 hover:bg-white/60'
                            }`}
                        >
                             <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentProvider === 'Stripe' ? 'border-amber-600' : 'border-gray-300'}`}>
                                {paymentProvider === 'Stripe' && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900">Credit / Debit Card</h3>
                                <p className="text-gray-500 text-sm mt-1">Powered by Stripe. Supports all major international cards.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center mb-8">
                       <ShieldCheck className="text-green-600 w-5 h-5 mr-2" />
                       <span className="text-sm font-medium text-gray-500">Payments are 256-bit encrypted and secure.</span>
                    </div>

                    <button 
                        onClick={handleCreateReservation}
                        disabled={isLoading}
                        className="w-full py-5 bg-gradient-to-r from-amber-700 to-amber-900 text-white rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-amber-900/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-3"/> : null}
                        Pay {quote?.currency} {quote?.total.toFixed(2)}
                    </button>
                    
                    <button onClick={() => setStep(2)} className="w-full mt-4 py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors">
                        Go Back
                    </button>
                </motion.div>
                )}

                {/* Step 4: Confirmation */}
                {step === 4 && (
                <motion.div 
                    key="step4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 md:p-12 text-center"
                >
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slow shadow-lg shadow-green-200">
                        <Check className="w-12 h-12 text-green-600" strokeWidth={4} />
                    </div>
                    
                    <div className="mb-8">
                         <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 font-bold text-sm tracking-wide uppercase mb-4">Reservation Confirmed</span>
                         <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">You're All Set!</h2>
                         <p className="text-gray-600 max-w-lg mx-auto">
                            Thank you, <span className="font-bold text-gray-900">{guestDetails.firstName}</span>. A confirmation email has been sent to <span className="font-semibold text-amber-900">{guestDetails.email}</span>.
                         </p>
                    </div>

                    <div className="max-w-xl mx-auto bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 p-8 mb-10 relative">
                        <div className="absolute -left-3 top-1/2 w-6 h-6 bg-white rounded-full border border-gray-100"></div>
                        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-white rounded-full border border-gray-100"></div>

                        <div className="flex justify-between items-center mb-6">
                            <div className="text-left">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Booking ID</p>
                                <p className="text-2xl font-mono font-bold text-gray-900">{confirmedReservation?.code || '---'}</p>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <BedDouble size={24} className="text-amber-700"/>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 text-left text-sm">
                            <div>
                                <p className="text-gray-500 font-medium">Check-in</p>
                                <p className="font-bold text-gray-900">{format(new Date(checkIn), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 font-medium">Check-out</p>
                                <p className="font-bold text-gray-900">{format(new Date(checkOut), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 font-medium">Room</p>
                                <p className="font-bold text-gray-900">{room.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 font-medium">Payment</p>
                                <p className="font-bold text-green-600">Paid • {confirmedReservation?.currency} {confirmedReservation?.totalAmount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button 
                            onClick={() => navigate('/')}
                            className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            Return Home
                        </button>
                        {confirmedReservation && (
                         <button 
                           onClick={async () => {
                               try {
                                   const { downloadInvoice } = await import('@/services/publicApi');
                                   toast.promise(downloadInvoice(confirmedReservation._id), {
                                       loading: 'Generating invoice...',
                                       success: (blob) => {
                                           const url = window.URL.createObjectURL(new Blob([blob]));
                                           const link = document.createElement('a');
                                           link.href = url;
                                           link.setAttribute('download', `invoice_${confirmedReservation.code}.pdf`);
                                           document.body.appendChild(link);
                                           link.click();
                                           link.remove();
                                           return 'Invoice downloaded!';
                                       },
                                       error: 'Failed to download invoice'
                                   });
                               } catch (err) {
                                   console.error(err);
                                   toast.error("Could not download invoice at this time.");
                               }
                           }}
                           className="px-8 py-3 bg-amber-900 text-white rounded-xl font-bold hover:bg-amber-950 transition-all shadow-lg flex items-center justify-center gap-2"
                         >
                           Download Invoice
                         </button>
                        )}
                    </div>
                </motion.div>
                )}
             </AnimatePresence>
        </motion.div>
        
        {/* Stripe Modal */}
        {showStripeModal && stripeClientSecret && quote && (
            <StripePaymentModal 
                clientSecret={stripeClientSecret}
                amount={quote.total}
                currency={quote.currency}
                onClose={() => setShowStripeModal(false)}
                onSuccess={() => {
                    setShowStripeModal(false)
                    setStep(4)
                    toast.success('Payment Successful!')
                }}
            />
        )}
      </div>
    </div>
  )
}

export default Booking
