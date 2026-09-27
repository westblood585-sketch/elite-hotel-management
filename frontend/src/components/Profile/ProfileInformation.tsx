import React, { useState } from 'react'
import { User, Mail, Phone, Briefcase, Edit2, Save, X } from 'lucide-react'
import { updateUserProfile, type UserProfile } from '@/services/userApi'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { updateUser } from '@/redux/slices/authSlice'

interface ProfileInformationProps {
  profile: UserProfile
  onProfileUpdate: (profile: UserProfile) => void
}

interface FormErrors {
  fullName?: string
  phoneNumber?: string
}

const ProfileInformation: React.FC<ProfileInformationProps> = ({ profile, onProfileUpdate }) => {
  const dispatch = useDispatch()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^[0-9]{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10-15 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData({
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
    })
    setErrors({})
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const updatedProfile = await updateUserProfile(profile._id, formData)
      
      dispatch(updateUser({
        fullName: updatedProfile.fullName,
        phoneNumber: updatedProfile.phoneNumber,
      }))
      
      onProfileUpdate(updatedProfile)
      
      toast.success('Profile updated successfully')
      
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      receptionist: 'bg-blue-100 text-blue-800',
      housekeeper: 'bg-green-100 text-green-800',
    }
    return colors[role.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              <p className="text-sm text-gray-500">Manage your personal information</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {profile.avatar?.url ? (
                <img
                  src={profile.avatar.url}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile.fullName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4" />
              Full Name
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profile.fullName}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <div className="relative">
              <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profile.email}</p>
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Read-only
              </span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            {isEditing ? (
              <div>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                  maxLength={15}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profile.phoneNumber}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Briefcase className="w-4 h-4" />
              Role
            </label>
            <div className="px-4 py-2 bg-gray-50 rounded-lg">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(profile.role)}`}>
                {profile.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Verification Status
              </label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                profile.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {profile.isVerified ? '✓ Verified' : 'Pending'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Approval Status
              </label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                profile.isApproved === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : profile.isApproved === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {profile.isApproved.charAt(0).toUpperCase() + profile.isApproved.slice(1)}
              </span>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileInformation
