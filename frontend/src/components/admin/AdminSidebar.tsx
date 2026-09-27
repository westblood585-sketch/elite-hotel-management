import { NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/redux/store/store'
import { logout } from '@/redux/slices/authSlice'
import {
  LayoutDashboard,
  Users,
  DoorClosed,
  CalendarCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  DollarSign,
  MessageSquare,
  Sparkles,
  CreditCard,
  LogOut,
  Shield,
  Hotel
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'receptionist', 'housekeeper'] },
  { to: '/admin/users', icon: Users, label: 'Users', roles: ['admin'] },
  { to: '/admin/guests', icon: UserCheck, label: 'Guests', roles: ['admin', 'receptionist'] },
  { to: '/admin/rooms', icon: DoorClosed, label: 'Rooms', roles: ['admin', 'receptionist', 'housekeeper'] },
  { to: '/admin/reservations', icon: CalendarCheck, label: 'Reservations', roles: ['admin', 'receptionist'] },
  { to: '/admin/billing', icon: DollarSign, label: 'Billing', roles: ['admin', 'receptionist'] },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments', roles: ['admin', 'receptionist'] },
  { to: '/admin/housekeeping', icon: Sparkles, label: 'Housekeeping', roles: ['admin', 'housekeeper', 'receptionist'] },
  { to: '/admin/communications', icon: MessageSquare, label: 'Communications', roles: ['admin', 'receptionist'] },
  { to: '/admin/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
]

const AdminSidebar = ({ isOpen, onToggle }: AdminSidebarProps) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const userRole = user?.role?.toLowerCase() || 'admin'
  
  const handleLogout = (e: React.MouseEvent) => {
      e.preventDefault() // Prevent navigation if inside link (though button is absolute/z-index)
      dispatch(logout())
      navigate('/auth/signin')
  }
  
  // Determine the base path prefix (e.g., /admin or /receptionist)
  const prefix = userRole === 'receptionist' ? '/receptionist' : '/admin'

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole))

  return (
    <aside
      className={cn(
        'relative bg-[#0f172a] text-white transition-all duration-300 ease-in-out z-50 flex flex-col border-r border-white/5 shadow-2xl backdrop-blur-xl',
        isOpen ? 'w-72' : 'w-24'
      )}
    >
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/5 blur-3xl rounded-full mix-blend-screen -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-full h-96 bg-indigo-600/5 blur-3xl rounded-full mix-blend-screen translate-y-1/2"></div>
        </div>

      {/* Header / Logo */}
      <div className={cn(
          "h-24 flex items-center justify-between px-6 border-b border-white/5 relative z-10",
          !isOpen && "justify-center px-0"
      )}>
        {isOpen ? (
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                    <Hotel size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70 tracking-tight">
                        Elite Hotel
                    </h1>
                    <span className="text-xs font-medium text-indigo-400 tracking-wider uppercase">Admin Panel</span>
                </div>
            </div>
        ) : (
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <Hotel size={24} className="text-white" />
            </div>
        )}
        
        {isOpen && (
            <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Toggle sidebar"
            >
            <ChevronLeft size={18} />
            </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
        <ul className="space-y-2">
            {!isOpen && (
                <li className="mb-6 flex justify-center">
                    <button
                        onClick={onToggle}
                        className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    >
                         <ChevronRight size={20} />
                    </button>
                </li>
            )}
            {filteredNavItems.map((item) => {
            const linkPath = item.to.replace('/admin', prefix)
            
            return (
                <li key={item.to}>
                    <NavLink
                        to={linkPath}
                        className={({ isActive }) =>
                        cn(
                            'group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden',
                            !isOpen && 'justify-center px-0 py-4',
                            isActive 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/10' 
                                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                        )
                        }
                    >
                        {({ isActive }) => (
                        <>
                            {/* Active Shine Effect */}
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                            )}

                            <div className={cn(
                                "relative z-10 transition-transform duration-300 group-hover:scale-110",
                                isActive ? "text-white" : "text-slate-500 group-hover:text-white"
                            )}>
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            
                            {isOpen && (
                                <span className={cn(
                                    "font-medium relative z-10",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                )}>
                                    {item.label}
                                </span>
                            )}
                            
                            {/* Active Indicator Dot */}
                            {isActive && isOpen && (
                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                            )}
                        </>
                        )}
                    </NavLink>
                </li>
            )
            })}
        </ul>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-white/5 bg-[#0b1120]/50 backdrop-blur-md relative z-10">
        <NavLink 
            to={`${prefix}/profile`}
            className={({ isActive }) => cn(
                 "flex items-center gap-3 p-3 rounded-2xl border border-white/5 transition-all text-left",
                 !isOpen && "justify-center p-2 bg-transparent border-0",
                 isActive ? "bg-white/10 border-white/10" : "bg-white/[0.02] hover:bg-white/[0.05]"
            )}
        >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-inner ring-2 ring-white/10 overflow-hidden">
                {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
                ) : (
                    <span className="font-bold text-white text-sm">
                        {user?.fullName?.[0]?.toUpperCase() || 'A'}
                    </span>
                )}
            </div>
            
            {isOpen && (
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user?.fullName || 'Admin User'}</p>
                    <p className="text-xs text-indigo-400 font-medium truncate capitalize">{userRole}</p>
                </div>
            )}
        </NavLink>
        
        {isOpen && (
             <button
                onClick={handleLogout}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 cursor-pointer transition-colors z-20"
             >
                <LogOut size={16} />
             </button>
        )}
      </div>
    </aside>
  )
}

export default AdminSidebar
