import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, CheckCircle, XCircle, Edit, Search, ChevronLeft, ChevronRight, DoorOpen, LogOut, AlertTriangle, Calendar } from 'lucide-react'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import EmptyState from '@/components/common/EmptyState'
import {
  fetchReservations,
  confirmReservation,
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  type Reservation,
} from '@/services/adminApi'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import ReservationDetailModal from '@/components/admin/ReservationDetailModal'
import ReservationFormModal from '@/components/admin/ReservationFormModal'
import ExportButton, { type ExportFormat, type ExportScope } from '@/components/admin/ExportButton'
import { exportToCSV, exportToExcel, formatDataForExport, generateFilename } from '@/utils/exportData'
import { format } from 'date-fns'
import SortableTableHeader from '@/components/admin/SortableTableHeader'
import { useSorting } from '@/Hooks/useSorting'
import { motion, AnimatePresence } from 'framer-motion'

const Reservations = () => {
  const [searchParams] = useSearchParams()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20

  // Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [reservationToEdit, setReservationToEdit] = useState<Reservation | null>(null)

  // Sorting
  const { sortConfigs, handleSort } = useSorting([{ column: 'createdAt', direction: 'desc' }])

  // Update searchQuery when URL changes
  useEffect(() => {
    const query = searchParams.get('search')
    if (query) {
      setSearchQuery(query)
    }
  }, [searchParams])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  // Fetch reservations from API
  const loadReservations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchReservations({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort: sortConfigs
      })
      setReservations(response.data)
      setTotalItems(response.total)
      setTotalPages(Math.ceil(response.total / itemsPerPage))
    } catch (err: any) {
      console.error('Error fetching reservations:', err)
      setError(err.response?.data?.message || 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReservations()
  }, [currentPage, debouncedSearch, statusFilter, sortConfigs])

  const handleConfirm = async (id: string) => {
    try {
      await confirmReservation(id)
      loadReservations()
      alert('Reservation confirmed successfully')
    } catch (err: any) {
      console.error('Error confirming reservation:', err)
      alert(err.response?.data?.message || 'Failed to confirm reservation')
    }
  }

  const handleCheckIn = async (id: string) => {
    if (!window.confirm('Are you sure you want to check in this guest?')) return
    try {
      await checkInReservation(id)
      loadReservations()
      alert('Guest checked in successfully')
    } catch (err: any) {
      console.error('Error checking in:', err)
      alert(err.response?.data?.message || 'Failed to check in guest')
    }
  }

  const handleCheckOut = async (id: string) => {
    if (!window.confirm('Are you sure you want to check out this guest?')) return
    try {
      await checkOutReservation(id)
      loadReservations()
      alert('Guest checked out successfully')
    } catch (err: any) {
      console.error('Error checking out:', err)
      alert(err.response?.data?.message || 'Failed to check out guest')
    }
  }

  const handleCancel = (reservation: Reservation) => {
    setReservationToCancel(reservation)
    setCancelModalOpen(true)
  }

  const confirmCancel = async () => {
    if (!reservationToCancel) return
    
    try {
      await cancelReservation(reservationToCancel._id)
      loadReservations()
      setReservationToCancel(null)
    } catch (err: any) {
      console.error('Error cancelling reservation:', err)
      alert(err.response?.data?.message || 'Failed to cancel reservation')
    }
  }

  const handleViewDetail = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setDetailModalOpen(true)
  }

  const handleEdit = (reservation: Reservation) => {
    setReservationToEdit(reservation)
    setEditModalOpen(true)
  }

  const handleEditSuccess = async () => {
    loadReservations()
  }

  const handleExport = async (exportFormat: ExportFormat, scope: ExportScope) => {
    let dataToExport: Reservation[] = []
    
    try {
      if (scope === 'current') {
        dataToExport = reservations
      } else if (scope === 'filtered' || scope === 'all') {
        const response = await fetchReservations({
          limit: 10000,
          search: scope === 'all' ? undefined : (debouncedSearch || undefined),
          sort: sortConfigs
        })
        dataToExport = response.data
      }
      
      const formatted = formatDataForExport(dataToExport, {
        'Code': 'code',
        'Guest Email': (r) => r.guestContact?.email || 'N/A',
        'Room': (r) => r.roomId ? `Room ${r.roomId.number} (${r.roomId.type})` : 'N/A',
        'Check-In': (r) => r.checkIn ? format(new Date(r.checkIn), 'yyyy-MM-dd') : 'N/A',
        'Check-Out': (r) => r.checkOut ? format(new Date(r.checkOut), 'yyyy-MM-dd') : 'N/A',
        'Status': 'status',
        'Total Amount': (r) => `$${r.totalAmount || 0}`,
        'Created At': (r) => r.createdAt ? format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm') : ''
      })
      
      const filename = generateFilename('reservations')
      
      if (exportFormat === 'csv') {
        exportToCSV(formatted, filename)
      } else {
        exportToExcel(formatted, filename, 'Reservations')
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data')
    }
  }

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

  if (loading && reservations.length === 0) {
    return <TableSkeleton rows={10} />
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <EmptyState 
           title="Unable to load reservations" 
           description={error || "Something went wrong while fetching the reservation list."}
           icon={AlertTriangle}
           action={{ label: "Retry", onClick: () => loadReservations() }}
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
            <h1 className="text-4xl font-serif font-bold text-gray-900">Reservations</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage and track guest reservations and occupancy.</p>
          </div>
          <div className="flex items-center gap-3">
            {reservations.length > 0 && (
                <ExportButton onExport={handleExport} loading={loading} />
            )}
          </div>
        </div>

      {/* Filter Bar */}
      <div className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by reservation code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder-gray-400 font-medium transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[200px]"
        >
          <option value="all">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="PendingPayment">Pending Payment</option>
          <option value="CheckedIn">Checked In</option>
          <option value="CheckedOut">Checked Out</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Pagination Info */}
      {totalItems > 0 && (
        <div className="text-sm font-medium text-gray-500 px-2">
            Showing <span className="text-gray-900 font-bold">{startItem}-{endItem}</span> of <span className="text-gray-900 font-bold">{totalItems}</span> reservations
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="flex items-center justify-center h-[400px] bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl">
            <EmptyState
            title={searchQuery || statusFilter !== 'all' ? 'No reservations found' : 'No reservations yet'}
            description={searchQuery || statusFilter !== 'all' 
                ? "Try adjusting your search or filters to find what you're looking for." 
                : "New reservations will appear here once guests start booking."}
            icon={Calendar}
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
                        column="code"
                        label="Code"
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
                        column="roomId"
                        label="Room"
                        sortConfigs={sortConfigs}
                        onSort={handleSort}
                        className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    />
                    <SortableTableHeader
                        column="checkIn"
                        label="Check-In"
                        sortConfigs={sortConfigs}
                        onSort={handleSort}
                        className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    />
                    <SortableTableHeader
                        column="checkOut"
                        label="Check-Out"
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
                        column="totalAmount"
                        label="Total"
                        sortConfigs={sortConfigs}
                        onSort={handleSort}
                        className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    />
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    <AnimatePresence>
                    {reservations.map((reservation, idx) => (
                    <motion.tr 
                        key={reservation._id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-white/80 transition-colors"
                    >
                        <td className="px-6 py-2 whitespace-nowrap">
                            <span className="font-bold text-gray-900 bg-white border border-gray-200 px-2 py-1 rounded-md text-sm">
                                {reservation.code}
                            </span>
                        </td>
                        <td className="px-6 py-2 text-sm font-medium text-gray-900 max-w-[200px] truncate" title={reservation.guestContact?.email || ''}>
                            {reservation.guestContact?.email || 'N/A'}
                        </td>
                        <td className="px-6 py-2 text-sm text-gray-600">
                             {reservation.roomId ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                   {reservation.roomId.number} - {reservation.roomId.type}
                                </span>
                             ) : 'Room details unavailable'}
                        </td>
                        <td className="px-6 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                        {reservation.checkIn ? new Date(reservation.checkIn).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                        {reservation.checkOut ? new Date(reservation.checkOut).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border bg-opacity-50 ${getStatusColor(reservation.status).replace('bg-', 'border-').replace('text-', 'text-')}`}>
                             {/* Note: getStatusColor returns generic classes, overriding for specific badges if needed or refining getStatusColor later */}
                             <span className={`px-2 py-0.5 rounded-full ${getStatusColor(reservation.status)}`}>
                                {reservation.status}
                             </span>
                        </span>
                        </td>
                        <td className="px-6 py-2 text-sm font-bold text-gray-900 font-mono">${reservation.totalAmount || 0}</td>
                        <td className="px-6 py-2 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                            onClick={() => handleViewDetail(reservation)}
                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="View"
                            >
                            <Eye size={16} />
                            </button>
                            <button 
                            onClick={() => handleEdit(reservation)}
                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            title="Edit"
                            >
                            <Edit size={16} />
                            </button>
                            
                            {/* Check-In Action: Only for Confirmed reservations */}
                            {reservation.status === 'Confirmed' && (
                            <button 
                                onClick={() => handleCheckIn(reservation._id)}
                                className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-teal-50 hover:text-teal-600 transition-colors" 
                                title="Check In"
                            >
                                <DoorOpen size={16} />
                            </button>
                            )}

                            {/* Check-Out Action: Only for CheckedIn reservations */}
                            {reservation.status === 'CheckedIn' && (
                            <button 
                                onClick={() => handleCheckOut(reservation._id)}
                                className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-colors" 
                                title="Check Out"
                            >
                                <LogOut size={16} />
                            </button>
                            )}

                            {/* Confirmation Action: Only for PendingPayment */}
                            {reservation.status === 'PendingPayment' && (
                            <button 
                                onClick={() => handleConfirm(reservation._id)}
                                className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-colors" 
                                title="Confirm"
                            >
                                <CheckCircle size={16} />
                            </button>
                            )}

                            {/* Cancel Action: For Confirmed or PendingPayment */}
                            {(reservation.status === 'Confirmed' || reservation.status === 'PendingPayment') && (
                            <button 
                                onClick={() => handleCancel(reservation)}
                                className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors" 
                                title="Cancel"
                            >
                                <XCircle size={16} />
                            </button>
                            )}
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
               {/* Note: Pagination info is generally displayed at the top or bottom. Here, we can also show it. 
                   But since we added it to top, maybe we keep it simple here or remove duplicate info. 
                   Let's follow Room's pattern: Info and Buttons. */}
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

      <DeleteConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false)
          setReservationToCancel(null)
        }}
        onConfirm={confirmCancel}
        guestName={reservationToCancel ? `Reservation ${reservationToCancel.code}` : ''}
      />

      <ReservationDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedReservation(null)
        }}
        reservation={selectedReservation}
      />

      <ReservationFormModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setReservationToEdit(null)
        }}
        reservation={reservationToEdit}
        onSuccess={handleEditSuccess}
      />
      </div>
    </div>
  )
}

export default Reservations
