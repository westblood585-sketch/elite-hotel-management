import React, { useState, useRef, useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Camera,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  Phone,
  Mail,
  UserCheck,
  Upload,
  ZoomIn,
  ZoomOut,
  Check,
  Shield,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/redux/store/store'
import { toast } from 'sonner'
import { passwordUpdate } from '@/services/authApi'
import { updateUserProfile, uploadAvatar } from '@/services/userApi'
import type { ServerErrorResponse } from '@/utils/serverErrorResponse'
import { updateUser, updateAvatar } from '@/redux/slices/authSlice'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/utils/canvasUtils'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

// Zod Schemas
const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Types
type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

interface UserProfile extends ProfileFormData {
  role: 'receptionist' | 'housekeeper' | 'admin'
  profilePicture?: string
}

const Profile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()

  // State
  const [profile, setProfile] = useState<UserProfile>({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    role: user?.role as 'receptionist' | 'housekeeper' | 'admin',
    profilePicture: user?.avatar?.url || user?.profileImage,
  })

  // Update local state when redux user changes
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        profilePicture: user?.avatar?.url || user?.profileImage,
      }))
    }
  }, [user])

  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isPhotoUploading, setIsPhotoUploading] = useState(false)

  // Photo Upload State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Crop State
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isCropping, setIsCropping] = useState(false)

  // Error states
  const [profileError, setProfileError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')

  // Clear error functions
  const clearProfileError = () => {
    if (profileError) setProfileError('')
  }

  const clearPasswordError = () => {
    if (passwordError) setPasswordError('')
  }

  // React Hook Form for Profile
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: { // Use values instead of defaultValues to react to state changes
      fullName: profile.fullName,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
    },
  })

  // React Hook Form for Password
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  // Role configurations
  const roleConfig = {
    receptionist: { color: 'bg-blue-100/50 text-blue-700 border-blue-200', label: 'Receptionist' },
    housekeeper: { color: 'bg-green-100/50 text-green-700 border-green-200', label: 'Housekeeper' },
    admin: { color: 'bg-purple-100/50 text-purple-700 border-purple-200', label: 'Administrator' },
  }

  // Helper Functions
  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '')
        setZoom(1)
        setIsCropping(true)
      })
      reader.readAsDataURL(file)
      e.target.value = ''
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCameraOpen(true)
    } catch (err) {
      console.error("Camera error:", err)
      toast.error('Could not access camera. Please upload an image instead.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(videoRef.current, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setImgSrc(dataUrl)
        setZoom(1)
        setIsCropping(true) 
        stopCamera()
      }
    }
  }
  
  const saveCroppedImage = async () => {
    try {
      if (imgSrc && croppedAreaPixels && user?.id) {
        setIsPhotoUploading(true)
        const croppedBlob = await getCroppedImg(imgSrc, croppedAreaPixels)
        if (croppedBlob) {
           const file = new File([croppedBlob], "profile-avatar.jpg", { type: "image/jpeg" })
           
           // Upload immediately
           const avatarData = await uploadAvatar(user.id, file)
           
           // Update Redux
           dispatch(updateAvatar(avatarData))
           
           toast.success('Profile picture updated!')
           setAvatarPreview(null) 
           setIsCropping(false)
           setImgSrc(null)
        }
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to update profile picture')
    } finally {
      setIsPhotoUploading(false)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])


  const handleEditToggle = () => {
    if (isEditing) {
      resetProfile({
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      })
      clearProfileError()
    }
    setIsEditing(!isEditing)
  }

  const onSubmitProfile: SubmitHandler<ProfileFormData> = async (data) => {
    setProfileError('')
    setIsLoading(true)
    try {
      if (!user?.id) throw new Error("User ID not found")
      
      const updatedUser = await updateUserProfile(user.id, {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        // email typically cannot be updated directly or requires verification
      })
      
      dispatch(updateUser({ 
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber 
      }))
      
      setProfile((prev) => ({ ...prev, ...data }))
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      const serverError = error as ServerErrorResponse
      if (serverError?.response?.data?.message) {
        setProfileError(serverError.response.data.message)
      } else {
        setProfileError('Failed to update profile. Please try again.')
      }
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword: SubmitHandler<PasswordFormData> = async (
    data
  ) => {
    setPasswordError('')
    setIsLoading(true)
    try {
      const response = await passwordUpdate(data)
      if (response.success) {
        toast.success(response.message)
        setShowPasswordForm(false)
        resetPassword()
        setPasswordError('')
      } else {
        setPasswordError(response.message || 'Failed to update password')
        toast.error(response.message)
      }
    } catch (error) {
      console.error('Error found in update password:', error)
      const serverError = error as ServerErrorResponse
      if (serverError?.response?.data?.message) {
        setPasswordError(serverError.response.data.message)
      } else {
        setPasswordError('An unknown error occurred. Please try again.')
      }
      toast.error('Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

      <div className="max-w-[1600px] mx-auto relative z-10 space-y-8 px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-4xl font-serif font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500 mt-2 font-medium">Manage your personal information and security settings.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture & Role Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1"
           >
            <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl p-8 text-center sticky top-24">
              
              {/* Profile Photo Area */}
              <div className="relative inline-block mb-6 group">
                <div className="w-40 h-40 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-xl ring-4 ring-white/50">
                  {isPhotoUploading ? (
                     <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-blue-600 mb-2" size={24} />
                        <span className="text-xs text-blue-600 font-medium">Uploading...</span>
                     </div>
                  ) : profile.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={64} className="text-blue-400" />
                  )}
                </div>
                
                {/* Photo Actions Overlay */}
                 <div className="absolute -bottom-2 -right-2 flex flex-col gap-2 scale-90 md:scale-100 transition-transform">
                   <button
                     onClick={() => fileInputRef.current?.click()}
                     className="bg-white text-gray-700 p-2.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-100"
                     title="Upload new photo"
                   >
                     <Upload size={18} />
                   </button>
                   <button
                     onClick={startCamera}
                     className="bg-gray-900 text-white p-2.5 rounded-full shadow-lg hover:bg-gray-800 transition-colors border border-white"
                     title="Take photo"
                   >
                     <Camera size={18} />
                   </button>
                 </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {profile.fullName}
              </h2>

              <div
                className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border mb-6 ${
                  roleConfig[profile.role].color
                }`}
              >
                <Shield size={14} className="mr-1.5" />
                {roleConfig[profile.role].label}
              </div>

              <div className="space-y-3 text-sm text-gray-600 border-t border-gray-200/50 pt-6">
                <div className="flex items-center justify-center p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-colors">
                  <Mail size={16} className="mr-3 text-gray-400" />
                  {profile.email}
                </div>
                <div className="flex items-center justify-center p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-colors">
                  <Phone size={16} className="mr-3 text-gray-400" />
                  {profile.phoneNumber || "No phone number added"}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.4 }}
                 className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Personal Information
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Update your personal details here</p>
                </div>
                <button
                  onClick={handleEditToggle}
                  className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm ${
                    isEditing
                      ? 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                      : 'text-white bg-gray-900 hover:bg-gray-800 shadow-md shadow-gray-900/10'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <X size={16} className="mr-2" /> Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} className="mr-2" /> Edit Details
                    </>
                  )}
                </button>
              </div>

              {profileError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50/50 border border-red-200/50 rounded-2xl flex items-center gap-3 backdrop-blur-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <p className="text-sm text-red-600 font-medium">{profileError}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          {...registerProfile('fullName', { onChange: clearProfileError })}
                          className="w-full px-5 py-3 bg-white/50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-900 placeholder-gray-400 shadow-sm"
                        />
                        {profileErrors.fullName && (
                          <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{profileErrors.fullName.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="px-5 py-3.5 bg-gray-50/50 border border-transparent rounded-2xl text-gray-900 font-medium">
                        {profile.fullName}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Role</label>
                    <div className={`px-5 py-3.5 rounded-2xl border bg-white/50 border-transparent font-medium flex items-center text-gray-500 cursor-not-allowed`}>
                         <Shield size={16} className="mr-2 text-gray-400" />
                       {roleConfig[profile.role].label}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                    <div className="px-5 py-3.5 bg-gray-50/50 border border-transparent rounded-2xl text-gray-500 cursor-not-allowed flex items-center justify-between font-medium">
                      {profile.email}
                      <Lock size={14} className="text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                    {isEditing ? (
                      <div>
                        <input
                          type="tel"
                          {...registerProfile('phoneNumber', { onChange: clearProfileError })}
                          className="w-full px-5 py-3 bg-white/50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-900 placeholder-gray-400 shadow-sm"
                        />
                        {profileErrors.phoneNumber && (
                          <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{profileErrors.phoneNumber.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="px-5 py-3.5 bg-gray-50/50 border border-transparent rounded-2xl text-gray-900 font-medium">
                        {profile.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end mt-8 pt-6 border-t border-gray-100"
                  >
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 hover:shadow-gray-900/30 disabled:opacity-70 disabled:cursor-not-allowed font-bold"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save size={18} className="mr-2" />
                      )}
                      {isLoading ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </motion.div>
                )}
              </form>
            </motion.div>

            {/* Password Change Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-xl font-bold text-gray-900">Security</h3>
                   <p className="text-sm text-gray-500 mt-1 font-medium">Manage your password and security settings</p>
                </div>
                {!showPasswordForm && (
                   <button
                    onClick={() => {
                        setShowPasswordForm(true)
                        resetPassword()
                        clearPasswordError()
                    }}
                    className="flex items-center px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
                   >
                    <Lock size={16} className="mr-2" /> Change Password
                   </button>
                )}
              </div>

              <AnimatePresence>
              {showPasswordForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                   <div className="pt-2">
                    {passwordError && (
                        <div className="mb-6 p-4 bg-red-50/50 border border-red-200/50 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <p className="text-sm text-red-600 font-medium">{passwordError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmitPassword(handleUpdatePassword)} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Current Password</label>
                            <div className="relative">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                {...registerPassword('currentPassword', { onChange: clearPasswordError })}
                                className="w-full px-5 py-3 bg-white/50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-900 placeholder-gray-400 shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('current')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            </div>
                            {passwordErrors.currentPassword && (
                            <p className="text-xs text-red-500 font-bold ml-1">{passwordErrors.currentPassword.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">New Password</label>
                                <div className="relative">
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    {...registerPassword('newPassword', { onChange: clearPasswordError })}
                                    className="w-full px-5 py-3 bg-white/50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-900 placeholder-gray-400 shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                </div>
                                {passwordErrors.newPassword && (
                                <p className="text-xs text-red-500 font-bold ml-1">{passwordErrors.newPassword.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                                <div className="relative">
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    {...registerPassword('confirmPassword', { onChange: clearPasswordError })}
                                    className="w-full px-5 py-3 bg-white/50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-900 placeholder-gray-400 shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                </div>
                                {passwordErrors.confirmPassword && (
                                <p className="text-xs text-red-500 font-bold ml-1">{passwordErrors.confirmPassword.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button 
                                type="button"
                                onClick={() => setShowPasswordForm(false)}
                                className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 disabled:opacity-70 font-bold"
                            >
                                {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : (
                                <Check size={16} className="mr-2" />
                                )}
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                   </div>
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

       {/* Camera Modal */}
       <AnimatePresence>
            {isCameraOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              >
                <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative border border-white/20">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 text-lg">Take Profile Photo</h3>
                    <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="relative aspect-[4/3] bg-black">
                     <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                  </div>
                  <div className="p-6 flex justify-center bg-gray-900">
                    <button onClick={capturePhoto} className="group bg-white rounded-full p-1.5 border-4 border-gray-700 hover:border-gray-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300">
                        <div className="w-16 h-16 rounded-full bg-red-600 group-hover:bg-red-500 transition-colors"></div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
       </AnimatePresence>

       {/* Cropper Modal */}
        <AnimatePresence>
            {isCropping && (
                <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                >
                <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl relative flex flex-col h-[85vh] md:h-auto border border-white/20">
                    <div className="p-5 border-b flex justify-between items-center bg-white z-10">
                    <h3 className="font-bold text-gray-900 text-lg">Edit Photo</h3>
                    <button onClick={() => setIsCropping(false)} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    </div>
                    
                    <div className="relative flex-1 min-h-[400px] bg-black">
                        <Cropper
                        image={imgSrc || ''}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        cropShape="round"
                        showGrid={true}
                    />
                    </div>
                    
                    <div className="p-6 bg-white space-y-6">
                        <div className="flex items-center gap-4">
                        <ZoomOut className="w-5 h-5 text-gray-400" />
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                        <ZoomIn className="w-5 h-5 text-gray-400" />
                        </div>
                        
                        <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setIsCropping(false)} className="flex-1 py-6 rounded-xl text-gray-600 hover:bg-gray-100 font-bold">
                            Cancel
                        </Button>
                        <Button onClick={saveCroppedImage} className="flex-1 py-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 font-bold">
                            {isPhotoUploading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                <Check className="w-5 h-5 mr-2" /> Save Photo
                                </>
                            )}
                        </Button>
                        </div>
                    </div>
                </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  )
}

export default Profile
