import { useState, useEffect } from 'react'
import { Eye, Edit, Trash2, Search, ChevronLeft, ChevronRight, AlertTriangle, Users, Filter, Download, Crown, ShieldAlert, ShieldCheck, Mail, Phone, Calendar as CalendarIcon } from 'lucide-react'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import EmptyState from '@/components/common/EmptyState'
import { fetchGuests, deleteGuest, updateGuest, type Guest } from '@/services/guestApi'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import GuestDetailModal from '@/components/admin/GuestDetailModal'
import GuestFormModal from '@/components/admin/GuestFormModal'
import ExportButton, { type ExportFormat, type ExportScope } from '@/components/admin/ExportButton'
import { exportToCSV, exportToExcel, formatDataForExport, generateFilename } from '@/utils/exportData'
import SortableTableHeader from '@/components/admin/SortableTableHeader'
import { useSorting } from '@/Hooks/useSorting'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

const Guests = () => {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isBlacklistedFilter, setIsBlacklistedFilter] = useState<boolean | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const itemsPerPage = 20

  // Sorting state
  const { sortConfigs, handleSort } = useSorting([], 'guests')
  
  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)


  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadGuests = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchGuests({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        isBlacklisted: isBlacklistedFilter,
        sort: sortConfigs
      })
      
      setGuests(response.data)
      setTotalItems(response.total)
      setTotalPages(Math.ceil(response.total / itemsPerPage))
    } catch (err: any) {
      console.error('Error fetching guests:', err)
      setError(err.response?.data?.message || 'Failed to load guests')
    } finally {
      setTimeout(() => setLoading(false), 300)
    }
  }

  useEffect(() => {
    loadGuests()
  }, [currentPage, debouncedSearch, isBlacklistedFilter, sortConfigs])

  const handleDelete = (guest: Guest) => {
    setGuestToDelete(guest)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!guestToDelete) return
    
    try {
      await deleteGuest(guestToDelete._id)
      loadGuests() 
      setGuestToDelete(null)
    } catch (err: any) {
      console.error('Error deleting guest:', err)
      alert(err.response?.data?.message || 'Failed to delete guest')
    }
  }

  const handleViewDetail = (guest: Guest) => {
    setSelectedGuest(guest)
    setDetailModalOpen(true)
  }

  const handleEdit = (guest: Guest) => {
    setSelectedGuest(guest)
    setFormModalOpen(true)
  }

  const handleAddGuest = () => {
    setSelectedGuest(null)
    setFormModalOpen(true)
  }

  const handleVerifyGuest = async (guestId: string) => {
    try {
        await updateGuest(guestId, { isIdVerified: true })
        // Refresh list
        loadGuests()
        // Update selected guest to reflect change immediately in modal
        if (selectedGuest && selectedGuest._id === guestId) {
            setSelectedGuest({ ...selectedGuest, isIdVerified: true })
        }
    } catch (err: any) {
        console.error('Error verifying guest:', err)
        alert(err.response?.data?.message || 'Failed to verify guest')
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
// ... (rest of the file until GuestDetailModal)
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
    let dataToExport: Guest[] = []
    
    try {
      if (scope === 'current') {
        dataToExport = guests
      } else if (scope === 'filtered' || scope === 'all') {
        const response = await fetchGuests({
          limit: 10000,
          search: scope === 'all' ? undefined : (debouncedSearch || undefined),
          isBlacklisted: scope === 'all' ? undefined : isBlacklistedFilter,
          sort: sortConfigs
        })
        dataToExport = response.data
      }
      
      const formatted = formatDataForExport(dataToExport, {
        'First Name': 'firstName',
        'Last Name': 'lastName',
        'Email': 'email',
        'Phone': 'phoneNumber',
        'Status': 'status',
        'Blacklisted': (g) => g.isBlacklisted ? 'Yes' : 'No',
        'Verified': (g) => g.isIdVerified ? 'Yes' : 'No',
        'Last Visit': (g) => g.lastVisit ? new Date(g.lastVisit).toLocaleDateString() : ''
      })
      
      const filename = generateFilename('guests')
      
      if (exportFormat === 'csv') {
        exportToCSV(formatted, filename)
      } else {
        exportToExcel(formatted, filename, 'Guests')
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'VIP':
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><Crown size={12} fill="currentColor" /> VIP</span>
        case 'Loyalty':
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200"><ShieldCheck size={12} /> Loyalty</span>
        default:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">Standard</span>
    }
  }

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
       <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

       <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900">Guest Management</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage guest profiles, loyalty status, and history.</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={handleAddGuest}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:bg-black transition-colors flex items-center gap-2"
             >
                <Users size={18} /> Add Guest
             </button>
            {guests.length > 0 && (
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
                    placeholder="Search guests by name, email, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder-gray-400 font-medium transition-all"
                />
            </div>
            
            <div className="flex gap-2">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="All">All Status</option>
                    <option value="Standard">Standard</option>
                    <option value="VIP">VIP</option>
                    <option value="Loyalty">Loyalty</option>
                </select>

                <button
                    onClick={() => setIsBlacklistedFilter(prev => prev === true ? undefined : true)}
                    className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all ${
                        isBlacklistedFilter === true 
                        ? 'bg-red-50 text-red-600 border-red-200' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <ShieldAlert size={16} /> 
                    {isBlacklistedFilter ? 'Showing Blacklisted' : 'Filter Risk'}
                </button>
            </div>
        </div>

        {/* Guest Grid */}
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden min-h-[400px]">
            {loading ? (
                 <div className="p-6">
                    <TableSkeleton rows={8} />
                 </div>
            ) : error ? (
                <div className="flex items-center justify-center h-[400px]">
                    <EmptyState 
                        title="Unable to load guests" 
                        description={error}
                        icon={AlertTriangle}
                        action={{ label: "Retry", onClick: () => loadGuests() }}
                    />
                </div>
            ) : guests.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                    <EmptyState
                        title={searchQuery || isBlacklistedFilter ? 'No matches found' : 'No guests yet'}
                        description="Try adjusting your filters or add a new guest."
                        icon={Users}
                    />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200/50 bg-gray-50/50">
                                <SortableTableHeader column="firstName" label="Guest Name" sortConfigs={sortConfigs} onSort={handleSort} className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" />
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                                <SortableTableHeader column="status" label="Status" sortConfigs={sortConfigs} onSort={handleSort} className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" />
                                <SortableTableHeader column="isIdVerified" label="Verification" sortConfigs={sortConfigs} onSort={handleSort} className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" />
                                <SortableTableHeader column="lastVisit" label="Last Visit" sortConfigs={sortConfigs} onSort={handleSort} className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" />
                                <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence>
                                {guests
                                  .filter(g => statusFilter === 'All' || g.status === statusFilter)
                                  .map((guest, idx) => (
                                    <motion.tr 
                                        key={guest._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`group hover:bg-white/80 transition-colors ${guest.isBlacklisted ? 'bg-red-50/50 hover:bg-red-50' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm ring-2 ring-white ${
                                                    guest.isBlacklisted 
                                                    ? 'bg-red-100 text-red-600' 
                                                    : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600'
                                                }`}>
                                                    {guest.firstName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={`font-bold transition-colors ${guest.isBlacklisted ? 'text-red-700' : 'text-gray-900 group-hover:text-blue-600'}`}>
                                                        {guest.firstName} {guest.lastName}
                                                    </div>
                                                    {guest.isBlacklisted && <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Blacklisted</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                                                    <Phone size={12} className="text-gray-400" /> {guest.phoneNumber}
                                                </div>
                                                {guest.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <Mail size={12} className="text-gray-400" /> {guest.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(guest.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {guest.isIdVerified ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                                    <ShieldCheck size={12} /> Verified
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-gray-400">Unverified</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            {guest.lastVisit ? format(new Date(guest.lastVisit), 'MMM d, yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleViewDetail(guest)}
                                                    className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    title="View Profile"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleEdit(guest)}
                                                    className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                                    title="Edit Guest"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(guest)}
                                                    className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title="Delete Guest"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Footer / Pagination */}
            {!loading && totalItems > 0 && (
                <div className="bg-white/50 border-t border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-medium text-gray-500">
                        Showing <span className="text-gray-900 font-bold">{Math.min((currentPage-1)*itemsPerPage+1, totalItems)}-{Math.min(currentPage*itemsPerPage, totalItems)}</span> of <span className="text-gray-900 font-bold">{totalItems}</span> guests
                    </div>
                    
                    {totalPages > 1 && (
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
                    )}
                </div>
            )}
        </div>
       </div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setGuestToDelete(null)
        }}
        onConfirm={confirmDelete}
        guestName={guestToDelete ? `${guestToDelete.firstName} ${guestToDelete.lastName || ''}` : ''}
      />

      <GuestDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedGuest(null)
        }}
        guest={selectedGuest}
        onVerifyId={handleVerifyGuest}
        onEdit={() => {
            setDetailModalOpen(false)
            setFormModalOpen(true)
        }}
      />

      <GuestFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setSelectedGuest(null)

        }}
        onSuccess={loadGuests}
        guest={selectedGuest}
      />
    </div>
  )
}

export default Guests
