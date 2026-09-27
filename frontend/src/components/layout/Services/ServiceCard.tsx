// Type definition for ServiceCard component props
import type { ReactNode } from 'react'

interface ServiceCardProps {
  icon: ReactNode
  title: string
  description: string
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-amber-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
        <div className="text-amber-800 scale-90">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-serif font-bold text-gray-900 mb-2 group-hover:text-amber-800 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 text-xs leading-relaxed">
        {description}
      </p>
    </div>
  )
}

export default ServiceCard
