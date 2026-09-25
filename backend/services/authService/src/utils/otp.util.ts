import crypto from 'crypto'

/**
 * OTP Configuration
 */
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
  MAX_ATTEMPTS: parseInt(process.env.MAX_OTP_ATTEMPTS || '3'),
}

/**
 * Generate a cryptographically secure OTP
 * Uses crypto.randomInt instead of Math.random() for better security
 * 
 * @param length - OTP length (default: 6)
 * @returns Cryptographically secure OTP string
 */
export const generateOtp = (length: number = OTP_CONFIG.LENGTH): string => {
  // Calculate min and max values for the OTP
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  
  // Generate cryptographically secure random number
  const otp = crypto.randomInt(min, max + 1).toString()
  
  // DO NOT log OTP in production - security risk!
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV ONLY] Generated OTP: ${otp}`)
  }
  
  return otp
}

/**
 * Calculate OTP expiry timestamp
 * @returns Date object representing when OTP expires
 */
export const getOtpExpiry = (): Date => {
  const expiryTime = new Date()
  expiryTime.setMinutes(expiryTime.getMinutes() + OTP_CONFIG.EXPIRY_MINUTES)
  return expiryTime
}

/**
 * Check if OTP has expired
 * @param expiryDate - The expiry date to check
 * @returns true if OTP is expired
 */
export const isOtpExpired = (expiryDate: Date): boolean => {
  return new Date() > expiryDate
}

/**
 * Timing-safe OTP comparison to prevent timing attacks
 * @param inputOtp - OTP provided by user
 * @param storedOtp - OTP stored in database
 * @returns true if OTPs match
 */
export const compareOtp = (inputOtp: string, storedOtp: string): boolean => {
  // Ensure both are strings of same length
  if (typeof inputOtp !== 'string' || typeof storedOtp !== 'string') {
    return false
  }
  
  if (inputOtp.length !== storedOtp.length) {
    return false
  }
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(inputOtp),
    Buffer.from(storedOtp)
  )
}
