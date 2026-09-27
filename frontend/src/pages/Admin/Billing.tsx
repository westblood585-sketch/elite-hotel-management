import { useState, useEffect } from 'react'
import { DollarSign, Search, ChevronLeft, ChevronRight, AlertTriangle, Eye } from 'lucide-react'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import EmptyState from '@/components/common/EmptyState'
import { fetchBillings, type Billing } from '@/services/adminApi'
import BillingDetailModal from '@/components/admin/BillingDetailModal'
import ExportButton, { type ExportFormat, type ExportScope } from '@/components/admin/ExportButton'
import { exportToCSV, exportToExcel, formatDataForExport, generateFilename } from '@/utils/exportData'
import { format } from 'date-fns'
import SortableTableHeader from '@/components/admin/SortableTableHeader'
import { useSorting } from '@/Hooks/useSorting'
import { motion, AnimatePresence } from 'framer-motion'

const Billing = () => {
  const [billings, setBillings] = useState<Billing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const itemsPerPage = 20

  // Sorting state
  const { sortConfigs, handleSort } = useSorting([], 'billing')
  
  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadBillings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchBillings({
        status: statusFilter || undefined,
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        sort: sortConfigs
      })
      setBillings(response.data)
      setTotalItems(response.total)
      setTotalPages(Math.ceil(response.total / itemsPerPage))
    } catch (err: any) {
      console.error('Error fetching billings:', err)
      setError(err.response?.data?.message || 'Failed to load billing records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBillings()
  }, [currentPage, debouncedSearch, statusFilter, sortConfigs])

  const handleViewDetail = (billing: Billing) => {
    setSelectedBilling(billing)
    setDetailModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      paid: 'bg-green-100 text-green-700 border-green-200',
      refunded: 'bg-blue-100 text-blue-700 border-blue-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
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
    let dataToExport: Billing[] = []
    
    try {
      if (scope === 'current') {
        dataToExport = billings
      } else if (scope === 'filtered' || scope === 'all') {
        const response = await fetchBillings({
          limit: 10000,
          status: scope === 'all' ? undefined : (statusFilter || undefined),
          search: scope === 'all' ? undefined : (debouncedSearch || undefined),
          sort: sortConfigs
        })
        dataToExport = response.data
      }
      
      const formatted = formatDataForExport(dataToExport, {
        'Invoice ID': (b) => b._id.slice(-8).toUpperCase(),
        'Guest Email': (b) => b.guestContact?.email || '',
        'Amount': (b) => `${b.currency} ${b.amount.toFixed(2)}`,
        'Status': 'status',
        'Created': (b) => format(new Date(b.createdAt), 'yyyy-MM-dd'),
        'Ledger Entries': (b) => b.ledger?.length || 0
      })
      
      const filename = generateFilename('billing')
      
      if (exportFormat === 'csv') {
        exportToCSV(formatted, filename)
      } else {
        exportToExcel(formatted, filename, 'Billing')
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data')
    }
  }

  if (loading && billings.length === 0) {
    return <TableSkeleton rows={10} />
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <EmptyState 
           title="Unable to load billings" 
           description={error || "Something went wrong while fetching the billing records."}
           icon={AlertTriangle}
           action={{ label: "Retry", onClick: () => loadBillings() }}
        />
      </div>
    )
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

      <div className="max-w-[1920px] mx-auto relative z-10 space-y-6 px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900">Billing & Invoices</h1>
            <p className="text-gray-500 mt-2 font-medium">View and manage all billing records and transactions.</p>
          </div>
          <div className="flex items-center gap-3">
            {billings.length > 0 && (
                <ExportButton onExport={handleExport} loading={loading} />
            )}
          </div>
        </div>

      {/* Search and Filter Bar */}
      <div className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by guest email, invoice ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder-gray-400 font-medium transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full md:w-auto px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[200px]"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Pagination Info */}
      {totalItems > 0 && (
        <div className="text-sm font-medium text-gray-500 px-2">
          Showing <span className="text-gray-900 font-bold">{startItem}-{endItem}</span> of <span className="text-gray-900 font-bold">{totalItems}</span> billing records
        </div>
      )}

      {billings.length === 0 ? (
        <div className="flex items-center justify-center h-[400px] bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl">
            <EmptyState
            title={searchQuery || statusFilter ? 'No billing records found' : 'No billings yet'}
            description={searchQuery || statusFilter
                ? "Try adjusting your search or filters to find what you're looking for." 
                : "Billing records will appear here once transactions are created."}
            icon={DollarSign}
            />
        </div>
      ) : (
        <>
          <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden min-h-[400px]">
             <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="border-b border-gray-200/50 bg-gray-50/50">
                    <tr>
                    <SortableTableHeader
                        column="_id"
                        label="Invoice ID"
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
                        column="currency"
                        label="Currency"
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
                        label="Created"
                        sortConfigs={sortConfigs}
                        onSort={handleSort}
                        className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    />
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    <AnimatePresence>
                    {billings.map((billing, idx) => (
                    <motion.tr 
                        key={billing._id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-white/80 transition-colors"
                    >
                        <td className="px-6 py-2 whitespace-nowrap">
                            <span className="font-bold text-gray-900 bg-white border border-gray-200 px-2 py-1 rounded-md text-sm">
                                #{billing._id.slice(-8).toUpperCase()}
                            </span>
                        </td>
                        <td className="px-6 py-2 text-sm font-medium text-gray-900 max-w-[200px] truncate" title={billing.guestContact?.email || ''}>
                            {billing.guestContact?.email || 'N/A'}
                        </td>
                        <td className="px-6 py-2 text-sm font-bold text-gray-900 font-mono">
                            {billing.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-2 text-sm text-gray-600 uppercase font-medium">
                            {billing.currency}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border bg-opacity-50 ${getStatusColor(billing.status).replace('bg-', 'border-').replace('text-', 'text-')}`}>
                                <span className={`px-2 py-0.5 rounded-full ${getStatusColor(billing.status)}`}>
                                    {billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                                </span>
                            </span>
                        </td>
                        <td className="px-6 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                            {new Date(billing.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-2 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleViewDetail(billing)}
                                    className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    title="View Details"
                                >
                                    <Eye size={16} />
                                </button>
                            </div>
                        </td>
                    </motion.tr>
                    ))}
                    </AnimatePresence>
                </tbody>
                </table>
             </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white/50 border-t border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
        </>
      )}

      <BillingDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedBilling(null)
        }}
        billing={selectedBilling}
      />
      </div>
    </div>
  )
}

export default Billing
