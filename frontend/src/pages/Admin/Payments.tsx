import { useState, useEffect } from 'react'
import { DollarSign, Search, CreditCard, TrendingUp, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import EmptyState from '@/components/common/EmptyState'
import { fetchPayments, type Payment } from '@/services/adminApi'
import { format } from 'date-fns'
import ExportButton, { type ExportFormat, type ExportScope } from '@/components/admin/ExportButton'
import { exportToCSV, exportToExcel, formatDataForExport, generateFilename } from '@/utils/exportData'
import SortableTableHeader from '@/components/admin/SortableTableHeader'
import { useSorting } from '@/Hooks/useSorting'
import { motion, AnimatePresence } from 'framer-motion'

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [providerFilter, setProviderFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20

  // Sorting state
  const { sortConfigs, handleSort } = useSorting([], 'payments')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadPayments()
  }, [currentPage, debouncedSearch, statusFilter, providerFilter, sortConfigs])

  const loadPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchPayments({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter || undefined,
        provider: providerFilter || undefined,
        search: debouncedSearch || undefined,
        sort: sortConfigs
      })
      setPayments(response.data)
      setTotalItems(response.total)
      setTotalPages(Math.ceil(response.total / itemsPerPage))
    } catch (err: any) {
      console.error('Error fetching payments:', err)
      setError(err.response?.data?.message || 'Failed to load payment records')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      initiated: 'bg-blue-100 text-blue-700 border-blue-200',
      succeeded: 'bg-green-100 text-green-700 border-green-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      refunded: 'bg-purple-100 text-purple-700 border-purple-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      stripe: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      razorpay: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    }
    return colors[provider] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
        if(i <= 0) continue;
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            i === currentPage
              ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-110'
              : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          {i}
        </button>
      )
    }

    return buttons
  }

  const handleExport = async (exportFormat: ExportFormat, scope: ExportScope) => {
    let dataToExport: Payment[] = []
    
    try {
      if (scope === 'current') {
        dataToExport = payments
      } else if (scope === 'filtered' || scope === 'all') {
        const response = await fetchPayments({
          limit: 10000,
          status: scope === 'all' ? undefined : (statusFilter || undefined),
          provider: scope === 'all' ? undefined : (providerFilter || undefined),
          search: scope === 'all' ? undefined : (debouncedSearch || undefined),
          sort: sortConfigs
        })
        dataToExport = response.data
      }
      
      const formatted = formatDataForExport(dataToExport, {
        'Transaction ID': (p) => p._id.slice(-8).toUpperCase(),
        'Reservation': (p) => p.reservationId?.slice(-6) || 'N/A',
        'Guest Email': (p) => p.guestContact?.email || '',
        'Amount': (p) => `${p.currency} ${p.amount}`,
        'Provider': 'provider',
        'Status': 'status',
        'Date': (p) => p.createdAt ? format(new Date(p.createdAt), 'yyyy-MM-dd HH:mm') : 'N/A'
      })
      
      const filename = generateFilename('payments')
      
      if (exportFormat === 'csv') {
        exportToCSV(formatted, filename)
      } else {
        exportToExcel(formatted, filename, 'Payments')
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data')
    }
  }

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

      <div className="max-w-[1920px] mx-auto relative z-10 space-y-6 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-2 font-medium">Track and manage payment transactions and revenue.</p>
        </div>
        <div className="flex items-center gap-3">
          {payments.length > 0 && (
            <ExportButton onExport={handleExport} loading={loading} />
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <DollarSign size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Succeeded</p>
              <p className="text-2xl font-bold text-gray-900">
                {payments.filter(p => p.status === 'succeeded').length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-gray-900">
                {payments.filter(p => p.status === 'failed').length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <CreditCard size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Refunded</p>
              <p className="text-2xl font-bold text-gray-900">
                {payments.filter(p => p.status === 'refunded').length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by guest email or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder-gray-400 font-medium transition-all"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[160px]"
            >
                <option value="">All Status</option>
                <option value="initiated">Initiated</option>
                <option value="succeeded">Succeeded</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
            </select>
            <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[160px]"
            >
                <option value="">All Providers</option>
                <option value="stripe">Stripe</option>
                <option value="razorpay">Razorpay</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50/50 backdrop-blur-sm border border-red-200 rounded-2xl p-6 flex justify-center">
             <EmptyState
                title="Error loading payments"
                description={error}
                icon={AlertTriangle}
                action={{ label: "Retry", onClick: loadPayments }}
             />
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden min-h-[400px]">
        {loading ? (
             <TableSkeleton rows={10} />
        ) : payments.length === 0 ? (
            <div className="flex items-center justify-center h-[400px]">
                <EmptyState
                    title={searchQuery || statusFilter || providerFilter ? 'No payments found' : 'No payment history'}
                    description={searchQuery || statusFilter || providerFilter
                        ? "Try adjusting your filters or search terms."
                        : "Payment transactions will appear here."}
                    icon={DollarSign}
                />
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200/50 bg-gray-50/50">
                <tr>
                  <SortableTableHeader
                    column="_id"
                    label="Transaction"
                    sortConfigs={sortConfigs}
                    onSort={handleSort}
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  />
                  <SortableTableHeader
                    column="guestContact.email"
                    label="Guest"
                    sortConfigs={sortConfigs}
                    onSort={handleSort}
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  />
                  <SortableTableHeader
                    column="amount"
                    label="Amount"
                    sortConfigs={sortConfigs}
                    onSort={handleSort}
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  />
                  <SortableTableHeader
                    column="provider"
                    label="Provider"
                    sortConfigs={sortConfigs}
                    onSort={handleSort}
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  />
                  <SortableTableHeader
                    column="status"
                    label="Status"
                    sortConfigs={sortConfigs}
                    onSort={handleSort}
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  />
                  <SortableTableHeader
                    column="createdAt"
                    label="Date"
                    sortConfigs={sortConfigs}
                    onSort={handleSort}
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                {payments.map((payment, idx) => (
                  <motion.tr 
                    key={payment._id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-white/80 transition-colors"
                  >
                    <td className="px-6 py-2 whitespace-nowrap">
                      <div className="font-bold text-gray-900 bg-white border border-gray-200 px-2 py-1 rounded-md text-sm inline-block">
                        #{payment._id.slice(-8).toUpperCase()}
                      </div>
                      {payment.reservationId && (
                        <div className="text-xs text-gray-500 mt-1 font-medium">
                          Res: {payment.reservationId.slice(-6)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate" title={payment.guestContact?.email || ''}>
                        {payment.guestContact?.email || 'N/A'}
                      </div>
                      {payment.guestContact?.phoneNumber && (
                        <div className="text-xs text-gray-500 font-mono">
                          {payment.guestContact.phoneNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 font-mono">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize border bg-opacity-50 ${getProviderColor(payment.provider).replace('bg-', 'border-').replace('text-', 'text-')}`}>
                         <span className={`px-2 py-0.5 rounded-full ${getProviderColor(payment.provider)}`}>
                            {payment.provider}
                         </span>
                      </span>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize border bg-opacity-50 ${getStatusColor(payment.status).replace('bg-', 'border-').replace('text-', 'text-')}`}>
                        <span className={`px-2 py-0.5 rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {payment.createdAt ? format(new Date(payment.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                  </motion.tr>
                ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white/50 border border-white/60 rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm">
          <div className="text-sm font-medium text-gray-500">
             Page <span className="text-gray-900 font-bold">{currentPage}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
               onClick={() => handlePageChange(currentPage - 1)}
               disabled={currentPage === 1}
               className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
               <ChevronLeft size={18} />
            </button>

            <div className="flex gap-1">
               {renderPaginationButtons()}
            </div>

            <button
               onClick={() => handlePageChange(currentPage + 1)}
               disabled={currentPage === totalPages}
               className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
               <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Payments
