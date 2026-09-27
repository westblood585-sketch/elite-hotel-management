import { useState, useEffect } from 'react'
import { X, Calendar, User, AlertCircle } from 'lucide-react'
import { type Reservation, updateReservation } from '@/services/adminApi'

interface ReservationFormModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: Reservation | null
  onSuccess: () => void
}

const ReservationFormModal = ({
  isOpen,
  onClose,
  reservation,
  onSuccess,
}: ReservationFormModalProps) => {
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (reservation) {
      setFormData({
        checkIn: new Date(reservation.checkIn).toISOString().split('T')[0],
        checkOut: new Date(reservation.checkOut).toISOString().split('T')[0],
      })
    }
  }, [reservation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reservation) return

    setLoading(true)
    setError(null)

    try {
      await updateReservation(reservation._id, {
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error updating reservation:', err)
      setError(err.response?.data?.message || 'Failed to update reservation')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !reservation) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Reservation</h2>
            <p className="text-sm text-gray-500 mt-1">Code: {reservation.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Guest Info (Read Only) */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User size={16} />
              Guest Information
            </div>
            <div className="text-sm text-gray-600 pl-6">
              <p>{reservation.guestContact.email}</p>
              {reservation.guestContact.phone && <p>{reservation.guestContact.phone}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-In Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  required
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-Out Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  required
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReservationFormModal
