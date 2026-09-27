import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPublicRooms } from '@/services/publicApi'
import { SearchX, WifiOff, Filter, ChevronDown, Check, SlidersHorizontal } from 'lucide-react'
import EmptyState from '@/components/common/EmptyState'
import { LoadingWidget } from '@/components/shared/LoadingWidget'
import { motion, AnimatePresence } from 'framer-motion'

// Type definitions
interface Room {
  id: string
  _id: string
  number: number
  name: string
  type: string
  category?: string
  price: number
  image: string
  images?: { url: string }[]
  description: string
  amenities: string[]
  size: number
  capacity: number
  rating?: number
  available: boolean
}

interface SortOption {
  value: string
  label: string
}

interface FilterOption {
  value: string
  label: string
}

interface SortSelectProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options?: SortOption[]
}

interface FilterSelectProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options?: FilterOption[]
  label: string
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

interface RoomCardProps {
  room: Room
  onViewRoom?: (roomId: string) => void
  onBookRoom?: (roomId: string) => void
}

interface BadgeProps {
  label: string
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'unavailable' | 'glass'
}

interface StarRatingProps {
  rating: number
  maxRating?: number
}

// Badge Component
const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-gray-100/80 text-gray-700 backdrop-blur-sm',
    primary: 'bg-primary-100/80 text-primary-700 backdrop-blur-sm',
    secondary: 'bg-amber-100/80 text-amber-700 backdrop-blur-sm',
    success: 'bg-emerald-100/80 text-emerald-800 backdrop-blur-sm',
    unavailable: 'bg-red-100/80 text-red-700 backdrop-blur-sm',
    glass: 'bg-white/30 text-white backdrop-blur-md border border-white/20'
  }

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${variantClasses[variant]}`}
    >
      {label}
    </span>
  )
}

// StarRating Component
const StarRating: React.FC<StarRatingProps> = ({ rating, maxRating = 5 }) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${
            i < Math.floor(rating)
              ? 'text-amber-400 fill-current drop-shadow-sm'
              : 'text-gray-300'
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8" />
        </svg>
      ))}
      <span className="text-sm text-gray-500 font-medium ml-1">({rating.toFixed(1)})</span>
    </div>
  )
}

// Custom Glass Select Component
const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  options = [],
  label,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
      <div className="relative group">
        <select
          className="w-full appearance-none px-4 py-2.5 rounded-xl border border-white/40 bg-white/50 backdrop-blur-md focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all text-gray-700 font-medium cursor-pointer hover:bg-white/60 shadow-sm"
          value={value}
          onChange={onChange}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-amber-600 transition-colors" />
      </div>
    </div>
  )
}

// Pagination Component
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    let start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <div className="flex justify-center mt-12">
      <nav className="flex items-center gap-2 p-1.5 bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/50" aria-label="Pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl hover:bg-white/80 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-gray-600"
          aria-label="Previous page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {getVisiblePages().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all font-bold text-sm ${
              pageNum === currentPage
                ? 'bg-amber-900 text-white shadow-lg shadow-amber-900/20'
                : 'hover:bg-white/80 text-gray-600 hover:text-amber-900'
            }`}
            aria-label={`Page ${pageNum}`}
            aria-current={pageNum === currentPage ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl hover:bg-white/80 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-gray-600"
          aria-label="Next page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </nav>
    </div>
  )
}

// RoomCard Component
const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onViewRoom,
  onBookRoom,
}) => {
  const handleViewRoom = () => {
    if (onViewRoom) {
      onViewRoom(room.id)
    }
  }

  const handleBookRoom = () => {
    if (room.available && onBookRoom) {
      onBookRoom(room.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={`relative group flex flex-col lg:flex-row rounded-3xl overflow-hidden transition-all duration-300 ${
        room.available
          ? 'bg-white/60 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl hover:shadow-amber-900/5'
          : 'bg-gray-100/50 grayscale-[0.8] opacity-80 border border-gray-200'
      }`}
    >
      {/* Image Section */}
      <div className="relative w-full lg:w-96 h-72 lg:h-auto overflow-hidden">
        <img
          src={room.image}
          alt={room.name}
          className={`w-full h-full object-cover transition-transform duration-700 ${
            room.available ? 'group-hover:scale-110' : ''
          }`}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src =
              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
          }}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
           <Badge label={room.category || 'Standard'} variant="glass" />
        </div>
        
        <div className="absolute bottom-4 left-4 z-10">
           <p className="text-white font-bold text-lg drop-shadow-md">{room.type}</p>
        </div>

        {!room.available && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-red-500/90 text-white px-4 py-2 rounded-xl font-bold backdrop-blur-md border border-red-400/30 shadow-lg">
              Fully Booked
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 p-6 lg:p-8 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h3 className="text-2xl font-serif font-bold text-gray-900 group-hover:text-amber-800 transition-colors">
            {room.name}
          </h3>
          <StarRating rating={room.rating || 4.2} />
        </div>

        {/* Specs */}
        <div className="flex flex-wrap items-center gap-6 mb-6 text-sm text-gray-600 bg-white/40 p-3 rounded-xl backdrop-blur-sm self-start">
          <div className="flex items-center gap-2">
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
              className="text-amber-700"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
            <span className="font-semibold">{room.size}m²</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2">
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
              className="text-amber-700"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="font-semibold">{room.capacity} Guests</span>
          </div>
        </div>

        <p className="mb-6 text-gray-600 leading-relaxed text-sm flex-grow">
          {room.description}
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-8">
          {room.amenities.slice(0, 4).map((amenity, index) => (
            <Badge key={index} label={amenity} variant="secondary" />
          ))}
          {room.amenities.length > 4 && (
            <span className="text-xs text-gray-400 font-medium py-1 px-2">+{room.amenities.length - 4} more</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mt-auto">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Starting from</p>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-bold text-amber-900">${room.price}</span>
               <span className="text-gray-500 font-medium">/night</span>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleViewRoom}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all focus:ring-4 focus:ring-gray-100"
            >
              Details
            </button>
            <button
              onClick={handleBookRoom}
              disabled={!room.available}
              className={`flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 focus:ring-4 ${
                room.available
                  ? 'bg-gradient-to-r from-amber-700 to-amber-900 hover:shadow-amber-900/20 focus:ring-amber-900/20'
                  : 'bg-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {room.available ? 'Book Now' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main RoomsBrowser Component
const RoomsBrowser: React.FC = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState<number>(1)
  const [sortOption, setSortOption] = useState<string>('recommended')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('available')
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [displayedRooms, setDisplayedRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const roomsPerPage = 6

  // Fetch rooms from backend on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetchPublicRooms({
           limit: 100
        })
        
        const roomsData = response.data
        
        const transformedRooms: Room[] = roomsData.map((room) => ({
          id: room._id,
          _id: room._id,
          number: room.number,
          name: room.name,
          type: room.type,
          category: room.category,
          price: room.price,
          image: room.images?.[0]?.url || room.image?.url || '/placeholder-room.jpg',
          images: room.images,
          description: room.description || 'Comfortable and elegant room with modern amenities.',
          amenities: room.amenities || ['Free WiFi', 'Air Conditioning', 'TV'],
          size: room.size || 35,
          capacity: room.capacity || 2,
          rating: room.rating || 4.5,
          available: room.available,
        }))
        
        setRooms(transformedRooms)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
        setError('Failed to load rooms. Please try again later.')
        setIsLoading(false)
        setRooms([])
      }
    }

    fetchRooms()
  }, [])

  const roomTypes = Array.from(new Set(rooms.map((room) => room.type)))
  const typeFilterOptions = [
    { value: 'all', label: 'All Types' },
    ...roomTypes.map((type) => ({ value: type, label: type })),
  ]


  const categoryFilterOptions = [
    { value: 'all', label: 'All Categories' },
    ...['Single', 'Double', 'Triple', 'Quad', 'Family', 'Suite'].map((cat) => ({ value: cat, label: cat })),
  ]

  const availabilityFilterOptions = [
    { value: 'all', label: 'All Rooms' },
    { value: 'available', label: 'Available Only' },
    { value: 'unavailable', label: 'Unavailable Only' },
  ]

  useEffect(() => {
    setIsLoading(true)
    let filtered = [...rooms]

    if (typeFilter !== 'all') {
      filtered = filtered.filter((room) => room.type === typeFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((room) => room.category === categoryFilter)
    }

    if (availabilityFilter === 'available') {
      filtered = filtered.filter((room) => room.available)
    } else if (availabilityFilter === 'unavailable') {
      filtered = filtered.filter((room) => !room.available)
    }

    switch (sortOption) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'rating-desc':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'availability':
        filtered.sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0))
        break
      default:
        filtered.sort((a, b) => {
          if (a.available !== b.available) {
            return b.available ? 1 : -1
          }
          return (b.rating || 0) - (a.rating || 0)
        })
        break
    }

    setTimeout(() => {
      setFilteredRooms(filtered)
      setIsLoading(false)
    }, 300)
  }, [rooms, sortOption, typeFilter, categoryFilter, availabilityFilter])

  useEffect(() => {
    const startIndex = (page - 1) * roomsPerPage
    const endIndex = startIndex + roomsPerPage
    setDisplayedRooms(filteredRooms.slice(startIndex, endIndex))
  }, [filteredRooms, page])

  const calculatedTotalPages = Math.ceil(filteredRooms.length / roomsPerPage)


  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    scrollToTop()
  }

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(event.target.value)
    setPage(1)
  }

  const handleTypeFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setTypeFilter(event.target.value)
    setPage(1)
  }

  const handleCategoryFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCategoryFilter(event.target.value)
    setPage(1)
  }

  const handleAvailabilityFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setAvailabilityFilter(event.target.value)
    setPage(1)
  }

  const handleClearFilters = () => {
    setPage(1)
    setSortOption('recommended')
    setTypeFilter('all')
    setCategoryFilter('all')
    setAvailabilityFilter('all')
    scrollToTop()
  }

  const handleViewRoom = (roomId: string) => {
    navigate(`/rooms/${roomId}`)
  }

  const handleBookRoom = (roomId: string) => {
    navigate(`/book/${roomId}`)
  }

  const scrollToTop = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-amber-50">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>
      <div className="fixed top-20 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="inline-block py-1 px-3 rounded-full bg-amber-100/50 text-amber-800 text-xs font-bold tracking-widest uppercase mb-4 border border-amber-200 backdrop-blur-sm">
              Accommodations
            </span>
            <h1 className="text-4xl lg:text-6xl font-serif font-bold text-gray-900 mb-6 tracking-tight">
              Select Your Sanctuary
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              Explore our collection of meticulously designed rooms, where luxury meets comfort in every detail.
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Sidebar Filters - Glass Panel */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.1 }}
               className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24 z-20"
            >
              <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl shadow-gray-200/50">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200/50">
                   <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
                      <SlidersHorizontal size={20} />
                   </div>
                   <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
                   {filteredRooms.length !== rooms.length && (
                      <button 
                        onClick={handleClearFilters}
                        className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 underline"
                      >
                        Reset
                      </button>
                   )}
                </div>

                <div className="space-y-6">
                   <FilterSelect
                      value={categoryFilter}
                      onChange={handleCategoryFilterChange}
                      options={categoryFilterOptions}
                      label="Category"
                    />
                    <FilterSelect
                      value={typeFilter}
                      onChange={handleTypeFilterChange}
                      options={typeFilterOptions}
                      label="Room Type"
                    />
                    <FilterSelect
                      value={availabilityFilter}
                      onChange={handleAvailabilityFilterChange}
                      options={availabilityFilterOptions}
                      label="Availability"
                    />
                    
                    <div className="pt-4 border-t border-gray-200/50">
                      <FilterSelect
                        value={sortOption}
                        onChange={handleSortChange}
                        options={[
                          { value: 'recommended', label: 'Recommended' },
                          { value: 'price-asc', label: 'Price: Low to High' },
                          { value: 'price-desc', label: 'Price: High to Low' },
                          { value: 'rating-desc', label: 'Rating: High to Low' },
                        ]}
                        label="Sort Order"
                      />
                    </div>
                </div>

                <div className="mt-8 bg-amber-50/50 rounded-xl p-4 border border-amber-100 text-center">
                    <p className="text-amber-800 text-xs font-medium mb-1">Showing</p>
                    <p className="text-3xl font-bold text-gray-900">{filteredRooms.length}</p>
                    <p className="text-gray-500 text-xs">Rooms Found</p>
                </div>
              </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 w-full">
              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                   <p className="text-red-600 mb-4">{error}</p>
                   <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50">Retry</button>
                </div>
              )}

              {/* Loading State */}
              {isLoading && !error && (
                 <div className="grid gap-6">
                    <LoadingWidget variant="card" count={3} />
                 </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && displayedRooms.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-12 text-center shadow-xl shadow-gray-200/50"
                  >
                     <div className="inline-flex p-4 rounded-full bg-gray-100 mb-6 text-gray-400">
                        <SearchX size={48} />
                     </div>
                     <h3 className="text-2xl font-bold text-gray-900 mb-2">No rooms found</h3>
                     <p className="text-gray-500 mb-8 max-w-md mx-auto">We couldn't find any rooms matching your current filters. Try adjusting your search criteria.</p>
                     <button 
                        onClick={handleClearFilters}
                        className="px-6 py-3 bg-amber-900 text-white rounded-xl font-bold shadow-lg hover:bg-amber-800 transition-colors"
                     >
                        Clear All Filters
                     </button>
                  </motion.div>
              )}

              {/* Room Grid */}
              {!isLoading && !error && displayedRooms.length > 0 && (
                <div className="space-y-8">
                  <AnimatePresence mode="popLayout">
                    {displayedRooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onViewRoom={handleViewRoom}
                        onBookRoom={handleBookRoom}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Pagination */}
              {!isLoading && !error && calculatedTotalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={calculatedTotalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
      </div>
    </div>
  )
}
export default RoomsBrowser
