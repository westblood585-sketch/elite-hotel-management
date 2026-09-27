import React from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { LogOut, User, ClipboardList, Menu, X } from 'lucide-react'
import { logout } from '@/redux/slices/authSlice'
import type { RootState } from '@/redux/store/store'
import { Button } from '@/components/ui/button'

const HousekeeperLayout: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state: RootState) => state.auth)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/auth/signin')
  }

  const navItems = [
    { label: 'My Tasks', path: '/housekeeper/dashboard', icon: ClipboardList },
    { label: 'Profile', path: '/housekeeper/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#0f172a] text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-900/20">
              EH
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Elite Hotel</h1>
              <span className="text-xs text-blue-400 font-medium tracking-wide uppercase">Housekeeping</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon size={18} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
            <div className="h-6 w-px bg-slate-700 mx-2" />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-300">{user?.fullName}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-full"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg active:bg-slate-800"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#0f172a] pt-20 px-4 animate-in slide-in-from-top-10 duration-200">
           <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <item.icon size={24} />
                <span className="font-medium text-lg">{item.label}</span>
              </Link>
            ))}
            <hr className="border-slate-800 my-4" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-6 py-4 rounded-xl text-red-400 hover:bg-red-950/30 transition-all w-full text-left"
            >
              <LogOut size={24} />
              <span className="font-medium text-lg">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <Outlet />
      </main>
    </div>
  )
}

export default HousekeeperLayout
