import { useState, useEffect } from 'react'
import { Eye, Edit, Trash2, Search, ChevronLeft, ChevronRight, AlertTriangle, Users as UsersIcon, Filter, Download, MoreVertical, Shield, CheckCircle, XCircle, Clock } from 'lucide-react'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import EmptyState from '@/components/common/EmptyState'
import { fetchUsers, deleteUser, type User } from '@/services/adminApi'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import UserDetailModal from '@/components/admin/UserDetailModal'
import UserFormModal from '@/components/admin/UserFormModal'
import ExportButton, { type ExportFormat, type ExportScope } from '@/components/admin/ExportButton'
import { exportToCSV, exportToExcel, formatDataForExport, generateFilename } from '@/utils/exportData'
import SortableTableHeader from '@/components/admin/SortableTableHeader'
import { useSorting } from '@/Hooks/useSorting'
import { motion, AnimatePresence } from 'framer-motion'

const Users = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const itemsPerPage = 20

  // Sorting state
  const { sortConfigs, handleSort } = useSorting([], 'users')
  
  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      })
      
      setUsers(response.data)
      setTotalItems(response.total)
      setTotalPages(Math.ceil(response.total / itemsPerPage))
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      // Small delay for smooth transition effect
      setTimeout(() => setLoading(false), 300)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [currentPage, debouncedSearch, roleFilter, statusFilter, sortConfigs])

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    
    try {
      await deleteUser(userToDelete._id)
      loadUsers() // Reload to update pagination
      setUserToDelete(null)
    } catch (err: any) {
      console.error('Error deleting user:', err)
      alert(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleViewDetail = (user: User) => {
    setSelectedUser(user)
    setDetailModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-500/10 text-purple-600 border-purple-200',
      receptionist: 'bg-blue-500/10 text-blue-600 border-blue-200',
      Housekeeper: 'bg-orange-500/10 text-orange-600 border-orange-200',
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  const getApprovalStatusObj = (status: string) => {
    const statuses: Record<string, { color: string, icon: any, label: string }> = {
      approved: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle, label: 'Active' },
      pending: { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock, label: 'Pending' },
      rejected: { color: 'text-rose-600 bg-rose-50 border-rose-200', icon: XCircle, label: 'Rejected' },
    }
    return statuses[status] || { color: 'text-gray-600 bg-gray-50', icon: AlertTriangle, label: status }
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
        if (i <= 0) continue; 
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
    let dataToExport: User[] = []
    
    try {
      if (scope === 'current') {
        dataToExport = users
      } else if (scope === 'filtered' || scope === 'all') {
        const response = await fetchUsers({
          limit: 10000,
          search: scope === 'all' ? undefined : (debouncedSearch || undefined),
          role: scope === 'all' ? undefined : (roleFilter || undefined),
          sort: sortConfigs
        })
        dataToExport = response.data
      }
      
      const formatted = formatDataForExport(dataToExport, {
        'Name': 'fullName',
        'Email': 'email',
        'Role': 'role',
        'Status': 'isApproved',
        'Verified': (u) => u.isVerified ? 'Yes' : 'No',
        'Phone': (u) => u.phoneNumber || '',
        'Created At': (u) => u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
      })
      
      const filename = generateFilename('users')
      
      if (exportFormat === 'csv') {
        exportToCSV(formatted, filename)
      } else {
        exportToExcel(formatted, filename, 'Users')
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data')
    }
  }

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
       {/* Top Decoration */}
       <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

       <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage system access, roles, and permissions.</p>
          </div>
          <div className="flex items-center gap-2">
            {users.length > 0 && (
                <ExportButton onExport={handleExport} loading={loading} />
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search users by name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder-gray-400 font-medium transition-all"
                />
            </div>
            
            <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                <div className="relative min-w-[140px]">
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="w-full appearance-none pl-10 pr-8 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="Housekeeper">Housekeeper</option>
      
                    </select>
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>

                <div className="relative min-w-[140px]">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="w-full appearance-none pl-10 pr-8 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Active</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
            </div>
        </div>

        {/* Data Grid */}
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden min-h-[400px]">
            {loading ? (
                 <div className="p-6">
                    <TableSkeleton rows={8} />
                 </div>
            ) : error ? (
                <div className="flex items-center justify-center h-[400px]">
                    <EmptyState 
                        title="Unable to load users" 
                        description={error}
                        icon={AlertTriangle}
                        action={{ label: "Retry", onClick: () => loadUsers() }}
                    />
                </div>
            ) : users.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                    <EmptyState
                        title={searchQuery || roleFilter || statusFilter ? 'No matches found' : 'No users exist'}
                        description="Try adjusting your filters or search query."
                        icon={UsersIcon}
                    />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200/50 bg-gray-50/50">
                                <SortableTableHeader column="fullName" label="User" sortConfigs={sortConfigs} onSort={handleSort} className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" />
                                <SortableTableHeader column="role" label="Role" sortConfigs={sortConfigs} onSort={handleSort} className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" />
                                <SortableTableHeader column="isApproved" label="Status" sortConfigs={sortConfigs} onSort={handleSort} className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" />
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence>
                                {users.map((user, idx) => {
                                    const statusObj = getApprovalStatusObj(user.isApproved);
                                    const StatusIcon = statusObj.icon;
                                    
                                    return (
                                        <motion.tr 
                                            key={user._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-white/80 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        {user.avatar?.url ? (
                                                            <img src={user.avatar.url} alt={user.fullName} className="w-12 h-12 rounded-xl object-cover shadow-sm ring-2 ring-white" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm ring-2 ring-white">
                                                                {user.fullName.charAt(0)}
                                                            </div>
                                                        )}
                                                        {user.isVerified && (
                                                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white" title="Verified Account">
                                                                <CheckCircle size={10} fill="currentColor" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.fullName}</div>
                                                        <div className="text-xs text-gray-500 font-medium">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusObj.color}`}>
                                                    <StatusIcon size={12} />
                                                    {statusObj.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-600">
                                                    {user.phoneNumber || <span className="text-gray-300 italic">No Phone</span>}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleViewDetail(user)}
                                                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEdit(user)}
                                                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(user)}
                                                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Footer / Pagination */}
            {!loading && totalItems > 0 && (
                <div className="bg-white/50 border-t border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-medium text-gray-500">
                        Showing <span className="text-gray-900 font-bold">{Math.min((currentPage-1)*itemsPerPage+1, totalItems)}-{Math.min(currentPage*itemsPerPage, totalItems)}</span> of <span className="text-gray-900 font-bold">{totalItems}</span> users
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
          setUserToDelete(null)
        }}
        onConfirm={confirmDelete}
        guestName={userToDelete ? `${userToDelete.email}` : ''}
      />

      <UserDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
      />

      <UserFormModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={loadUsers}
        user={selectedUser}
      />
    </div>
  )
}

export default Users
