import {
  X,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Plus,
  Download,
  Send,
  Archive,
  AlertOctagon,
} from 'lucide-react'
import { useState } from 'react'
import { type Billing, downloadInvoice, sendInvoice, archiveBilling } from '@/services/adminApi'
import AddChargeModal from './billing/AddChargeModal'
import AddCreditModal from './billing/AddCreditModal'
import RefundModal from './billing/RefundModal'
import AdjustmentModal from './billing/AdjustmentModal'
import DisputeModal from './billing/DisputeModal'

interface BillingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  billing: Billing | null
  onRefresh?: () => void
}

const BillingDetailModal = ({
  isOpen,
  onClose,
  billing,
  onRefresh,
}: BillingDetailModalProps) => {
  const [showChargeModal, setShowChargeModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  if (!isOpen || !billing) return null

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      refunded: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700',
      void: 'bg-gray-100 text-gray-700',
      archived: 'bg-gray-200 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const handleSuccess = () => {
    setActionError('')
    if (onRefresh) {
      onRefresh()
    }
  }

  const handleDownloadInvoice = async () => {
    setActionLoading(true)
    setActionError('')
    try {
      const blob = await downloadInvoice(billing._id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice_${billing._id.slice(-8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setActionError('Failed to download invoice')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendInvoice = async () => {
    setActionLoading(true)
    setActionError('')
    try {
      await sendInvoice(billing._id)
      alert('Invoice sent successfully!')
    } catch (err) {
      setActionError('Failed to send invoice')
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this billing? This action cannot be undone.')) {
      return
    }

    setActionLoading(true)
    setActionError('')
    try {
      await archiveBilling(billing._id)
      handleSuccess()
      onClose()
    } catch (err) {
      setActionError('Failed to archive billing')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-md transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          ></div>

          {/* Center positioning trick */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          {/* Modal panel */}
          <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full z-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <DollarSign className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Invoice Details</h3>
                    <p className="text-blue-100 text-sm">
                      #{billing._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="text-white" size={24} />
                </button>
              </div>
            </div>

            {/* Action Error */}
            {actionError && (
              <div className="px-6 pt-4">
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {actionError}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!billing.archived && billing.status !== 'archived' && (
              <div className="px-6 pt-4 pb-2 bg-gray-50 border-b">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowChargeModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    disabled={actionLoading}
                  >
                    <Plus size={16} />
                    Add Charge
                  </button>
                  <button
                    onClick={() => setShowCreditModal(true)}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                    disabled={actionLoading}
                  >
                    <Plus size={16} />
                    Add Credit
                  </button>
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    disabled={actionLoading || billing.status === 'refunded'}
                  >
                    Process Refund
                  </button>
                  <button
                    onClick={() => setShowAdjustmentModal(true)}
                    className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    disabled={actionLoading}
                  >
                    Add Adjustment
                  </button>
                  <button
                    onClick={handleSendInvoice}
                    className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    disabled={actionLoading}
                  >
                    <Send size={16} />
                    Send Invoice
                  </button>
                  <button
                    onClick={handleDownloadInvoice}
                    className="px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1"
                    disabled={actionLoading}
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1"
                    disabled={actionLoading}
                  >
                    <AlertOctagon size={16} />
                    Disputes
                  </button>
                  <button
                    onClick={handleArchive}
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                    disabled={actionLoading}
                  >
                    <Archive size={16} />
                    Archive
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Status and Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      billing.status
                    )}`}
                  >
                    {billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {billing.amount.toFixed(2)}{' '}
                    <span className="text-sm text-gray-600 uppercase">{billing.currency}</span>
                  </p>
                </div>
              </div>

              {/* Guest Information */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <User size={18} className="text-gray-500" />
                  <h4 className="font-semibold text-gray-900">Guest Information</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">
                      {billing.guestContact?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">
                      {billing.guestContact?.phoneNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment & Reservation IDs */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={18} className="text-gray-500" />
                  <h4 className="font-semibold text-gray-900">Transaction Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Payment ID</p>
                    <p className="font-mono text-xs text-gray-900">{billing.paymentId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reservation ID</p>
                    <p className="font-mono text-xs text-gray-900">{billing.reservationId}</p>
                  </div>
                </div>
              </div>

              {/* Ledger History */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={18} className="text-gray-500" />
                  <h4 className="font-semibold text-gray-900">Transaction History</h4>
                </div>
                <div className="space-y-3">
                  {billing.ledger.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{entry.type}</p>
                        {entry.note && <p className="text-sm text-gray-600">{entry.note}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {entry.amount.toFixed(2)} {billing.currency.toUpperCase()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created At</p>
                  <p className="font-medium text-gray-900">
                    {new Date(billing.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {new Date(billing.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddChargeModal
        isOpen={showChargeModal}
        onClose={() => setShowChargeModal(false)}
        billingId={billing._id}
        onSuccess={handleSuccess}
      />
      <AddCreditModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        billingId={billing._id}
        onSuccess={handleSuccess}
      />
      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        billingId={billing._id}
        totalAmount={billing.amount}
        currency={billing.currency}
        onSuccess={handleSuccess}
      />
      <AdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        billingId={billing._id}
        onSuccess={handleSuccess}
      />
      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        billingId={billing._id}
        onSuccess={handleSuccess}
      />
    </>
  )
}

export default BillingDetailModal

