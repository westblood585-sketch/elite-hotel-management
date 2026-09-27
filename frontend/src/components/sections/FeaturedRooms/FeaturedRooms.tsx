import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublicRooms } from '@/services/publicApi'
import { motion } from 'framer-motion'
import { Users, Maximize, ArrowRight } from 'lucide-react'

interface Room {
  _id: string
  name: string
  type: string
  price: number
  images?: { url: string }[]
  image?: { url: string }
  description?: string
  capacity?: number
  size?: string | number
  amenities?: string[]
}

const MOCK_ROOMS: Room[] = [
  {
    _id: '1',
    name: 'Ocean View Family Suite',
    type: 'Premium',
    price: 249,
    images: [{ url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop' }],
    description: 'Spacious family suite with breathtaking ocean views, perfect for families seeking luxury and comfort.',
    amenities: ['Free WiFi', 'Ocean View', 'Breakfast', 'Family Friendly'],
    size: '60m²',
    capacity: 5
  },
  {
    _id: '2',
    name: 'Deluxe Garden Suite',
    type: 'Deluxe',
    price: 189,
    images: [{ url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop' }],
    description: 'Elegant room with private garden access and premium furnishings.',
    amenities: ['Free WiFi', 'Garden View', 'Breakfast', 'Premium Bedding'],
    size: '35m²',
    capacity: 2
  },
  {
    _id: '3',
    name: 'Executive Business Suite',
    type: 'Premium',
    price: 299,
    images: [{ url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop' }],
    description: 'Our finest accommodation with panoramic city views and exclusive amenities.',
    amenities: ['Free WiFi', 'City View', 'Breakfast', 'Butler Service'],
    size: '65m²',
    capacity: 3
  },
  {
    _id: '4',
    name: 'Cozy Single Retreat',
    type: 'Standard',
    price: 129,
    images: [{ url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop' }],
    description: 'Intimate single room designed for solo travelers who appreciate comfort.',
    amenities: ['Free WiFi', 'TV', 'Breakfast', 'Work Desk'],
    size: '25m²',
    capacity: 1
  }
]

const FeaturedRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFeaturedRooms = async () => {
      try {
        setIsLoading(true)
        // Try to fetch Premium rooms first
        const response = await fetchPublicRooms({
          type: 'Premium',
          available: true,
          limit: 4
        })

        let featuredData = response.data
        
        // If not enough premium rooms or API fails, use mock data
        if (!featuredData || featuredData.length === 0) {
          featuredData = MOCK_ROOMS
        } else if (featuredData.length < 3) {
           const fallbackResponse = await fetchPublicRooms({
             available: true,
             limit: 4
           })
           // Combine and deduplicate based on _id
           const combined = [...featuredData, ...(fallbackResponse.data || [])]
           const uniqueRooms = Array.from(new Map(combined.map(room => [room._id, room])).values())
           featuredData = uniqueRooms.slice(0, 4)
        }

        setRooms(featuredData)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load featured rooms, using mock data', error)
        setRooms(MOCK_ROOMS)
        setIsLoading(false)
      }
    }

    loadFeaturedRooms()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  if (isLoading) {
    return (
      <section className="py-20 lg:py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="h-8 w-64 bg-gray-200 mx-auto rounded mb-4 animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 mx-auto rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl overflow-hidden shadow-sm h-[400px] animate-pulse">
                <div className="h-64 bg-gray-200 w-full"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!Array.isArray(rooms) || rooms.length === 0) {
    return (
      <section className="py-12 lg:py-20 bg-gray-50/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-lg">No rooms available at the moment.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 lg:py-20 bg-gray-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 lg:mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
             <span className="h-[1px] w-12 bg-amber-800/30"></span>
             <span className="text-amber-800 text-xs font-bold tracking-widest uppercase">Accommodations</span>
             <span className="h-[1px] w-12 bg-amber-800/30"></span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-6">
            Featured Rooms & Suites
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-lg font-light leading-relaxed">
            Experience luxury and comfort in our hand-picked selection of premium rooms, designed for your ultimate relaxation.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
        >
          {rooms.map((room) => (
            <motion.div
              key={room._id}
              variants={cardVariants}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col h-full relative"
            >
               {/* Image Container */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={room.images?.[0]?.url || room.image?.url || '/placeholder-room.jpg'}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'
                  }}
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                {/* Price Tag */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                   <div className="flex items-baseline gap-1">
                      <span className="text-amber-800 font-bold text-base">${room.price}</span>
                      <span className="text-gray-500 text-[10px] font-medium">/ night</span>
                   </div>
                </div>

                 {/* Type Badge */}
                 <div className="absolute top-4 left-4">
                     <span className="bg-amber-900/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border border-white/10">
                        {room.type}
                     </span>
                 </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1 border-x border-b border-gray-100 rounded-b-2xl">
                <div className="mb-3">
                  <h3 className="text-lg font-serif font-bold text-gray-900 mb-1 group-hover:text-amber-800 transition-colors">
                    {room.name}
                  </h3>
                   <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                     {room.description || 'Experience the epitome of luxury and comfort in this beautifully appointed room.'}
                   </p>
                </div>

                <div className="mt-auto space-y-4">
                   {/* Features */}
                   <div className="flex items-center justify-between py-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 group-hover:text-amber-700 transition-colors" title="Capacity">
                         <Users className="w-3.5 h-3.5" />
                         <span className="text-xs font-medium">{room.capacity || 2} Guests</span>
                      </div>
                      <div className="w-[1px] h-3 bg-gray-200"></div>
                      <div className="flex items-center gap-2 text-gray-500 group-hover:text-amber-700 transition-colors" title="Room Size">
                         <Maximize className="w-3.5 h-3.5" />
                         <span className="text-xs font-medium">{room.size || '35m²'}</span>
                      </div>
                   </div>

                   {/* CTA Button */}
                   <Link to={`/rooms/${room._id}`} className="block">
                      <button className="w-full py-2.5 rounded-lg border border-amber-900/10 bg-amber-50/50 text-amber-900 text-sm font-semibold hover:bg-amber-800 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                         View Details
                         <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                   </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-10">
          <Link to="/rooms">
             <button className="inline-flex items-center gap-2 text-gray-500 hover:text-amber-800 font-medium transition-colors duration-300 border-b border-transparent hover:border-amber-800 pb-0.5 text-sm">
                View All Accommodations
                <ArrowRight className="w-3.5 h-3.5" />
             </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FeaturedRooms
