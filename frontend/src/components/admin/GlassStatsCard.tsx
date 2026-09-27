import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface GlassStatsCardProps {
  title: string
  value: string
  change?: string
  isPositive?: boolean
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange' | 'amber' | 'rose'
  subtext?: string
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/20',
    gradient: 'from-blue-600 to-blue-400'
  },
  green: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/20',
    gradient: 'from-emerald-600 to-emerald-400'
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/20',
    gradient: 'from-purple-600 to-purple-400'
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    border: 'border-orange-500/20',
    iconBg: 'bg-orange-500/20',
    gradient: 'from-orange-600 to-orange-400'
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20',
    gradient: 'from-amber-600 to-amber-400'
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600',
    border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/20',
    gradient: 'from-rose-600 to-rose-400'
  }
}

const GlassStatsCard = ({ title, value, change, isPositive, icon: Icon, color, subtext }: GlassStatsCardProps) => {
  const styles = colorStyles[color]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300",
        "bg-white/40 shadow-lg hover:shadow-xl",
        styles.border
      )}
    >
      {/* Decorative Gradient Blob */}
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl", styles.bg.replace('/10', '/30'))} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
          
          {subtext && (
             <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>
          )}

          {change && (
            <div className="mt-2 flex items-center gap-1">
               <span 
                 className={cn(
                   "flex items-center text-xs font-bold px-2 py-0.5 rounded-full",
                   isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                 )}
               >
                 {isPositive ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                 {change}
               </span>
               <span className="text-xs text-gray-400 font-medium">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={cn("rounded-xl p-3 shadow-sm text-white bg-gradient-to-br", styles.gradient)}>
          <Icon size={24} strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  )
}

export default GlassStatsCard
