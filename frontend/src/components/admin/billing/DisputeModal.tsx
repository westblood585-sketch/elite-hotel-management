import { X, AlertOctagon, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  flagDispute,
  resolveDispute,
  getBillingDisputes,
  type Dispute,
} from '@/services/adminApi'

interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  billingId: string
  onSuccess: () => void
}

const DisputeModal = ({ isOpen, onClose, billingId, onSuccess }: DisputeModalProps) => {
  const [view, setView] = useState<'list' | 'create' | 'resolve'>('list')
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [createData, setCreateData] = useState({ reason: '', createdBy: 'admin' })
  const [resolveData, setResolveData] = useState({
    resolutionNote: '',
    resolvedBy: 'admin',
    status: 'resolved' as 'resolved' | 'rejected',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadDisputes()
    }
  }, [isOpen, billingId])

  const loadDisputes = async () => {
    try {
      const data = await getBillingDisputes(billingId)
      setDisputes(data)
      if (data.length === 0) {
        setView('create')
      } else {
        setView('list')
      }
    } catch (err) {
      console.error('Failed to load disputes:', err)
      setView('create')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!createData.reason.trim()) {
      setError('Reason is required')
      return
    }

    setLoading(true)
    try {
      await flagDispute(billingId, createData.reason, createData.createdBy)
      await loadDisputes()
      setCreateData({ reason: '', createdBy: 'admin' })
      onSuccess()
    } catch (err) {
      setError((err as Error).message || 'Failed to flag dispute')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedDispute || !resolveData.resolutionNote.trim()) {
      setError('Resolution note is required')
      return
    }

    setLoading(true)
    try {
      await resolveDispute(
        billingId,
        selectedDispute._id,
        resolveData.resolutionNote,
        resolveData.resolvedBy,
        resolveData.status
      )
      await loadDisputes()
      setView('list')
      setSelectedDispute(null)
      setResolveData({ resolutionNote: '', resolvedBy: 'admin', status: 'resolved' })
      onSuccess()
    } catch (err) {
      setError((err as Error).message || 'Failed to resolve dispute')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      rejected: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

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

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-10">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="text-white" size={24} />
                <h3 className="text-xl font-bold text-white">Dispute Management</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="text-white" size={24} />
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* List View */}
            {view === 'list' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Dispute History</h4>
                  <button
                    onClick={() => setView('create')}
                    className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Flag New Dispute
                  </button>
                </div>

                {disputes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No disputes found for this billing
                  </p>
                ) : (
                  <div className="space-y-3">
                    {disputes.map((dispute) => (
                      <div
                        key={dispute._id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                              dispute.status
                            )}`}
                          >
                            {dispute.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {(dispute.status === 'open' || dispute.status === 'under_review') && (
                            <button
                              onClick={() => {
                                setSelectedDispute(dispute)
                                setView('resolve')
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                        <p className="text-gray-900 font-medium mb-1">{dispute.reason}</p>
                        {dispute.resolutionNote && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Resolution:</strong> {dispute.resolutionNote}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {new Date(dispute.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create View */}
            {view === 'create' && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispute Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={createData.reason}
                    onChange={(e) =>
                      setCreateData({ ...createData, reason: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={4}
                    placeholder="Describe the issue with this billing..."
                    required
                  />
                </div>

                <div className="flex gap-3">
                  {disputes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setView('list')}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Back to List
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Flagging...' : 'Flag Dispute'}
                  </button>
                </div>
              </form>
            )}

            {/* Resolve View */}
            {view === 'resolve' && selectedDispute && (
              <form onSubmit={handleResolve} className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-1">Dispute Reason:</p>
                  <p className="text-sm text-gray-700">{selectedDispute.reason}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setResolveData({ ...resolveData, status: 'resolved' })}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        resolveData.status === 'resolved'
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <span className="font-medium">Resolved</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolveData({ ...resolveData, status: 'rejected' })}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        resolveData.status === 'rejected'
                          ? 'border-gray-600 bg-gray-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <X size={18} className="text-gray-600" />
                        <span className="font-medium">Rejected</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resolution Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={resolveData.resolutionNote}
                    onChange={(e) =>
                      setResolveData({ ...resolveData, resolutionNote: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={4}
                    placeholder="Explain how this dispute was resolved..."
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setView('list')
                      setSelectedDispute(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Resolution'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DisputeModal
