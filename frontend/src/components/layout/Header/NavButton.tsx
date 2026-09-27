// components/ui/NavButton.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import type { NavButtonProps } from '../../../types'

const NavButton: React.FC<NavButtonProps> = ({
  href,
  children,
  scrolled,
  onClick,
}) => {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`
        relative group font-medium transition-colors duration-300
        ${
          scrolled
            ? 'text-gray-800 hover:text-amber-800'
            : 'text-white/90 hover:text-white'
        }
      `}
    >
      {children}
      <span className={`
        absolute -bottom-1 left-0 w-0 h-0.5 bg-current transition-all duration-300 ease-in-out group-hover:w-full
        ${scrolled ? 'bg-amber-800' : 'bg-white'}
      `} />
    </Link>
  )
}

export default NavButton
