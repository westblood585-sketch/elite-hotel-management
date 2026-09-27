import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

const searchSchema = z.object({
  checkIn: z.string().refine((val) => {
    const date = new Date(val)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }, { message: "Check-in date cannot be in the past" }),
  checkOut: z.string().refine((val) => {
    const date = new Date(val)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date > today
  }, { message: "Check-out date must be in the future" }),
  roomType: z.string().optional(),
  guests: z.string().optional(),
}).refine((data) => {
  if (data.checkIn && data.checkOut) {
    return new Date(data.checkOut) > new Date(data.checkIn)
  }
  return true
}, {
  message: "Check-out date must be after check-in date",
  path: ["checkOut"]
})

const RoomBookingSearch = () => {
  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0]

  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [roomType, setRoomType] = useState('')
  const [guests, setGuests] = useState('2')
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const navigate = useNavigate()

  // Updated to match backend enum + category (simplified for user selection)
  const roomTypeOptions = [
    { value: '', label: 'All Room Types' },
    { value: 'Standard', label: 'Standard' },
    { value: 'Deluxe', label: 'Deluxe' },
    { value: 'Premium', label: 'Premium' },
    { value: 'Luxury', label: 'Luxury' },
  ]

  const guestsOptions = [
    { value: '1', label: '1 Guest' },
    { value: '2', label: '2 Guests' },
    { value: '3', label: '3 Guests' },
    { value: '4', label: '4 Guests' },
    { value: '5', label: '5+ Guests' },
  ]



  const calendarIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )

  const dropdownIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  )

  const handleSearch = () => {
    // Validate inputs
    const result = searchSchema.safeParse({ checkIn, checkOut, roomType, guests })

    if (!result.success) {
      const fieldErrors: {[key: string]: string} = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setErrors({}) // Clear errors

    const params = new URLSearchParams()
    
    if (checkIn) params.append('checkIn', checkIn)
    if (checkOut) params.append('checkOut', checkOut)
    if (roomType) params.append('roomType', roomType)
    if (guests) params.append('guests', guests)

    const searchString = params.toString()
    navigate(`/search-results${searchString ? `?${searchString}` : ''}`)
  }

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCheckIn(e.target.value) 
    if (errors.checkIn) setErrors({...errors, checkIn: ''})
    
    // Auto-update check-out min date or clear if invalid
    if (e.target.value) {
       // If check-out is before or same as new check-in, separate it
       if (checkOut && new Date(checkOut) <= new Date(e.target.value)) {
          setCheckOut('')
       }
    }
  }

  const getMinCheckOutDate = () => {
    if (checkIn) {
      const date = new Date(checkIn)
      date.setDate(date.getDate() + 1)
      return date.toISOString().split('T')[0]
    }
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
      <div 
        className="bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl p-4 lg:p-6 border border-white/20 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <h2 className="text-lg lg:text-2xl font-serif font-bold mb-4 text-center text-white drop-shadow-md">
          Find Your Perfect Sanctuary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 relative z-10">
          <div className="space-y-1.5">
            <label htmlFor="check-in-date" className="block text-xs font-medium text-white/90 ml-1">Check-in Date</label>
            <div className="relative group/input">
              <input
                id="check-in-date"
                name="checkIn"
                type="date"
                value={checkIn}
                onChange={handleCheckInChange}
                min={today}
                className={`w-full px-3 py-2.5 rounded-lg bg-white/10 border ${errors.checkIn ? 'border-red-400' : 'border-white/20'} text-white placeholder-white/50 text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 focus:bg-white/20 transition-all outline-none backdrop-blur-md`}
              />
              {calendarIcon}
            </div>
             {errors.checkIn && <p className="text-[10px] text-red-300 mt-1 ml-1">{errors.checkIn}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="check-out-date" className="block text-xs font-medium text-white/90 ml-1">Check-out Date</label>
             <div className="relative group/input">
              <input
                id="check-out-date"
                name="checkOut"
                type="date"
                value={checkOut}
                onChange={(e) => {
                  setCheckOut(e.target.value)
                  if (errors.checkOut) setErrors({...errors, checkOut: ''})
                }}
                min={getMinCheckOutDate()}
                className={`w-full px-3 py-2.5 rounded-lg bg-white/10 border ${errors.checkOut ? 'border-red-400' : 'border-white/20'} text-white placeholder-white/50 text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 focus:bg-white/20 transition-all outline-none backdrop-blur-md`}
              />
              {calendarIcon}
            </div>
             {errors.checkOut && <p className="text-[10px] text-red-300 mt-1 ml-1">{errors.checkOut}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="room-type" className="block text-xs font-medium text-white/90 ml-1">Room Type</label>
             <div className="relative group/input">
              <select
                id="room-type"
                name="roomType"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 focus:bg-white/20 transition-all outline-none backdrop-blur-md appearance-none cursor-pointer [&>option]:bg-gray-800"
              >
                {roomTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white/70">
                {dropdownIcon}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="guests" className="block text-xs font-medium text-white/90 ml-1">Guests</label>
             <div className="relative group/input">
              <select
                id="guests"
                name="guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                 className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 focus:bg-white/20 transition-all outline-none backdrop-blur-md appearance-none cursor-pointer [&>option]:bg-gray-800"
              >
                {guestsOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
               <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white/70">
                {dropdownIcon}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={handleSearch}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white py-3 rounded-lg font-bold text-base shadow-lg hover:shadow-amber-900/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative z-10"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span className="relative z-10">Check Availability</span>
          </button>
        </div>
      </div>
    </div>
  )
}
export default RoomBookingSearch
