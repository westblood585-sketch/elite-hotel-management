import { X, Calendar, User, DollarSign, MapPin } from 'lucide-react'
import { type Reservation } from '@/services/adminApi'

interface ReservationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: Reservation | null
}

const ReservationDetailModal = ({ isOpen, onClose, reservation }: ReservationDetailModalProps) => {
  if (!isOpen || !reservation) return null

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Confirmed: 'bg-green-100 text-green-700',
      PendingPayment: 'bg-yellow-100 text-yellow-700',
      CheckedIn: 'bg-blue-100 text-blue-700',
      CheckedOut: 'bg-gray-100 text-gray-700',
      Cancelled: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const nights = Math.ceil(
    (new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reservation Details</h2>
            <p className="text-sm text-gray-600 mt-1">Code: {reservation.code}</p>
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
          {/* Status */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Status</h3>
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(reservation.status)}`}>
              {reservation.status}
            </span>
          </div>

          {/* Guest Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Guest Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-base font-medium text-gray-900">{reservation.guestContact.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-base font-medium text-gray-900">{reservation.guestContact.phone || reservation.guestContact.email}</p>
              </div>
            </div>
          </div>

          {/* Room Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Room Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Room Number</p>
                <p className="text-base font-medium text-gray-900">{reservation.roomId.number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Room Type</p>
                <p className="text-base font-medium text-gray-900">{reservation.roomId.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Room</p>
                <p className="text-base font-medium text-gray-900">Room {reservation.roomId.number} - {reservation.roomId.type}</p>
              </div>
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={20} className="text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Stay Details</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Check-In</p>
                <p className="text-base font-medium text-gray-900">
                  {new Date(reservation.checkIn).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Check-Out</p>
                <p className="text-base font-medium text-gray-900">
                  {new Date(reservation.checkOut).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-base font-medium text-gray-900">{nights} night{nights > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={20} className="text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600">${reservation.totalAmount}</p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 pt-4 border-t">
            <div>
              <p>Created</p>
              <p className="text-gray-900">
                {reservation.createdAt ? new Date(reservation.createdAt).toLocaleString() : '-'}
              </p>
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

export default ReservationDetailModal
