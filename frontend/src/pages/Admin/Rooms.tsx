import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight, AlertTriangle, FolderOpen, BedDouble, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchRooms, deleteRoom, type Room } from '@/services/adminApi'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import ExportButton, { type ExportFormat, type ExportScope } from '@/components/admin/ExportButton'
import { exportToCSV, exportToExcel, formatDataForExport, generateFilename } from '@/utils/exportData'
import SortableTableHeader from '@/components/admin/SortableTableHeader'
import { useSorting } from '@/Hooks/useSorting'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import EmptyState from '@/components/common/EmptyState'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store/store'

const Rooms = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const basePath = user?.role === 'receptionist' ? '/receptionist' : '/admin'

  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const itemsPerPage = 20

  // Sorting state
  const { sortConfigs, handleSort } = useSorting([], 'rooms')
  
  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchRooms({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        available: availabilityFilter ? availabilityFilter === 'true' : undefined,
        sort: sortConfigs
      })
      
      setRooms(response.data)
      setTotalItems(response.total)
      setTotalPages(Math.ceil(response.total / itemsPerPage))
    } catch (err: any) {
      console.error('Error fetching rooms:', err)
      setError(err.response?.data?.message || 'Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, typeFilter, availabilityFilter, sortConfigs])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  const handleDelete = useCallback((room: Room) => {
    setRoomToDelete(room)
    setDeleteModalOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!roomToDelete) return
    
    try {
      await deleteRoom(roomToDelete._id)
      loadRooms() // Reload to update pagination
      setRoomToDelete(null)
      setDeleteModalOpen(false)
    } catch (err: any) {
      console.error('Error deleting room:', err)
      alert(err.response?.data?.message || 'Failed to delete room')
    }
  }, [roomToDelete, loadRooms])

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [totalPages])

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
    let dataToExport: Room[] = []
    
    try {
      if (scope === 'current') {
        dataToExport = rooms
      } else if (scope === 'filtered' || scope === 'all') {
        const response = await fetchRooms({
          limit: 10000,
          search: scope === 'all' ? undefined : (debouncedSearch || undefined),
          type: scope === 'all' ? undefined : (typeFilter || undefined),
          available: scope === 'all' ? undefined : (availabilityFilter ? availabilityFilter === 'true' : undefined),
          sort: sortConfigs
        })
        dataToExport = response.data
      }
      
      const formatted = formatDataForExport(dataToExport, {
        'Room Number': 'number',
        'Name': 'name',
        'Type': 'type',
        'Price': (r) => `$${r.price}`,
        'Status': (r) => r.available ? 'Available' : 'Occupied',
        'Description': 'description',
        'Amenities': (r) => r.amenities?.join(', ') || ''
      })
      
      const filename = generateFilename('rooms')
      
      if (exportFormat === 'csv') {
        exportToCSV(formatted, filename)
      } else {
        exportToExcel(formatted, filename, 'Rooms')
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data')
    }
  }

  if (loading && rooms.length === 0) {
    return <TableSkeleton rows={10} />
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <EmptyState 
           title="Unable to load rooms" 
           description={error || "Something went wrong while fetching the room list."}
           icon={AlertTriangle}
           action={{ label: "Retry", onClick: () => loadRooms() }}
        />
      </div>
    )
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900">Room Management</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage hotel inventory, pricing, and availability.</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => navigate(`${basePath}/rooms/new`)}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:bg-black transition-colors flex items-center gap-2"
             >
                <Plus size={18} /> Add Room
             </button>
            {rooms.length > 0 && (
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
            placeholder="Search by room number, name, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder-gray-400 font-medium transition-all"
          />
        </div>
        
        <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Types</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Premium">Premium</option>
              <option value="Luxury">Luxury</option>
            </select>
            <select
              value={availabilityFilter}
              onChange={(e) => {
                setAvailabilityFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Status</option>
              <option value="true">Available</option>
              <option value="false">Occupied</option>
            </select>
        </div>
      </div>

      {/* Pagination Info */}
      {totalItems > 0 && (
        <div className="text-sm font-medium text-gray-500 px-2">
            Showing <span className="text-gray-900 font-bold">{startItem}-{endItem}</span> of <span className="text-gray-900 font-bold">{totalItems}</span> rooms
        </div>
      )}

  {/* Empty State */}
      {rooms.length === 0 ? (
        <div className="flex items-center justify-center h-[400px] bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl">
            <EmptyState
            title={searchQuery ? 'No rooms found' : 'No rooms added yet'}
            description={searchQuery ? `We couldn't find any rooms matching "${searchQuery}"` : "Get started by adding your first room to the inventory."}
            icon={FolderOpen}
            action={!searchQuery ? {
                label: "Add Your First Room",
                onClick: () => navigate(`${basePath}/rooms/new`),
                startIcon: Plus
            } : undefined}
            />
        </div>
      ) : (
        <>
          {/* Rooms Table */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden min-h-[400px]">
             <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="border-b border-gray-200/50 bg-gray-50/50">
                    <tr>
                    <SortableTableHeader
                        column="number"
                        label="Room #"
                        sortConfigs={sortConfigs}
                        onSort={handleSort}
                        className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    />
                    <SortableTableHeader
                        column="name"
                        label="Name"
                        sortConfigs={sortConfigs}
                        onSort={handleSort}
                        className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    />
                    <SortableTableHeader
                        column="type"
                        label="Type"
                        sortConfigs={sortConfigs}
                        onSort={handleSort}
                        className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    />
                    <SortableTableHeader
                        column="price"
                        label="Price"
                        sortConfigs={sortConfigs}
                        onSort={handleSort}
                        className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    />
                    <SortableTableHeader
                        column="available"
                        label="Status"
                        sortConfigs={sortConfigs}
                        onSort={handleSort}
                        className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    />
                    <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    <AnimatePresence>
                    {rooms.map((room, idx) => (
                    <motion.tr 
                        key={room._id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-white/80 transition-colors"
                    >
                        <td className="px-6 py-4">
                            <span className="font-bold text-gray-900 bg-white border border-gray-200 px-2 py-1 rounded-md text-sm">
                                {room.number}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{room.name}</td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                <BedDouble size={14} />
                                {room.type}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 font-mono">${room.price}</td>
                        <td className="px-6 py-4">
                        <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${
                            room.available
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                        >
                            {room.available ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {room.available ? 'Available' : 'Occupied'}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                            onClick={() => navigate(`${basePath}/rooms/${room._id}`)}
                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="View"
                            >
                            <Eye size={16} />
                            </button>
                            <button
                            onClick={() => navigate(`${basePath}/rooms/edit/${room._id}`)}
                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-colors"
                            title="Edit"
                            >
                            <Edit size={16} />
                            </button>
                            <button
                            onClick={() => handleDelete(room)}
                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
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
          </div>
        </>
      )}

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setRoomToDelete(null)
        }}
        onConfirm={confirmDelete}
        guestName={roomToDelete ? `Room ${roomToDelete.number} - ${roomToDelete.name}` : ''}
      />
      </div>
    </div>
  )
}

export default Rooms
