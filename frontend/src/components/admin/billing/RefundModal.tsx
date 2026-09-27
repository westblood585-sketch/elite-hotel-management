import { X, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { processRefund, type RefundData } from '@/services/adminApi'

interface RefundModalProps {
  isOpen: boolean
  onClose: () => void
  billingId: string
  totalAmount: number
  currency: string
  onSuccess: () => void
}

const RefundModal = ({
  isOpen,
  onClose,
  billingId,
  totalAmount,
  currency,
  onSuccess,
}: RefundModalProps) => {
  const [formData, setFormData] = useState<RefundData>({
    amount: totalAmount,
    reason: '',
  })
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refundPercentage = (formData.amount / totalAmount) * 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.amount <= 0) {
      setError('Refund amount must be greater than 0')
      return
    }

    if (formData.amount > totalAmount) {
      setError('Refund amount cannot exceed total amount')
      return
    }

    if (!formData.reason.trim()) {
      setError('Reason is required')
      return
    }

    if (!confirmed) {
      setError('Please confirm the refund before proceeding')
      return
    }

    setLoading(true)
    try {
      await processRefund(billingId, formData)
      onSuccess()
      onClose()
      setFormData({ amount: totalAmount, reason: '' })
      setConfirmed(false)
    } catch (err) {
      setError((err as Error).message || 'Failed to process refund')
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
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-white" size={24} />
                <h3 className="text-xl font-bold text-white">Process Refund</h3>
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

            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ Refunds are final and cannot be undone. Please verify the amount before
                proceeding.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600">
                  {totalAmount.toFixed(2)} {currency.toUpperCase()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {refundPercentage.toFixed(1)}% of total amount
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Refund <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Explain why this refund is being issued..."
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-refund"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="confirm-refund" className="text-sm text-gray-700">
                  I confirm this refund request
                </label>
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
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={loading || !confirmed}
              >
                {loading ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RefundModal
