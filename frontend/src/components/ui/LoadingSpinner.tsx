// components/ui/LoadingSpinner.tsx
import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div
      className={`flex items-center justify-center min-h-screen ${className}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={`
            ${sizeClasses[size]} border-4 border-gray-200 
            border-t-primary rounded-full animate-spin
          `}
        />
        <p className="text-gray-600 text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
