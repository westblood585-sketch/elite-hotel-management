import { motion } from 'framer-motion'
import { Star, Coffee, MapPin, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  }

  const features = [
    {
      icon: <Star className="w-5 h-5 text-amber-600" />,
      title: '5-Star Service',
      description: 'Award-winning hospitality standards',
    },
    {
      icon: <Coffee className="w-5 h-5 text-amber-600" />,
      title: 'Premium Amenities',
      description: 'Wellness spa & fine dining',
    },
    {
      icon: <MapPin className="w-5 h-5 text-amber-600" />,
      title: 'Prime Location',
      description: 'Heart of the city center',
    },
    {
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      title: '24/7 Concierge',
      description: 'Always at your service',
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
            className="order-2 lg:order-1"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
              <span className="h-[1px] w-12 bg-amber-600/60"></span>
              <span className="text-amber-800 text-sm font-bold tracking-widest uppercase">
                Our Story
              </span>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-4xl lg:text-6xl font-serif font-bold text-gray-900 mb-8 leading-tight">
              Luxury Redefined for the <br />
              <span className="bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                Modern Traveler
              </span>
            </motion.h2>

            <motion.p variants={itemVariants} className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
              At Elite Hotel, we believe that every guest deserves an extraordinary
              experience. Our commitment to excellence shines through in every
              detail, from our elegantly appointed rooms to our personalized
              service that anticipates your every need.
            </motion.p>

            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-10">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 group">
                  <div className="p-2 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-gray-500">{feature.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link to="/about">
                <button className="group text-amber-800 font-medium inline-flex items-center gap-2 border-b-2 border-amber-800/20 hover:border-amber-800 transition-all duration-300 pb-1">
                  Read Our Full Story
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Image Collage */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative order-1 lg:order-2 h-[600px] w-full hidden lg:block"
          >
            {/* Main Image */}
            <div className="absolute top-0 right-0 w-4/5 h-4/5 rounded-2xl overflow-hidden shadow-2xl z-10">
              <img
                src="/images/Hero2.avif"
                alt="Hotel Lobby"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating Secondary Image */}
            <motion.div 
              className="absolute bottom-0 left-0 w-3/5 h-3/5 rounded-2xl overflow-hidden shadow-2xl z-20 border-8 border-white"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ willChange: 'transform', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
            >
              <img
                src="/images/Hero3.avif"
                alt="Luxury Pool"
                className="w-full h-full object-cover"
                style={{ backfaceVisibility: 'hidden' }}
              />
            </motion.div>

            {/* Decorative Element */}
            <div className="absolute top-10 left-10 w-24 h-24 bg-amber-100/50 rounded-full blur-2xl z-0" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-amber-600/10 rounded-full blur-3xl z-0" />
          </motion.div>
          
          {/* Mobile Image (Simple) */}
           <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative order-1 lg:hidden rounded-2xl overflow-hidden shadow-xl"
          >
             <img
                src="/images/Hero2.avif"
                alt="Hotel Lobby"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-6">
                 <p className="text-white/90 font-serif italic text-lg">"Where luxury meets comfort"</p>
              </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default About
