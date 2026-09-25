import { HttpStatus } from '../../enums/http.status'
import { sendUserData } from '../../events/rabbitmq/producers/producer'
import { OtpRepository } from '../../repository/implementation/otp.repository'
import IUserRepository from '../../repository/interface/IUser.repository'
import CustomError from '../../utils/CustomError'
import { sentOTPEmail } from '../../utils/email.util'
import { hashPassword, generateRandomPassword } from '../../utils/hash.util'
import { generateOtp } from '../../utils/otp.util'
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../utils/token.util'
import { IAuthService } from '../interface/IAuth.service'
import bcrypt from 'bcryptjs'
import { Setting } from '../../models/setting.model'
import { UserServiceClient } from '../integration/user.service.client'
import jwt from 'jsonwebtoken'

interface PasswordUpdate {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export class AuthService implements IAuthService {
  private userRepository: IUserRepository
  private otpRepository: OtpRepository
  private userServiceClient: UserServiceClient

  constructor(
    userRepository: IUserRepository,
    otpRepository: OtpRepository,
    userServiceClient: UserServiceClient
  ) {
    this.userRepository = userRepository
    this.otpRepository = otpRepository
    this.userServiceClient = userServiceClient
  }

  async signUp(
    fullName: string,
    email: string,
    phoneNumber: string,
    password: string,
    role: string,
    avatar?: { publicId: string; url: string }
  ) {
    try {
      const existingEmail = await this.userRepository.findByEmail(email)
      if (existingEmail && existingEmail.isVerified) {
        throw new CustomError('Email already exists', HttpStatus.ALREADYEXISTS)
      }

      const existingPhone = await this.userRepository.findByPhoneNumber(phoneNumber)
      if (existingPhone && existingPhone.isVerified) {
        throw new CustomError('Phone number already exists', HttpStatus.ALREADYEXISTS)
      }

      const hashedPassword = await hashPassword(password)
      const userData: any = {
        fullName,
        email,
        phoneNumber,
        password: hashedPassword,
        role: role as 'receptionist' | 'housekeeper' | 'admin',
        isVerified: false,
        avatar,
      }

      if (!existingEmail && !existingPhone) {
        // Option A: Call UserService to create the user
        // Note: UserService creates the user with normalized email/phone
        // We pass the HASHED password because UserService stores it.
        const createdUser = await this.userServiceClient.createUser(userData)
        
        // Update local cache immediately to prevent race conditions
        // We ensure we store it locally so findByEmail works for OTP verification
        await this.userRepository.create({
            ...userData,
            _id: createdUser._id // Ensure IDs match!
        })

      } else if (existingEmail && !existingEmail.isVerified) {
        // Existing unverified user: Update in UserService?
        // UserService might already have it. If we just update local cache, it might desync?
        // Ideally we should call userServiceClient.updateUser(existingEmail._id, ...)
        // But for now, let's keep local logic or try to sync.
        // If we update locally, the event from UserService (if we called update) would come back.
        // Let's call UserService to update if possible.
        // But we don't have updateByEmail in client yet, only update(id).
        
        if (existingEmail._id) {
             await this.userServiceClient.updateUser(existingEmail._id.toString(), {
                ...userData,
                isVerified: false
             })
        }
        
        await this.userRepository.updateByEmail(email, {
          ...userData,
          isVerified: false,
        })
        await this.otpRepository.deleteOtp(email)
      } else if (existingPhone && !existingPhone.isVerified) {
         if (existingPhone._id) {
             await this.userServiceClient.updateUser(existingPhone._id.toString(), {
                ...userData,
                isVerified: false
             })
        }

         await this.userRepository.updateByEmail(existingPhone.email, {
          ...userData,
          isVerified: false,
        })
        await this.otpRepository.deleteOtp(existingPhone.email)
      }

      const otp = generateOtp()
      await sentOTPEmail(email, otp)
      
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      await this.otpRepository.create({ email, otp, expiresAt })
    } catch (error) {
      throw error
    }
  }

  async verifySignUpOtp(email: string, otp: string, type: string) {
    try {
      const checkUser = await this.userRepository.findByEmail(email)

      if (!checkUser) {
        throw new CustomError('user not found!', HttpStatus.NOTFOUND)
      }

      if (checkUser && checkUser.isVerified && type !== 'forgetPassword') {
        throw new CustomError('User already exists', HttpStatus.ALREADYEXISTS)
      }

      const getOtp = await this.otpRepository.findOtpByEmail(email)
      if (!getOtp) {
        throw new CustomError('otp expired or invalid!', HttpStatus.NOTFOUND)
      }

      const findOtp = getOtp.find((x) => x.otp == otp)
      if (findOtp && type === 'forgetPassword') {
        // Generate a temporary reset token
        const resetToken = jwt.sign(
          { email, type: 'reset-password' },
          process.env.ACCESS_TOKEN_SECRET || 'fallback_secret', // Should ideally use a separate secret
          { expiresIn: '5m' }
        )

        return {
          success: true,
          message: 'otp verified Successfully!',
          role: checkUser?.role,
          resetToken: resetToken,
        }
      }

      // Update in UserService as verified
      // We need to fetch the ID first? checkUser has it.
      await this.userServiceClient.updateUser(checkUser._id.toString(), { isVerified: true })

      await this.userRepository.updateUserField(email, 'isVerified', true)
      await this.otpRepository.deleteOtp(email)

      const accessToken = generateAccessToken({
        id: checkUser._id.toString(),
        email,
        role: checkUser.role,
      })
      const refreshToken = generateRefreshToken({
        id: checkUser._id.toString(),
        email,
        role: checkUser.role,
      })

      return {
        success: true,
        message: 'OTP verified successfully!',
        data: { user: checkUser, accessToken, refreshToken },
      }
    } catch (error) {
      throw error
    }
  }

  async resendOtpWork(email: string) {
    try {
      const otp = generateOtp()
      await sentOTPEmail(email, otp)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await this.otpRepository.create({ email, otp, expiresAt })
      return { success: true, message: 'Resend otp passed to user' }
    } catch (error) {
      throw error
    }
  }

  async signIn(email: string, password: string, role: string) {
    try {
      const checkUser = await this.userRepository.findByEmailWithPassword(email)
      if (!checkUser || role !== checkUser.role) {
        throw new CustomError('user not found!', HttpStatus.NOTFOUND)
      }

      if (checkUser.isVerified === false) {
        throw new CustomError('User not verified!', HttpStatus.UNAUTHORIZED)
      }

      const passwordCheck = await bcrypt.compare(password, checkUser.password)
      if (!passwordCheck) {
        throw new CustomError('Invalid credentials!', HttpStatus.UNAUTHORIZED)
      }

      // Check for 2FA if user is admin
      if (role === 'admin') {
        const setting = await Setting.findOne({ key: 'security.2fa' });
        if (setting && setting.value === true) {
          const otp = generateOtp()
          await sentOTPEmail(email, otp)
          
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
          await this.otpRepository.create({ email, otp, expiresAt })

          return {
            success: true,
            message: '2FA verification required',
            require2fa: true,
            data: { email }
          }
        }
      }

      const accessToken = generateAccessToken({
        id: checkUser._id.toString(),
        email,
        role: checkUser.role,
      })

      const refreshToken = generateRefreshToken({
        id: checkUser._id.toString(),
        email,
        role: checkUser.role,
      })

      return {
        success: true,
        message: 'Signed in successfully',
        data: { user: checkUser, accessToken, refreshToken },
      }
    } catch (error) {
      throw error
    }
  }

  async signInWithGoogle(
    email: string,
    name: string,
    phoneNumber: string,
    role: string
  ) {
    try {
      let userData = await this.userRepository.findByEmail(email)
      if (userData) {
        await sendUserData('userExchange', userData)

        const accessToken = generateAccessToken({
          id: userData._id.toString(),
          email,
          role: userData.role,
        })
        const refreshToken = generateRefreshToken({
          id: userData._id.toString(),
          email,
          role: userData.role,
        })

        return {
          success: true,
          message: 'Sign in with google completed',
          role: role,
          exist: true,
          data: { user: userData, accessToken, refreshToken },
        }
      }

      const password = generateRandomPassword()
      const hashedPassword = await hashPassword(password)
      
      const newUserData = {
        email,
        fullName: name,
        phoneNumber,
        password: hashedPassword,
        role: role as 'receptionist' | 'housekeeper',
        isVerified: true,
      }

      // Create in UserService
      const createdUser = await this.userServiceClient.createUser(newUserData)
      
      // Create in local cache
      userData = await this.userRepository.create({
        ...newUserData,
        _id: createdUser._id
      })

      await sendUserData('userExchange', userData)

      const accessToken = generateAccessToken({
        id: userData._id.toString(),
        email,
        role: userData.role,
      })
      const refreshToken = generateRefreshToken({
        id: userData._id.toString(),
        email,
        role: userData.role,
      })

      return {
        success: true,
        message: 'Sign in with google completed',
        role: role,
        exist: false,
        data: { user: userData, accessToken, refreshToken },
      }
    } catch (error) {
      throw error
    }
  }

  async sendMail(email: string) {
    try {
      const isUser = await this.userRepository.findByEmail(email)
      if (!isUser || isUser.isVerified === false) {
        throw new CustomError('user not found!', HttpStatus.NOTFOUND)
      }
      const otp = generateOtp()

      await sentOTPEmail(email, otp)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await this.otpRepository.create({ email, otp, expiresAt })
      return { success: true, message: 'OTP send to user email' }
    } catch (error) {
      throw error
    }
  }
  async resetPassword(
    email: string,
    password: string,
    confirmPassword: string,
    token: string
  ) {
    try {
      if (!token) {
         throw new CustomError('Reset token required', HttpStatus.UNAUTHORIZED)
      }
      
      // Verify token
      try {
          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'fallback_secret') as any
          if (decoded.email !== email || decoded.type !== 'reset-password') {
               throw new CustomError('Invalid reset token', HttpStatus.FORBIDDEN)
          }
      } catch (err) {
          throw new CustomError('Invalid or expired reset token', HttpStatus.FORBIDDEN)
      }

      if (password !== confirmPassword) {
        throw new CustomError('Passwords do not match', HttpStatus.BAD_REQUEST)
      }
      const hashedPassword = await hashPassword(password)

      // const changePassword = await this.userRepository.updatePasswordUser(email, hashedPassword)
      const changePassword = await this.userRepository.updateUserField(
        email,
        'password',
        hashedPassword
      )
      return { success: true, message: 'New password updated' }
    } catch (error) {
      throw error
    }
  }

  async passwordUpdate(id: string, data: PasswordUpdate) {
    try {
      const { currentPassword, newPassword, confirmPassword } = data
      const checkUser = await this.userRepository.findById(id)
      if (!checkUser) {
        throw new CustomError('user not found', HttpStatus.NOTFOUND)
      }
      const checkPassword = await bcrypt.compare(
        currentPassword,
        checkUser.password
      )

      if (!checkPassword) {
        throw new CustomError('Wrong password', HttpStatus.UNAUTHORIZED)
      }
      if (newPassword !== confirmPassword) {
        throw new CustomError('Passwords do not match', HttpStatus.BAD_REQUEST)
      }
      const hashedPassword = await hashPassword(newPassword)
      const updatePassword = await this.userRepository.update(id, {
        password: hashedPassword,
      })
      if (!updatePassword) {
        throw new CustomError('Password update failed', HttpStatus.INTERNAL_SERVER_ERROR)
      }
      return { success: true, message: 'updated' }
    } catch (error) {
      throw error
    }
  }

  async verifyLoginOtp(email: string, otp: string) {
    try {
      const otpRecords = await this.otpRepository.findOtpByEmail(email)
      
      const verified = otpRecords?.find(record => record.otp === otp)

      if (!verified) {
         return {
            success: false,
            message: "Invalid OTP",
         }
      }

      const user = await this.userRepository.findByEmail(email)
      if (!user) {
        throw new CustomError('User not found', HttpStatus.NOTFOUND)
      }

      // Generate tokens
      const accessToken = generateAccessToken({ 
          id: (user._id as unknown as string), 
          email: user.email, 
          role: user.role 
      })

      const refreshToken = generateRefreshToken({ 
          id: (user._id as unknown as string), 
          email: user.email, 
          role: user.role 
      })

      return {
        success: true,
        message: 'Login successful',
        data: {
            user,
            accessToken,
            refreshToken
        },
        refreshToken 
      }

    } catch (error) {
      throw error
    }
  }

  async getUsersByRole(role: string, page: number = 1, limit: number = 20) {
    try {
      const users = await this.userRepository.findAllByRole(role, { page, limit })
      return { success: true, data: users }
    } catch (error) {
      throw error
    }
  }
}
