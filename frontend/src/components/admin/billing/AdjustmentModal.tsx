import { X, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { addAdjustment, type AdjustmentData } from '@/services/adminApi'

interface AdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  billingId: string
  onSuccess: () => void
}

const AdjustmentModal = ({ isOpen, onClose, billingId, onSuccess }: AdjustmentModalProps) => {
  const [formData, setFormData] = useState<AdjustmentData>({
    amount: 0,
    note: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.amount === 0) {
      setError('Adjustment amount cannot be zero')
      return
    }

    if (!formData.note.trim()) {
      setError('Note is required for manual adjustments')
      return
    }

    setLoading(true)
    try {
      await addAdjustment(billingId, formData)
      onSuccess()
      onClose()
      setFormData({ amount: 0, note: '' })
    } catch (err) {
      setError((err as Error).message || 'Failed to add adjustment')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Center positioning trick */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full z-10">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-white" size={24} />
                <h3 className="text-xl font-bold text-white">Manual Adjustment</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="text-white" size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>ℹ️ Admin Approval Required</strong>
                <br />
                Manual adjustments require a detailed explanation and will be logged for audit
                purposes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00 (positive or negative)"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter a positive value to add, or negative to subtract
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Explanation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  placeholder="Provide a detailed explanation for this manual adjustment. Include reason, authorization, and any relevant context..."
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  This note will be permanently recorded in the audit log
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdjustmentModal
