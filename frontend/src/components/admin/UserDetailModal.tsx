import { X, User as UserIcon, Mail, Phone, Shield, CheckCircle, XCircle } from 'lucide-react'
import { type User } from '@/services/adminApi'

interface UserDetailModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

const UserDetailModal = ({ isOpen, onClose, user }: UserDetailModalProps) => {
  if (!isOpen || !user) return null

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      receptionist: 'bg-blue-100 text-blue-700',
      Housekeeper: 'bg-green-100 text-green-700',
      user: 'bg-gray-100 text-gray-700',
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  const getApprovalColor = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <p className="text-sm text-gray-600 mt-1">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Picture */}
          {user.avatar?.url && (
            <div className="flex justify-center">
              <img
                src={user.avatar.url}
                alt={user.fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
            </div>
          )}

          {/* Status Badges */}
          <div className="flex gap-3 justify-center">
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </span>
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${getApprovalColor(user.isApproved)}`}>
              {user.isApproved}
            </span>
            {user.isVerified && (
              <span className="px-4 py-2 text-sm font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle size={16} />
                Verified
              </span>
            )}
          </div>

          {/* Personal Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserIcon size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-base font-medium text-gray-900">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <Mail size={16} />
                  {user.email}
                </p>
              </div>
              {user.phoneNumber && (
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                    <Phone size={16} />
                    {user.phoneNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-base font-medium text-gray-900 capitalize">{user.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Approval Status</p>
                <p className="text-base font-medium text-gray-900 capitalize">{user.isApproved}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Verification</p>
                <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                  {user.isVerified ? (
                    <>
                      <CheckCircle size={16} className="text-green-600" />
                      Verified
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-red-600" />
                      Not Verified
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal
