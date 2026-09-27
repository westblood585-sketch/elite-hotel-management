import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'

// TypeScript interfaces
interface Testimonial {
  id: number
  name: string
  position: string
  image: string
  quote: string
  rating: number
  location?: string
  date?: string
}

interface TestimonialsProps {
  autoPlay?: boolean
  autoPlayInterval?: number
  showDots?: boolean
  showNavigation?: boolean
  customTestimonials?: Testimonial[]
}

const defaultTestimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    position: 'Business Traveler',
    image:
      'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400&h=400&fit=crop&crop=face',
    quote:
      'The Elite Hotel exceeded all my expectations. The rooms are spacious and elegant, and the staff went above and beyond to accommodate my needs during my business trip.',
    rating: 5,
    location: 'New York, NY',
    date: 'March 2024',
  },
  {
    id: 2,
    name: 'Michael Chen',
    position: 'Family Vacation',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    quote:
      "We stayed in the family suite and it was perfect! The kids loved the pool, and the breakfast buffet had something for everyone. We'll definitely be coming back.",
    rating: 5,
    location: 'Los Angeles, CA',
    date: 'February 2024',
  },
  {
    id: 3,
    name: 'Emma Davis',
    position: 'Honeymoon Stay',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    quote:
      'Our honeymoon at Elite Hotel was absolutely magical. The beach view suite was stunning, and the special touches like champagne made our stay unforgettable.',
    rating: 5,
    location: 'Miami Beach, FL',
    date: 'January 2024',
  },
  {
    id: 4,
    name: 'James Wilson',
    position: 'Corporate Event',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    quote:
      'We hosted our annual company retreat here and everything was flawless. The meeting facilities are state-of-the-art, and the catering was exceptional.',
    rating: 5,
    location: 'Chicago, IL',
    date: 'December 2023',
  },
  {
    id: 5,
    name: 'Lisa Rodriguez',
    position: 'Anniversary Celebration',
    image:
      'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face',
    quote:
      'Celebrating our 25th anniversary here was the perfect choice. The spa treatments were divine, and the attention to detail made us feel like royalty.',
    rating: 5,
    location: 'San Francisco, CA',
    date: 'November 2023',
  },
]

const Testimonials: React.FC<TestimonialsProps> = ({
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showNavigation = true,
  customTestimonials,
}) => {
  const testimonials = customTestimonials || defaultTestimonials
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Use a ref to clear/reset interval to prevent race conditions or rapid stacking
  useEffect(() => {
    if (!autoPlay) return

    const timer = setInterval(() => {
      setDirection(1)
      setActiveIndex((current) => (current + 1) % testimonials.length)
    }, autoPlayInterval)

    return () => clearInterval(timer)
  }, [autoPlay, autoPlayInterval, testimonials.length, activeIndex]) // Added activeIndex to reset timer on manual change

  const navigate = useCallback((dir: number) => {
    setDirection(dir)
    setActiveIndex((current) => {
      let next = current + dir
      if (next < 0) next = testimonials.length - 1
      if (next >= testimonials.length) next = 0
      return next
    })
  }, [testimonials.length])

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  }

  const activeTestimonial = testimonials[activeIndex]

  return (
    <section className="py-12 lg:py-20 bg-gray-50/30 overflow-hidden relative">
      {/* Subtle Background Decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-amber-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10 lg:mb-14">
           <div className="flex items-center justify-center gap-4 mb-3">
               <span className="h-[1px] w-12 bg-amber-800/30"></span>
               <span className="text-amber-800 text-xs font-bold tracking-widest uppercase">Guest Stories</span>
               <span className="h-[1px] w-12 bg-amber-800/30"></span>
           </div>
           <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900">
             What Our Guests Say
           </h2>
        </div>

        {/* Carousel Content */}
        <div className="relative max-w-5xl mx-auto min-h-[400px] flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="w-full"
              >
                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-8 md:gap-12 mx-4">
                  
                  {/* Image Side */}
                  <div className="flex-shrink-0 relative group">
                    <div className="w-24 h-24 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-amber-50 shadow-inner">
                      <img 
                        src={activeTestimonial.image} 
                        alt={activeTestimonial.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeTestimonial.name)}&background=fdf8f6&color=92400e`
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-3 -right-3 bg-white p-2 rounded-full shadow-md text-amber-500">
                      <Quote size={20} fill="currentColor" />
                    </div>
                  </div>

                  {/* Text Side */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex justify-center md:justify-start gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={18} 
                          className={i < activeTestimonial.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} 
                        />
                      ))}
                    </div>
                    
                    <blockquote className="text-xl md:text-2xl font-serif text-gray-800 leading-relaxed mb-6">
                      "{activeTestimonial.quote}"
                    </blockquote>
                    
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{activeTestimonial.name}</h4>
                      <p className="text-amber-800 text-sm font-medium mb-1">{activeTestimonial.position}</p>
                      {activeTestimonial.location && (
                        <div className="flex items-center justify-center md:justify-start gap-1 text-gray-400 text-xs">
                           <MapPin size={12} />
                           <span>{activeTestimonial.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons on desktop */}
            {showNavigation && (
              <>
                <button 
                  onClick={() => navigate(-1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 p-3 rounded-full bg-white shadow-lg text-gray-400 hover:text-amber-800 hover:scale-110 transition-all duration-300 z-20 hidden md:block"
                  aria-label="Previous"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => navigate(1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 p-3 rounded-full bg-white shadow-lg text-gray-400 hover:text-amber-800 hover:scale-110 transition-all duration-300 z-20 hidden md:block"
                  aria-label="Next"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
        </div>

        {/* Indicators */}
        {showDots && (
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > activeIndex ? 1 : -1)
                  setActiveIndex(index)
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'w-8 bg-amber-800' : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  )
}

export default Testimonials
