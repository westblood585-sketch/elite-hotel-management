import { X } from 'lucide-react'
import { useState } from 'react'
import { addCredit, type CreditData } from '@/services/adminApi'

interface AddCreditModalProps {
  isOpen: boolean
  onClose: () => void
  billingId: string
  onSuccess: () => void
}

const AddCreditModal = ({ isOpen, onClose, billingId, onSuccess }: AddCreditModalProps) => {
  const [formData, setFormData] = useState<CreditData>({
    amount: 0,
    reason: '',
    note: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    if (!formData.reason.trim()) {
      setError('Reason is required')
      return
    }

    setLoading(true)
    try {
      await addCredit(billingId, formData)
      onSuccess()
      onClose()
      setFormData({ amount: 0, reason: '', note: '' })
    } catch (err) {
      setError((err as Error).message || 'Failed to add credit')
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
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Add Credit/Discount</h3>
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="First-time guest discount">First-time guest discount</option>
                  <option value="Loyalty points redemption">Loyalty points redemption</option>
                  <option value="Compensation for inconvenience">
                    Compensation for inconvenience
                  </option>
                  <option value="Promotional discount">Promotional discount</option>
                  <option value="Service recovery">Service recovery</option>
                  <option value="Price adjustment">Price adjustment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Note (Optional)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional details..."
                />
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Credit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddCreditModal
