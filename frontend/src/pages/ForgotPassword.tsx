import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setSignupData } from '@/redux/slices/signupSlice'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { HiArrowLeft, HiOutlineMail } from 'react-icons/hi'
import { sendMail } from '@/services/authApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      await sendMail(email)
      toast.success('OTP sent successfully to your email')
      dispatch(setSignupData({ email, type: 'forgetPassword' }))
      navigate('/auth/otp-verify')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleGoBack}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white md:text-gray-600 hover:text-gray-800 transition-colors bg-black/20 md:bg-white/80 backdrop-blur-sm rounded-full p-2 md:p-3"
      >
        <HiArrowLeft className="text-lg" />
        <span className="text-sm font-medium hidden sm:inline">Back</span>
      </motion.button>

      {/* Left Section - Image with overlay text */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#8b4513]/80 to-[#6d3510]/70 z-10 flex flex-col justify-center items-start p-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Forgot Your Password?
            </h1>
            <p className="text-white/90 mb-6 text-lg">
              Don't worry, it happens. Enter your email address and we'll send you a code to reset it.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 px-4">
                <span className="text-white">Secure reset</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 px-4">
                <span className="text-white">Quick verification</span>
              </div>
            </div>
          </motion.div>
        </div>
        <img
          src="/images/signin.jpeg"
          alt="Luxury Hotel"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* Right Section - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Reset Password
          </h2>
          <p className="text-gray-500 mb-8">
            Enter your email to receive a verification code
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <HiOutlineMail className="text-lg" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 py-6 rounded-xl bg-gray-50 border-gray-200 focus:border-[#8b4513] focus:ring-[#8b4513]/10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 bg-gradient-to-r from-[#8b4513] to-[#6d3510] hover:opacity-90 text-white rounded-xl transition-all text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{' '}
            <Link
              to="/auth/signin"
              className="text-[#8b4513] font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default ForgotPassword
