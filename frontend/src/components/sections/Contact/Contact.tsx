import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Send, ArrowRight } from 'lucide-react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    // console.log(formData)
    alert('Thank you for your message! We will get back to you soon.')
    setFormData({ name: '', email: '', message: '' })
    setIsSubmitting(false)
  }

  return (
    <section className="py-12 lg:py-20 bg-white relative overflow-hidden" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 lg:mb-14"
        >
           <div className="flex items-center justify-center gap-4 mb-3">
               <span className="h-[1px] w-12 bg-amber-800/30"></span>
               <span className="text-amber-800 text-xs font-bold tracking-widest uppercase">Contact Us</span>
               <span className="h-[1px] w-12 bg-amber-800/30"></span>
           </div>
           <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">
             Get in Touch
           </h2>
           <p className="mt-2 text-gray-600 max-w-lg mx-auto leading-relaxed">
            Have questions about your stay? Our concierge team is here to assist you 24/7.
           </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[500px]">
            
            {/* Info Panel */}
            <div className="bg-gray-900 text-white p-8 lg:p-12 lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-serif font-bold mb-6">Contact Information</h3>
                <p className="text-gray-300 mb-10 leading-relaxed text-sm">
                  Fill up the form and our team will get back to you within 24 hours.
                </p>

                <div className="space-y-8">
                  <div className="flex items-start space-x-4 group">
                    <div className="bg-white/10 p-3 rounded-xl group-hover:bg-amber-800 transition-colors duration-300">
                      <Phone className="w-5 h-5 text-amber-100" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Phone</p>
                      <p className="text-lg font-medium text-white group-hover:text-amber-100 transition-colors">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group">
                    <div className="bg-white/10 p-3 rounded-xl group-hover:bg-amber-800 transition-colors duration-300">
                      <Mail className="w-5 h-5 text-amber-100" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Email</p>
                      <p className="text-lg font-medium text-white group-hover:text-amber-100 transition-colors">concierge@elitehotel.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group">
                    <div className="bg-white/10 p-3 rounded-xl group-hover:bg-amber-800 transition-colors duration-300">
                      <MapPin className="w-5 h-5 text-amber-100" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Address</p>
                      <p className="text-lg font-medium text-white group-hover:text-amber-100 transition-colors">123 Luxury Ave, Beverly Hills, CA 90210</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social or Decorative Element at bottom */}
              <div className="relative z-10 mt-12 lg:mt-0">
                  <div className="flex gap-4">
                     <div className="h-1 w-12 bg-amber-800 rounded-full"></div>
                     <div className="h-1 w-4 bg-amber-800/50 rounded-full"></div>
                  </div>
              </div>
            </div>

            {/* Form Panel */}
            <div className="p-8 lg:p-12 lg:col-span-3 bg-gray-50/50">
              <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="group">
                    <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2 font-serif group-focus-within:text-amber-800 transition-colors">Your Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-800 focus:ring-1 focus:ring-amber-800 transition-all shadow-sm group-hover:border-gray-300"
                      required
                    />
                  </div>
                  <div className="group">
                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 font-serif group-focus-within:text-amber-800 transition-colors">Your Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-800 focus:ring-1 focus:ring-amber-800 transition-all shadow-sm group-hover:border-gray-300"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2 font-serif group-focus-within:text-amber-800 transition-colors">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="How can we help you?"
                    className="w-full px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-800 focus:ring-1 focus:ring-amber-800 transition-all shadow-sm group-hover:border-gray-300 resize-none"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-4 bg-amber-900 text-white rounded-xl font-bold tracking-wide hover:bg-amber-800 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    {!isSubmitting && <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
