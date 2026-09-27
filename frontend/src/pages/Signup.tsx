import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FcGoogle } from 'react-icons/fc'
import { HiOutlineMail, HiArrowLeft } from 'react-icons/hi'
import { RiLockPasswordLine } from 'react-icons/ri'
import { BsTelephone, BsPerson } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { UserRole } from '@/types/index'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema, type SignUpSchemaType } from '@/validators/authValidator'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/redux/store/store'
import { setSignupData } from '@/redux/slices/signupSlice'
import { signUpRequest } from '@/services/authApi'
import type { ServerErrorResponse } from '@/utils/serverErrorResponse'
import { Link } from 'react-router-dom'
import { uploadPublicAvatar } from '@/services/userApi'
import { Camera, Upload, X, ZoomIn, ZoomOut, Check } from 'lucide-react'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/utils/canvasUtils'
import { Slider } from '@/components/ui/slider'

export default function Signup() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const [role, setRole] = useState<UserRole>('receptionist')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole)
  }

  const clearError = () => {
    if (error) setError('')
  }

  const handleGoBack = () => {
    navigate(-1) // Go back to previous page
  }

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
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

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB')
        return
      }
      // Instead of setting avatar directly, set imgSrc for cropping
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '')
        setZoom(1)
        setIsCropping(true)
      })
      reader.readAsDataURL(file)
      
      // Reset input value to allow selecting same file again
      e.target.value = ''
      setError('')
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
      setError('')
    } catch (err) {
      console.error("Camera error:", err)
      setError('Could not access camera. Please upload an image instead.')
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
        ctx.drawImage(videoRef.current, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setImgSrc(dataUrl)
        setZoom(1)
        setIsCropping(true) // Open cropper with captured image
        stopCamera() // Close camera modal
      }
    }
  }
  
  const showCroppedImage = async () => {
    try {
      if (imgSrc && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(imgSrc, croppedAreaPixels)
        if (croppedBlob) {
           const file = new File([croppedBlob], "profile-avatar.jpg", { type: "image/jpeg" })
           setAvatarFile(file)
           setAvatarPreview(URL.createObjectURL(file))
           setIsCropping(false)
           setImgSrc(null)
        }
      }
    } catch (e) {
      console.error(e)
      setError("Failed to crop image")
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit: SubmitHandler<SignUpSchemaType> = async (data) => {
    setError('') // Clear any previous errors
    setIsLoading(true)
    try {
      const { fullName, email, password, phoneNumber } = data

      let avatarData
      if (avatarFile) {
        setIsUploading(true)
        try {
          avatarData = await uploadPublicAvatar(avatarFile)
        } catch (uploadErr) {
          console.error("Avatar upload failed", uploadErr)
          setError("Failed to upload profile photo. Please try again or skip it.")
          setIsLoading(false)
          setIsUploading(false)
          return
        }
        setIsUploading(false)
      }

      const response = await signUpRequest(
        fullName,
        email,
        password,
        role,
        phoneNumber,
        avatarData
      )

      if (response.success) {
        setError('') // Clear error on success

        dispatch(
          setSignupData({
            fullName,
            email,
            phoneNumber,
            role: role,
            type: 'signup',
          })
        )

        navigate('/auth/otp-verify', { state: { email, type: 'signup' } })
      } else {
        setError(response.message || 'Failed to create account')
      }
    } catch (error) {
      console.error('Error during sign up:', error)

      // Assert the type of the error object
      const serverError = error as ServerErrorResponse

      if (
        serverError &&
        serverError.response &&
        serverError.response.data &&
        serverError.response.data.message
      ) {
        setError(serverError.response.data.message)
      } else {
        // Fallback for other error types
        setError('An unknown error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Back Button - Positioned absolutely for both mobile and desktop */}
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
              Join Our Hotel Management Platform
            </h1>
            <p className="text-white/90 mb-6 text-lg">
              Streamline your workflow and enhance guest experiences with our
              intuitive management system.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 px-4">
                <span className="text-white">Easy onboarding</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 px-4">
                <span className="text-white">24/7 support</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 px-4">
                <span className="text-white">Real-time updates</span>
              </div>
            </div>
          </motion.div>
        </div>
        <img
          src="/images/signup.avif"
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
          <h2 className="text-3xl font-bold text-gray-800 mb-1">
            Create account
          </h2>
          <p className="text-gray-500 mb-6">
            Join as a team member to get started
          </p>

          <Tabs
            defaultValue="receptionist"
            className="mb-6"
            onValueChange={(value: string) =>
              handleRoleChange(value as UserRole)
            }
          >
            <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 rounded-lg">
              <TabsTrigger value="receptionist" className="rounded-md">
                Receptionist
              </TabsTrigger>
              <TabsTrigger value="housekeeper" className="rounded-md">
                Housekeeper
              </TabsTrigger>
            </TabsList>

            <TabsContent value="receptionist">
              <p className="text-sm text-gray-500 mb-4">
                Sign up as a receptionist to manage front desk operations,
                check-ins, and customer service.
              </p>
            </TabsContent>

            <TabsContent value="housekeeper">
              <p className="text-sm text-gray-500 mb-4">
                Sign up as a housekeeper to manage room cleaning schedules,
                inventory, and maintenance requests.
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col items-center mb-8">
            <Label className="mb-4 text-gray-600 font-medium">Profile Photo (Optional)</Label>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center shadow-sm">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 text-center p-2">
                       <BsPerson className="w-10 h-10 mx-auto mb-1 opacity-50" />
                    </div>
                  )}
                </div>
                {avatarPreview && (
                   <button 
                     type="button"
                     onClick={() => {
                        setAvatarFile(null)
                        setAvatarPreview(null)
                     }}
                     className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                   >
                     <X className="w-3 h-3" />
                   </button>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="relative overflow-hidden rounded-lg">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full flex items-center gap-2 text-xs h-9"
                  >
                    <Upload className="w-3 h-3" /> Upload Photo
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={startCamera}
                  className="w-full flex items-center gap-2 text-xs h-9 bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <Camera className="w-3 h-3" /> Take Photo
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isCameraOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              >
                <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl relative">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Take Profile Photo</h3>
                    <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="relative aspect-[4/3] bg-black">
                     <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                  </div>
                  <div className="p-4 flex justify-center bg-gray-50">
                    <Button onClick={capturePhoto} className="bg-[#8b4513] hover:bg-[#6d3510] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg border-4 border-white ring-2 ring-[#8b4513]/20">
                      <div className="w-full h-full rounded-full border-2 border-white/50" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCropping && (
               <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
              >
                <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl relative flex flex-col h-[80vh] md:h-auto">
                   <div className="p-4 border-b flex justify-between items-center bg-white z-10">
                    <h3 className="font-semibold text-gray-800">Edit Photo</h3>
                    <button onClick={() => setIsCropping(false)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="relative flex-1 min-h-[300px] bg-black">
                     <Cropper
                      image={imgSrc || ''}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      cropShape="round"
                      showGrid={false}
                    />
                  </div>
                  
                  <div className="p-6 bg-white space-y-4">
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
                     
                     <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => setIsCropping(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={showCroppedImage} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                           <Check className="w-4 h-4 mr-2" /> Save Photo
                        </Button>
                     </div>
                  </div>
                </div>
               </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4 mb-6">
            <Button
              variant="outline"
              className="flex items-center justify-center w-full py-6 border rounded-xl hover:bg-gray-50 transition-all"
              // onClick={() => handleProviderAuth({ provider: "google" })}
              disabled={isLoading}
            >
              <FcGoogle className="mr-2 text-xl" /> Continue with Google
            </Button>
          </div>

          <div className="relative text-center my-6">
            <div className="absolute left-0 top-1/2 h-px w-full bg-gray-200"></div>
            <span className="relative bg-white px-4 text-gray-500 text-sm">
              OR CONTINUE WITH EMAIL
            </span>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <BsPerson />
                </div>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  autoComplete="name"
                  className="pl-10 py-6 rounded-xl bg-gray-50 border-gray-200 focus:border-[#8b4513] focus:ring-[#8b4513]/10"
                  required
                  {...register('fullName', { onChange: clearError })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <HiOutlineMail />
                </div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="pl-10 py-6 rounded-xl bg-gray-50 border-gray-200 focus:border-[#8b4513] focus:ring-[#8b4513]/10"
                  required
                  {...register('email', { onChange: clearError })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <RiLockPasswordLine />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="pl-10 py-6 rounded-xl bg-gray-50 border-gray-200 focus:border-[#8b4513] focus:ring-[#8b4513]/10"
                  required
                  {...register('password', { onChange: clearError })}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-gray-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <BsTelephone />
                </div>
                <Input
                  id="phone"
                  type="text"
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  className="pl-10 py-6 rounded-xl bg-gray-50 border-gray-200 focus:border-[#8b4513] focus:ring-[#8b4513]/10"
                  required
                  {...register('phoneNumber', { onChange: clearError })}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-xs text-gray-500 mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-6 bg-gradient-to-r from-[#8b4513] to-[#6d3510] hover:opacity-90 text-white rounded-xl transition-all text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
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
