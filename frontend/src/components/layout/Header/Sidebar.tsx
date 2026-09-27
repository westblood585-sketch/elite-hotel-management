// components/Sidebar.tsx
import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
// import { useSelector } from 'react-redux'
// import { RootState } from '../redux/store/store'
import {
  FaHome,
  FaBuilding,
  FaCalendarAlt,
  FaInfoCircle,
  FaEnvelope,
  FaUser,
  FaSignInAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaChevronDown,
  FaTimes,
  FaShieldAlt,
} from 'react-icons/fa'
import type { NavItem, SidebarProps } from '../../../types'

const Sidebar: React.FC<SidebarProps> = ({
  open,
  setOpen,
  isAuthenticated,
  isAdmin = false,
  onLogout,
  userName,
  profilePicture = '/default-avatar.png',
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  // const theme = useSelector((state: RootState) => state.theme.mode)

  // Close sidebar when route changes
  useEffect(() => {
    setOpen(false)
    setDropdownOpen(false)
    setAdminDropdownOpen(false)
  }, [location.pathname, setOpen])

  // Handle escape key to close sidebar and dropdowns
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dropdownOpen) {
          setDropdownOpen(false)
        } else if (adminDropdownOpen) {
          setAdminDropdownOpen(false)
        } else if (open) {
          setOpen(false)
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, dropdownOpen, adminDropdownOpen, setOpen])

  // Handle click outside to close the sidebar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        open &&
        overlayRef.current &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])

  // Apply focus trap when sidebar is open
  useEffect(() => {
    if (!open || !sidebarRef.current) return

    const sidebar = sidebarRef.current
    const focusableElements = sidebar.querySelectorAll(
      'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement

    // Auto-focus the first element when sidebar opens
    setTimeout(() => firstElement.focus(), 100)

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    sidebar.addEventListener('keydown', handleTabKey)
    return () => {
      sidebar.removeEventListener('keydown', handleTabKey)
    }
  }, [open])

  // Prevent scroll on body when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Define navigation items with icons
  const navItems: NavItem[] = [
    { href: '/', label: 'Home', icon: <FaHome size={18} /> },
    {
      href: '/rooms',
      label: 'Browse all rooms',
      icon: <FaBuilding size={18} />,
    },
    {
      href: '/bookings',
      label: 'Find my booking',
      icon: <FaCalendarAlt size={18} />,
    },
    { href: '/about', label: 'About us', icon: <FaInfoCircle size={18} /> },
    { href: '/contact', label: 'Contact', icon: <FaEnvelope size={18} /> },
  ]

  // Define admin navigation items
  // const adminItems: <AdminItem></AdminItem>[] = [
  //   {
  //     href: '/admin/dashboard',
  //     label: 'Dashboard',
  //     icon: <FaChartBar size={16} />,
  //   },
  //   {
  //     href: '/admin/users',
  //     label: 'User Management',
  //     icon: <FaUsers size={16} />,
  //   },
  //   {
  //     href: '/admin/bookings',
  //     label: 'Booking Management',
  //     icon: <FaClipboardList size={16} />,
  //   },
  //   {
  //     href: '/admin/settings',
  //     label: 'System Settings',
  //     icon: <FaCog size={16} />,
  //   },
  // ]

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed top-0 right-0 h-full w-80 shadow-xl z-50 lg:hidden overflow-y-auto flex flex-col
          bg-white transition-all duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-label="Mobile navigation menu"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <Link to="/" onClick={() => setOpen(false)}>
            <span className="font-serif text-2xl font-bold text-primary">
              Elite Hotel
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-gray-500 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
            aria-label="Close menu"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-6 flex-1">
          {isAuthenticated && userName && (
            <div className="mb-6 p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center">
                {/* Profile picture */}
                <div className="mr-3">
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/50"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Welcome back</p>
                  <p className="font-medium text-primary">{userName}</p>
                </div>
              </div>
            </div>
          )}

          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center py-3 px-4 rounded-lg transition-all duration-200
                    ${
                      location.pathname === item.href
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                  {location.pathname === item.href && (
                    <span className="ml-auto w-1.5 h-6 bg-primary rounded-full" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Admin Section - Only visible if isAdmin is true */}
          {isAdmin && (
            <div className="mt-8">
              <h3 className="font-medium text-gray-400 uppercase text-xs tracking-wider px-4 mb-2">
                Admin Area
              </h3>

              <button
                className="w-full flex items-center justify-between py-3 px-4 text-gray-700 font-medium cursor-pointer rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                aria-expanded={adminDropdownOpen}
                aria-controls="admin-dropdown"
              >
                <div className="flex items-center">
                  <FaShieldAlt className="mr-3" size={18} />
                  <span>Administration</span>
                </div>
                <FaChevronDown
                  className={`transform transition-transform duration-200 ${
                    adminDropdownOpen ? 'rotate-180' : ''
                  }`}
                  size={16}
                />
              </button>

              {adminDropdownOpen && (
                <div
                  id="admin-dropdown"
                  className="mt-2 ml-4 pl-4 space-y-1 border-l-2 border-gray-200 animate-fade-in"
                >
                  {/* {adminItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => {
                        setAdminDropdownOpen(false)
                        setOpen(false)
                      }}
                      className={`
                        flex items-center py-2 px-4 rounded-lg transition-colors duration-200
                        ${
                          location.pathname === item.href
                            ? 'text-primary font-medium bg-primary/5'
                            : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))} */}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          {isAuthenticated ? (
            <div>
              <button
                className="w-full flex items-center justify-between py-2 px-4 text-gray-700 font-medium cursor-pointer rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-controls="account-dropdown"
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    {/* Small profile picture in account dropdown button */}
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  </div>
                  <span>Account</span>
                </div>
                <FaChevronDown
                  className={`transform transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                  size={16}
                />
              </button>

              {dropdownOpen && (
                <div
                  id="account-dropdown"
                  className="mt-2 ml-4 pl-4 space-y-1 border-l-2 border-gray-200 animate-fade-in"
                >
                  <Link
                    to="/account/profile"
                    onClick={() => {
                      setDropdownOpen(false)
                      setOpen(false)
                    }}
                    className="flex items-center py-2 px-4 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <FaUser className="mr-2" size={16} />
                    Profile
                  </Link>
                  <button
                    onClick={async () => {
                      setDropdownOpen(false)
                      setOpen(false)
                      await onLogout()
                    }}
                    className="flex items-center py-2 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <FaSignOutAlt className="mr-2" size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                to="/auth/signin"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full py-2 px-4 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <FaSignInAlt className="mr-2" size={18} />
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <FaUserPlus className="mr-2" size={18} />
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Help & Social Links */}
        <div className="p-6 border-t border-gray-200 ">
          <div className="flex justify-between">
            <a
              href="/help"
              className="text-sm text-gray-500 hover:text-primary transition-colors duration-200"
            >
              Help
            </a>
            <a
              href="/terms"
              className="text-sm text-gray-500 hover:text-primary transition-colors duration-200"
            >
              Terms
            </a>
            <a
              href="/privacy"
              className="text-sm text-gray-500 hover:text-primary transition-colors duration-200"
            >
              Privacy
            </a>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <a
              href="#"
              className="text-gray-400 hover:text-primary transition-colors duration-200"
            >
              <span className="sr-only">Facebook</span>
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-primary transition-colors duration-200"
            >
              <span className="sr-only">Instagram</span>
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path>
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-primary transition-colors duration-200"
            >
              <span className="sr-only">Twitter</span>
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.954 4.569a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 9.99 9.99 0 01-3.157 1.203A4.92 4.92 0 0016.835 2c-2.761 0-4.99 2.239-4.99 5 0 .39.033.765.114 1.122-4.156-.21-7.833-2.196-10.3-5.217a4.964 4.964 0 001.543 6.688 4.91 4.91 0 01-2.25-.624v.06c0 2.42 1.719 4.434 3.996 4.892a4.942 4.942 0 01-2.25.084 5.001 5.001 0 004.652 3.472 9.865 9.865 0 01-6.13 2.114c-.376 0-.754-.022-1.125-.066a14.035 14.035 0 007.612 2.213c9.142 0 14.142-7.58 14.142-14.143 0-.214-.005-.428-.015-.64A10.089 10.089 0 0024 4.59l-.046-.02z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
