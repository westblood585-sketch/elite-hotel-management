// pages/NotFound/NotFound.tsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-9xl font-bold text-gray-200 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center animate-bounce">
                <Search className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 text-lg mb-2">
            The page you're looking for doesn't exist.
          </p>
          <p className="text-gray-500 text-sm">
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>

          <button
            onClick={handleGoBack}
            className="w-full inline-flex items-center justify-center px-6 py-3 border-[1px] border-primary/70 cursor-pointer bg-white text-primary font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link
              to="/rooms"
              className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition-colors duration-200"
            >
              Our Rooms
            </Link>
            <Link
              to="/about"
              className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition-colors duration-200"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition-colors duration-200"
            >
              Contact
            </Link>
            <Link
              to="/bookings"
              className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition-colors duration-200"
            >
              Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
