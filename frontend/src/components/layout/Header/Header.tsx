import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../../redux/store/store'
import { logout } from '../../../redux/slices/authSlice'
import MobileMenuButton from './MobileMenuButton'
import Sidebar from './Sidebar'
import NavButton from './NavButton'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { Mic } from 'lucide-react'
import { useVoiceAssistant } from '../../../contexts/VoiceAssistantContext'

const Header: React.FC = () => {
  const dispatch = useDispatch()
  const { isListening, toggleListening } = useVoiceAssistant()


  const location = useLocation()
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  )
  
  console.log("Header User Data:", user)

  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Check if current route is home page
  const isHomePage = location.pathname === '/'

  // Determine if header should be in scrolled state
  const isScrolledState = !isHomePage || scrolled

  // Check if user is admin
  const isAdmin = user?.role === 'admin'

  // Optimize scroll handler with useCallback
  const handleScroll = useCallback(() => {
    // Only update scroll state on home page
    if (isHomePage) {
      setScrolled(window.scrollY > 10)
    }
  }, [isHomePage])

  const logoutUser = async () => {
    try {
      // Clear any stored tokens
      localStorage.removeItem('token')
      dispatch(logout())
      setDropdownOpen(false)
      // Show success message if you have a toast system
      console.log('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (dropdownOpen && !target.closest('.account-dropdown')) {
        setDropdownOpen(false)
      }
    }

    // Add scroll event listener only on home page
    if (isHomePage) {
      window.addEventListener('scroll', handleScroll)
    }

    // Add click outside listener
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as EventListener)

    // Cleanup function
    return () => {
      if (isHomePage) {
        window.removeEventListener('scroll', handleScroll)
      }
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener(
        'touchstart',
        handleClickOutside as EventListener
      )
    }
  }, [dropdownOpen, handleScroll, isHomePage])

  // Reset scroll state when route changes
  useEffect(() => {
    if (!isHomePage) {
      setScrolled(false)
    }
  }, [isHomePage])

  return (
    <header
      className={`
        fixed top-0 w-full z-50 transition-all duration-500 ease-in-out
        ${isScrolledState 
          ? 'bg-white/80 backdrop-blur-md shadow-lg py-3 border-b border-white/20 supports-[backdrop-filter]:bg-white/60' 
          : 'bg-gradient-to-b from-black/50 to-transparent py-5'
        }
      `}
    >
      <div className="container mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className={`p-2 rounded-lg transition-colors duration-300 ${isScrolledState ? 'bg-amber-800 text-white' : 'bg-white/10 text-white backdrop-blur-sm'}`}>
             <span className="font-serif text-2xl font-bold">E</span>
          </div>
          <div className="flex flex-col">
            <span
              className={`
                font-serif text-xl font-bold tracking-wide transition-colors duration-300 uppercase
                ${isScrolledState ? 'text-gray-900' : 'text-white'}
              `}
            >
              Elite
            </span>
            <span
              className={`
                text-[0.65rem] font-medium tracking-[0.2em] transition-colors duration-300 uppercase
                ${isScrolledState ? 'text-amber-800' : 'text-white/80'}
              `}
            >
              Hotel & Resort
            </span>
          </div>
        </Link>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <MobileMenuButton
            open={open}
            scrolled={isScrolledState}
            setOpen={setOpen}
          />
        </div>

        {/* Sidebar Overlay */}
        {open && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar
          open={open}
          setOpen={setOpen}
          isAuthenticated={isAuthenticated}
          onLogout={logoutUser}
          isAdmin={isAdmin}
          userName={user?.fullName}
          profilePicture={user?.avatar?.url || user?.profileImage || '/default-avatar.png'}
        />

        {/* Desktop Menu */}
        <nav className="hidden lg:flex gap-8 items-center">
          <NavButton href="/rooms" scrolled={isScrolledState}>
            Rooms & Suites
          </NavButton>



          {user?.role && ['admin', 'receptionist', 'housekeeper'].includes(user.role) && (
            <NavButton 
              href={
                user.role === 'admin' ? '/admin/dashboard' : 
                user.role === 'receptionist' ? '/receptionist/dashboard' :
                user.role === 'housekeeper' ? '/housekeeper/dashboard' : '/'
              } 
              scrolled={isScrolledState}
            >
              Dashboard
            </NavButton>
          )}

          <NavButton href={isAuthenticated ? "/bookings" : "/find-booking"} scrolled={isScrolledState}>
            {isAuthenticated ? "My Bookings" : "Find Booking"}
          </NavButton>

          {isAuthenticated ? (
            <div className="flex items-center gap-6 pl-6 border-l border-gray-200/20">
               {/* Voice Assistant Toggle */}
               <button
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' 
                      : isScrolledState ? 'text-gray-600 hover:bg-gray-100' : 'text-white/90 hover:bg-white/10'
                  }`}
                  title={isListening ? "Voice Assistant Active (Listening...)" : "Enable Voice Assistant"}
               >
                  <Mic size={20} />
               </button>

              {/* Notification Bell */}
              <div className={`transition-colors duration-300 ${isScrolledState ? "text-gray-600 hover:text-amber-800" : "text-white/90 hover:text-white"}`}>
                <NotificationBell />
              </div>

              <div className="relative account-dropdown">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`
                  font-medium transition-all duration-300 flex items-center gap-3 group
                  ${
                    isScrolledState
                      ? 'text-gray-800 hover:text-amber-800'
                      : 'text-white hover:text-white/80'
                  }
                `}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="flex items-center gap-3">
                  <div className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition-colors duration-300 ${isScrolledState ? 'border-amber-800/20 group-hover:border-amber-800' : 'border-white/30 group-hover:border-white'}`}>
                    <img
                      src={user?.avatar?.url || user?.profileImage || '/default-avatar.png'}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-semibold tracking-wide">{user?.fullName?.split(' ')[0] || 'Guest'}</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transform transition-transform duration-300 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-4 w-56 rounded-xl shadow-2xl py-2 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100 mb-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to={
                      user?.role === 'receptionist' ? '/receptionist/profile' :
                      ['admin', 'housekeeper'].includes(user?.role || '') ? '/admin/profile' :
                      '/account/profile'
                    }
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    My Profile
                  </Link>
                   <Link
                    to="/bookings"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    My Bookings
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    onClick={logoutUser}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 pl-6 border-l border-gray-200/20">
              <Link
                to="/auth/signin"
                className={`
                  px-6 py-2.5 rounded-full font-medium transition-all duration-300
                  ${
                    isScrolledState
                      ? 'text-gray-700 hover:text-amber-800 hover:bg-gray-50'
                      : 'text-white hover:bg-white/10'
                  }
                `}
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className={`
                  px-6 py-2.5 rounded-full font-medium transition-all duration-300 shadow-lg transform hover:-translate-y-0.5
                  ${
                    isScrolledState
                       ? 'bg-amber-800 text-white hover:bg-amber-900 hover:shadow-amber-900/20'
                       : 'bg-white text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
