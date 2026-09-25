import IUser from '../../interfaces/IUser'

type UserData = {
  user?: IUser
  role?: string
  accessToken?: string
  refreshToken?: string
}

type ApiResponse = {
  success: boolean
  message: string
  data?: UserData
  refreshToken?: string
  accessToken?: string
  exist?: boolean

  user?: object
  require2fa?: boolean
  resetToken?: string
  role?: string
}

export interface IAuthService {
  signUp(
    fullName: string,
    email: string,
    phoneNumber: string,
    password: string,
    role: string,
    avatar?: { publicId: string; url: string }
  ): Promise<void>
  verifySignUpOtp(
    email: string,
    otp: string,
    type: string
  ): Promise<ApiResponse | undefined>
  verifyLoginOtp(
    email: string,
    otp: string
  ): Promise<ApiResponse | undefined>
  resendOtpWork(email: string): Promise<ApiResponse | undefined>
  signIn(
    email: string,
    password: string,
    role: string
  ): Promise<ApiResponse | undefined>
  signInWithGoogle(
    email: string,
    name: string,
    phoneNumber: string,
    role: string
  ): Promise<ApiResponse | undefined>
  sendMail(email: string): Promise<ApiResponse | undefined>
  resetPassword(
    email: string,
    password: string,
    confirmPassword: string,
    token: string
  ): Promise<ApiResponse | undefined>
  passwordUpdate(id: string, data: any): Promise<{ success: boolean; message: string }>
  getUsersByRole(role: string, page?: number, limit?: number): Promise<{ success: boolean; data: any[] }>
}
