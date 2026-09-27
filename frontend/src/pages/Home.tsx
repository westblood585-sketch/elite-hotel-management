// pages/Home.tsx (Updated to work with Outlet context)
import React from 'react'
import { useMainLayoutContext } from '../Hooks/useMainLayoutContext'
import Hero from '../components/sections/Hero/Hero'
import About from '../components/sections/About/About'
import Services from '../components/sections/Services/Services'
import Contact from '../components/sections/Contact/Contact'
import FeaturedRoomsCarousel from '../components/sections/FeaturedRooms/FeaturedRooms'
import Testimonials from '../components/sections/Testimonials/Testimonials'

const Home: React.FC = () => {
  const { addToRefs } = useMainLayoutContext()

  return (
    <>
      {/* Hero Section - Always full screen */}
      <div
        ref={addToRefs}
        className="h-screen relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      >
        <Hero />
      </div>

      {/* About Section - Responsive height */}
      <div
        ref={addToRefs}
        className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="w-full max-w-7xl">
          <About />
        </div>
      </div>

      {/* FeaturedRooms Section - Responsive height */}
      <div
        ref={addToRefs}
        className="w-full bg-gray-50/50"
      >
        <FeaturedRoomsCarousel />
      </div>

      {/* Services Section - Responsive height */}
      <div
        ref={addToRefs}
        className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="w-full max-w-7xl">
          <Services />
        </div>
      </div>

      {/* Testimonials Section - Responsive height */}
      <div ref={addToRefs} className="min-h-screen flex items-center justify-center">
        <Testimonials />
      </div>

      {/* Contact Section - Responsive height */}
      <div
        ref={addToRefs}
        className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="w-full max-w-7xl">
          <Contact />
        </div>
      </div>
    </>
  )
}

export default Home
