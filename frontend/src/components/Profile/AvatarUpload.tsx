import React, { useState, useRef } from 'react'
import { Upload, X, Camera, Loader2 } from 'lucide-react'
import { uploadAvatar, removeAvatar } from '@/services/userApi'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { updateAvatar } from '@/redux/slices/authSlice'
import ImageCropper from '@/components/shared/ImageCropper'

interface AvatarUploadProps {
  userId: string
  currentAvatar?: {
    publicId: string
    url: string
  }
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ userId, currentAvatar }) => {

  const dispatch = useDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [preview, setPreview] = useState<string | null>(currentAvatar?.url || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Cropper State
  const [cropperOpen, setCropperOpen] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null) // For the raw file before crop

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!validTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and JPG formats are allowed'
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    // Instead of setting selectedFile, start cropping flow
    const reader = new FileReader()
    reader.onloadend = () => {
      setTempImageSrc(reader.result as string)
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
    
    // Reset input so same file can be selected again if cancelled
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert Blob back to File
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })
    
    setSelectedFile(file)
    
    // Create preview from cropped blob
    const objectUrl = URL.createObjectURL(croppedBlob)
    setPreview(objectUrl)
    
    setCropperOpen(false)
    setTempImageSrc(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const avatarData = await uploadAvatar(userId, selectedFile)
      
      dispatch(updateAvatar(avatarData))
      
      toast.success('Avatar uploaded successfully')
      
      setSelectedFile(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!currentAvatar) return

    setIsRemoving(true)
    try {
      await removeAvatar(userId)
      
      dispatch(updateAvatar(null))
      setPreview(null)
      setSelectedFile(null)
      
      toast.success('Avatar removed successfully')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to remove avatar')
    } finally {
      setIsRemoving(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreview(currentAvatar?.url || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Camera className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Profile Picture</h2>
            <p className="text-sm text-gray-500">Upload a profile picture (max 5MB, JPEG/PNG)</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Avatar Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200">
                {preview ? (
                  <img
                    src={preview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera className="w-16 h-16" />
                  </div>
                )}
              </div>
              {currentAvatar && !selectedFile && (
                <button
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-400 shadow-lg transition-colors"
                  title="Remove avatar"
                >
                  {isRemoving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <Upload className={`w-12 h-12 mx-auto mb-4 ${
              dragActive ? 'text-blue-500' : 'text-gray-400'
            }`} />
            
            <p className="text-gray-600 mb-2">
              Drag and drop your image here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-sm text-gray-500">
              JPEG, PNG or JPG (max. 5MB)
            </p>
          </div>

          {/* Action Buttons */}
          {selectedFile && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Avatar
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUploading}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        imageSrc={tempImageSrc}
        isOpen={cropperOpen}
        onClose={() => {
            setCropperOpen(false)
            setTempImageSrc(null)
        }}
        onCropComplete={handleCropComplete}
        aspectRatio={1} // Square for avatar
      />
    </div>
  )
}

export default AvatarUpload
