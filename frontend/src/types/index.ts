// types/index.ts
export type UserRole = 'receptionist' | 'housekeeper'

export interface SignUpSchemaType {
  fullName: string
  email: string
  password: string
  phoneNumber: string
  role: UserRole
}

export interface AuthProviderProps {
  provider: 'google' | 'email'
  userData?: SignUpSchemaType
}

export interface User {
  id: string
  fullName: string
  email: string
  profileImage?: string
  role?: 'receptionist' | 'housekeeper'
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface RootState {
  auth: AuthState
}

export interface HeaderProps {
  user?: User | null
  isAuthenticated?: boolean
  onLogout?: () => Promise<void>
}

export interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  isAuthenticated: boolean
  isAdmin?: boolean
  onLogout: () => Promise<void>
  userName?: string
  profilePicture?: string
}

export interface NavButtonProps {
  href: string
  children: React.ReactNode
  scrolled: boolean
  onClick?: () => void
}

export interface MobileMenuButtonProps {
  open: boolean
  setOpen: (open: boolean) => void
  scrolled: boolean
}

export interface ThemeToggleProps {
  className?: string
}

export interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}
