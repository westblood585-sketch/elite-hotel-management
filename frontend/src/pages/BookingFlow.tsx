import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  fetchPublicRoomById,
  getQuote,
  createPublicReservation,
  type PublicRoom,
  type QuoteResponse,
} from '@/services/publicApi'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

// ============= TYPE DEFINITIONS =============

interface BookingFormData {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  specialRequests?: string
}

type BookingStep = 'review' | 'guest-details' | 'payment' | 'confirmation'
type PaymentProvider = 'Stripe' | 'Razorpay'

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any
  }
}

// ============= STRIPE PAYMENT FORM =============

const StripePaymentForm: React.FC<{
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
  clientSecret: string
}> = ({ amount, onSuccess, onError, clientSecret }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess()
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-4 border border-gray-300 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Test Mode:</strong> Use card number <code>4242 4242 4242 4242</code>,
          any future expiry date, and any 3-digit CVC.
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Processing...
          </>
        ) : (
          <>Pay ${(amount / 100).toFixed(2)}</>
        )}
      </button>
    </form>
  )
}

// ============= MAIN BOOKING FLOW COMPONENT =============

const BookingFlow: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // State
  const [currentStep, setCurrentStep] = useState<BookingStep>('review')
  const [room, setRoom] = useState<PublicRoom | null>(null)
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [formData, setFormData] = useState<BookingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    specialRequests: '',
  })
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('Stripe')
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null)
  const [paymentOrder, setPaymentOrder] = useState<any>(null)
  const [reservationCode, setReservationCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Partial<BookingFormData>>({})

  // Get query params
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = parseInt(searchParams.get('guests') || '2')

  // Fetch room and quote on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!roomId || !checkIn || !checkOut) {
        setError('Missing booking details. Please start from the search page.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch room details
        const roomData = await fetchPublicRoomById(roomId)
        setRoom(roomData)

        // Get price quote
        const quoteData = await getQuote({
          roomId,
          checkIn,
          checkOut,
          adults: guests,
          currency: 'usd',
        })
        setQuote(quoteData)

        setIsLoading(false)
      } catch (err) {
        console.error('Failed to fetch booking data:', err)
        setError('Failed to load booking details. Please try again.')
        setIsLoading(false)
      }
    }

    fetchData()
  }, [roomId, checkIn, checkOut, guests])

  // Validate guest details form
  const validateGuestDetails = (): boolean => {
    const errors: Partial<BookingFormData> = {}

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address'
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required'
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      errors.phoneNumber = 'Invalid phone number'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle payment initiation
  const handleInitiatePayment = async () => {
    if (!room || !quote) return

    try {
      setIsLoading(true)
      setError(null)

      const reservation = await createPublicReservation({
        roomId: room._id,
        checkIn,
        checkOut,
        adults: guests,
        children: 0,
        guestDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        },
        paymentProvider,
        requiresPrepayment: true,
        currency: quote.currency,
        notes: formData.specialRequests,
      })

      setReservationCode(reservation.code)

      if (paymentProvider === 'Stripe') {
        setPaymentClientSecret(reservation.paymentClientSecret || null)
        setCurrentStep('payment')
      } else if (paymentProvider === 'Razorpay') {
        setPaymentOrder(reservation.paymentOrder)
        handleRazorpayPayment(reservation.paymentOrder)
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Failed to initiate payment:', err)
      setError('Failed to initiate payment. Please try again.')
      setIsLoading(false)
    }
  }

  // Handle Razorpay payment
  const handleRazorpayPayment = (order: any) => {
    if (!window.Razorpay) {
      setError('Razorpay is not loaded. Please refresh the page.')
      return
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Elite Hotel',
      description: `Booking for ${room?.name}`,
      order_id: order.id,
      handler: function (response: RazorpayResponse) {
        setCurrentStep('confirmation')
      },
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        contact: formData.phoneNumber,
      },
      theme: {
        color: '#d97706', // primary-600
      },
      modal: {
        ondismiss: function () {
          setError('Payment was cancelled')
          setCurrentStep('guest-details')
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Loading state
  if (isLoading && currentStep === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading booking details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && currentStep === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/search-results')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    )
  }

  if (!room || !quote) {
    return null
  }

  const nights = calculateNights()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['review', 'guest-details', 'payment', 'confirmation'].map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep === step
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : index <
                        ['review', 'guest-details', 'payment', 'confirmation'].indexOf(
                          currentStep
                        )
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index <
                      ['review', 'guest-details', 'payment', 'confirmation'].indexOf(
                        currentStep
                      )
                        ? 'bg-primary-600'
                        : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">Review</span>
            <span className="text-xs text-gray-600">Guest Details</span>
            <span className="text-xs text-gray-600">Payment</span>
            <span className="text-xs text-gray-600">Confirmation</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* STEP 1: REVIEW */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Review Your Booking</h2>

              {/* Room Details */}
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={room.images?.[0]?.url || room.image?.url || '/placeholder-room.jpg'}
                  alt={room.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{room.name}</h3>
                  <p className="text-gray-600 mb-4">Room #{room.number}</p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities?.slice(0, 5).map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-semibold">{new Date(checkIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-semibold">{new Date(checkOut).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nights:</span>
                  <span className="font-semibold">{nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests:</span>
                  <span className="font-semibold">{guests}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-6 space-y-3">
                <h4 className="font-semibold text-lg mb-4">Price Breakdown</h4>
                {quote.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between text-gray-600">
                    <span>{item.label}</span>
                    <span>${item.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">${quote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep('guest-details')}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all"
              >
                Continue to Guest Details
              </button>
            </div>
          )}

          {/* STEP 2: GUEST DETAILS */}
          {currentStep === 'guest-details' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Guest Information</h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (validateGuestDetails()) {
                    setCurrentStep('payment')
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className={`w-full px-4 py-3 rounded-lg border ${
                        validationErrors.firstName
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500`}
                      placeholder="John"
                    />
                    {validationErrors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-lg border ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500`}
                    placeholder="john.doe@example.com"
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-lg border ${
                      validationErrors.phoneNumber
                        ? 'border-red-500'
                        : 'border-gray-300'
                    } focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500`}
                    placeholder="+1234567890"
                  />
                  {validationErrors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) =>
                      setFormData({ ...formData, specialRequests: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="E.g., late check-in, dietary restrictions, accessibility needs..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('review')}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {currentStep === 'payment' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Payment</h2>

              {/* Payment Provider Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentProvider('Stripe')}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    paymentProvider === 'Stripe'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <svg className="h-8 mx-auto mb-2" viewBox="0 0 60 25">
                      <path
                        fill="#635BFF"
                        d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.93 0 1.85 6.29.97 6.29 5.88z"
                      />
                    </svg>
                    <p className="font-semibold">Credit/Debit Card</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentProvider('Razorpay')}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    paymentProvider === 'Razorpay'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="h-8 flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-[#0C2451]">Razorpay</span>
                    </div>
                    <p className="font-semibold">UPI / Cards / Wallets</p>
                  </div>
                </button>
              </div>

              {/* Stripe Payment Form (shown only if Stripe selected and not initiated) */}
              {paymentProvider === 'Stripe' && !paymentClientSecret && (
                <button
                  onClick={handleInitiatePayment}
                  disabled={isLoading}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Initiating Payment...' : 'Continue with Stripe'}
                </button>
              )}

              {/* Stripe Elements (shown when clientSecret is available) */}
              {paymentProvider === 'Stripe' && paymentClientSecret && (
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    amount={quote.total * 100} // Convert to cents
                    clientSecret={paymentClientSecret}
                    onSuccess={() => setCurrentStep('confirmation')}
                    onError={(err) => setError(err)}
                  />
                </Elements>
              )}

              {/* Razorpay Payment */}
              {paymentProvider === 'Razorpay' && (
                <button
                  onClick={handleInitiatePayment}
                  disabled={isLoading}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Initiating Payment...' : 'Continue with Razorpay'}
                </button>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <button
                onClick={() => setCurrentStep('guest-details')}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Back to Guest Details
              </button>
            </div>
          )}

          {/* STEP 4: CONFIRMATION */}
          {currentStep === 'confirmation' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h2>
              <p className="text-gray-600 text-lg">
                Your payment was successful and your booking has been confirmed.
              </p>

              {reservationCode && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                  <p className="text-sm text-primary-800 mb-2">Your Reservation Code</p>
                  <p className="text-3xl font-bold text-primary-900">{reservationCode}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-6 text-left space-y-3">
                <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
                <div className="flex justify-between">
                  <span className="text-gray-600">Room:</span>
                  <span className="font-semibold">{room.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-semibold">{new Date(checkIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-semibold">{new Date(checkOut).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guest:</span>
                  <span className="font-semibold">
                    {formData.firstName} {formData.lastName}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Paid:</span>
                    <span className="text-primary-600">${quote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  A confirmation email has been sent to <strong>{formData.email}</strong> with your booking details.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => navigate('/search-results')}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all"
                >
                  Book Another Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingFlow
