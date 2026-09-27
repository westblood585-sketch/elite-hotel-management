import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const HeroContent = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8 }
    }
  }

  return (
    <motion.div 
      className="text-center max-w-5xl mx-auto mb-8 lg:mb-12 px-4 pt-16 lg:pt-0"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="mb-3 inline-block">
        <span className="py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs lg:text-sm font-medium tracking-widest uppercase">
          Welcome to Excellence
        </span>
      </motion.div>

      <motion.h1 
        variants={itemVariants}
        className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-white mb-4 lg:mb-6 leading-tight tracking-tight drop-shadow-xl"
      >
        Experience the 
        <span className="block mt-1 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent bg-300% animate-gradient">
          Ultimate Luxury
        </span>
      </motion.h1>

      <motion.p 
        variants={itemVariants}
        className="text-base sm:text-xl text-white/90 mb-8 lg:mb-10 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md"
      >
        Immerse yourself in a world of refined elegance, where every detail is crafted for your absolute comfort. Your sanctuary in the city awaits.
      </motion.p>

      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        <Link to="/rooms">
          <button className="group bg-amber-800 hover:bg-amber-900 text-white min-w-[180px] px-6 py-3 rounded-full font-medium text-base lg:text-lg transition-all duration-300 shadow-[0_0_20px_-5px_rgba(146,64,14,0.5)] hover:shadow-[0_0_25px_-5px_rgba(146,64,14,0.6)] hover:-translate-y-1 flex items-center justify-center gap-2">
             Book Your Stay
             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>
        <Link to="/about">
          <button className="group bg-white/5 hover:bg-white/10 text-white border border-white/30 backdrop-blur-md min-w-[180px] px-6 py-3 rounded-full font-medium text-base lg:text-lg transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2">
            Explore More
             <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
               <ArrowRight className="w-3 h-3 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
             </span>
          </button>
        </Link>
      </motion.div>
    </motion.div>
  )
}

export default HeroContent
