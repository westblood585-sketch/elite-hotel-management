import React from 'react'
import ServiceCard from '../../layout/Services/ServiceCard'
import { motion } from 'framer-motion'
import { BedDouble, Utensils, Sparkles, Calendar, Bell, Dumbbell } from 'lucide-react'

interface Service {
  icon: React.ReactNode
  title: string
  description: string
}

const Services: React.FC = () => {
  const services: Service[] = [
    {
      icon: <BedDouble className="w-8 h-8" />,
      title: 'Luxury Accommodations',
      description: 'Spacious and elegantly designed rooms with modern amenities and stunning city views.',
    },
    {
      icon: <Utensils className="w-8 h-8" />,
      title: 'Fine Dining',
      description: 'Award-winning restaurants serving exquisite cuisine from around the world.',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Spa & Wellness',
      description: 'Rejuvenate your body and mind with our world-class spa and wellness facilities.',
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Event Planning',
      description: 'Professional event coordination for weddings, conferences, and special celebrations.',
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: 'Concierge Services',
      description: '24/7 personalized assistance for reservations, tours, and local recommendations.',
    },
    {
      icon: <Dumbbell className="w-8 h-8" />,
      title: 'Fitness Center',
      description: 'State-of-the-art gym equipment and fitness classes with professional trainers.',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  return (
    <section className="py-12 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mb-10 lg:mb-14"
        >
           <div className="flex items-center justify-center gap-4 mb-4">
               <span className="h-[1px] w-12 bg-amber-800/30"></span>
               <span className="text-amber-800 text-xs font-bold tracking-widest uppercase">Our Offerings</span>
               <span className="h-[1px] w-12 bg-amber-800/30"></span>
           </div>
           <h2 className="text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-6">
             Experience World-Class Services
           </h2>
           <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-lg font-light leading-relaxed">
             We go above and beyond to ensure your stay is remarkably comfortable and memorable.
           </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={itemVariants} className="h-full">
              <ServiceCard
                icon={service.icon}
                title={service.title}
                description={service.description}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Services
