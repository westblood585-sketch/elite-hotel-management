// components/ui/MobileMenuButton.tsx
import React from 'react'
import type { MobileMenuButtonProps } from '../../../types'

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  scrolled,
  open,
  setOpen,
}) => {
  return (
    <button
      onClick={() => setOpen(!open)}
      className="lg:hidden focus:outline-none z-50 p-2 rounded-md focus:ring-2 focus:ring-primary"
      aria-label="Toggle menu"
      aria-expanded={open}
    >
      <div
        className={`w-6 h-6 flex flex-col justify-around transition-all duration-300 ${
          open ? 'transform rotate-90' : ''
        }`}
      >
        <span
          className={`block w-full h-0.5 transform transition-all duration-300 ${
            open
              ? 'rotate-45 translate-y-1.5 bg-gray-800'
              : `${scrolled ? 'bg-gray-800' : 'bg-white'}`
          }`}
        />
        <span
          className={`block w-full h-0.5 transition-opacity duration-300 ${
            open ? 'opacity-0' : `${scrolled ? 'bg-gray-800' : 'bg-white'}`
          }`}
        />
        <span
          className={`block w-full h-0.5 transform transition-all duration-300 ${
            open
              ? '-rotate-45 -translate-y-1.5 bg-gray-800'
              : `${scrolled ? 'bg-gray-800' : 'bg-white'}`
          }`}
        />
      </div>
    </button>
  )
}

export default MobileMenuButton
