import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DollarSign,
  Users,
  BedDouble,
  Calendar,
  Activity,
  AlertTriangle,
  Search,
  Bell,
  Settings,
  ChevronDown
} from 'lucide-react'
import { useAdminDashboard } from '@/Hooks/useDashboardData'
import GlassStatsCard from '@/components/admin/GlassStatsCard'
import OccupancyChart from '@/components/admin/widgets/OccupancyChart'
import RecentActivity from '@/components/admin/widgets/RecentActivity'
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton'
import EmptyState from '@/components/common/EmptyState'
import RevenueChart from '@/components/admin/widgets/RevenueChart'
import { dashboardApi } from '@/services/dashboardApi'

const Dashboard: React.FC = () => {
  const { data, isLoading, isError, refetch } = useAdminDashboard()
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  // Fetch recent activity only after dashboard data loads to avoid waterfall
  useEffect(() => {
    if (isLoading || !data) return; // Wait for main dashboard data first
    
    const fetchRecentActivity = async () => {
        try {
            setActivityLoading(true);
            const activity = await dashboardApi.getRecentActivity();
            setRecentActivity(activity);
        } catch (error) {
            console.error("Failed to fetch activity", error);
        } finally {
            setActivityLoading(false);
        }
    };
    
    fetchRecentActivity();
  }, [isLoading, data]); // Only run after dashboard loads

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-50 pt-8 px-4 sm:px-6 lg:px-8">
            <DashboardSkeleton />
        </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <EmptyState 
           title="Failed to load dashboard" 
           description="We couldn't fetch the latest data. Please check your connection and try again."
           icon={AlertTriangle}
           action={{ label: "Try Again", onClick: () => refetch() }}
        />
      </div>
    )
  }

  const occupancyData = [
    { name: 'Occupied', value: data?.occupancyMetrics?.occupiedRooms || 0, color: '#3B82F6' },
    { name: 'Available', value: data?.occupancyMetrics?.availableRooms || 0, color: '#10B981' },
    { name: 'Maintenance', value: data?.occupancyMetrics?.maintenanceRooms || 0, color: '#F59E0B' },
  ]

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100">
       {/* Top Decoration */}
       <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

       {/* Content */}
       <div className="relative z-10 p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-3xl font-serif font-bold text-gray-900">Dashboard</h1>
                   <p className="text-gray-500 font-medium">Welcome back, Admin. Here's your daily overview.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center bg-white/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/50 shadow-sm">
                        <Search size={18} className="text-gray-400 mr-2" />
                        <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-48" />
                    </div>
                    
                    <button className="p-3 bg-white/60 backdrop-blur-md rounded-xl border border-white/50 shadow-sm text-gray-500 hover:text-amber-600 transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/admin/desk-booking'}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-900/20 hover:bg-black transition-all flex items-center gap-2"
                    >
                        <Calendar size={16} />
                        New Reservation
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassStatsCard
                title="Total Revenue"
                value={`$${data?.financialMetrics?.totalRevenue.toLocaleString() ?? '0'}`}
                change="12.5%"
                isPositive={true}
                icon={DollarSign}
                color="blue"
                subtext="This Month"
                />
                <GlassStatsCard
                title="Occupancy"
                value={`${data?.occupancyMetrics?.currentOccupancy ?? 0}%`}
                change="4.2%"
                isPositive={true}
                icon={BedDouble}
                color="green"
                subtext="Current Rate"
                />
                <GlassStatsCard
                title="Pending Actions"
                value={(data?.userMetrics?.pendingApprovals ?? 0).toString()}
                change="Requires Review"
                isPositive={false}
                icon={Users}
                color={data?.userMetrics?.pendingApprovals ? "amber" : "green"}
                subtext="Approvals"
                />
                <GlassStatsCard
                title="Housekeeping"
                value={(data?.housekeepingStatus?.dirtyRooms ?? 0).toString()}
                change={`${data?.housekeepingStatus?.inProgressRooms ?? 0} In Progress`}
                isPositive={false}
                icon={Activity}
                color="rose"
                subtext="Dirty Rooms"
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 flex items-center justify-between transition-all hover:bg-white/60">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Invoices</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{data?.billingStatus?.overdue ?? 0} Overdue</p>
                    </div>
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <AlertTriangle size={20} />
                    </div>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 flex items-center justify-between transition-all hover:bg-white/60">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tasks</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{data?.housekeepingStatus?.tasksOverdue ?? 0} Overdue</p>
                    </div>
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Activity size={20} />
                    </div>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 flex items-center justify-between transition-all hover:bg-white/60">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">New Guests</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{data?.userMetrics?.newGuestsThisMonth ?? 0}</p>
                    </div>
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Users size={20} />
                    </div>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 flex items-center justify-between transition-all hover:bg-white/60">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Avg. Rate</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">${data?.roomInventory?.averageDailyRate ?? 0}</p>
                    </div>
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <DollarSign size={20} />
                    </div>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <RevenueChart />
                    
                    {/* Recent Activity Table */}
                    <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                             <button className="text-sm font-semibold text-gray-500 hover:text-gray-900">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Guest</th>
                                        <th className="px-4 py-3">Room</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3 rounded-r-lg">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentActivity.slice(0, 5).map((activity) => (
                                        <tr key={activity._id} className="hover:bg-white/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{activity.guestName}</td>
                                            <td className="px-4 py-3 text-gray-600">#{activity.roomNumber}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                    activity.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                                    activity.status === 'PendingPayment' ? 'bg-yellow-100 text-yellow-700' :
                                                    activity.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {activity.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono font-medium">${activity.amount}</td>
                                            <td className="px-4 py-3 text-gray-500">{new Date(activity.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {recentActivity.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-4 text-center text-gray-500">No recent transactions found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <OccupancyChart data={occupancyData} />
                    <RecentActivity activities={recentActivity} />
                    
                    {/* System Health */}
                    <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-green-400" />
                            System Health
                        </h3>
                        <div className="space-y-3">
                           {Object.entries(data?.systemHealth?.services || {}).map(([service, status]) => (
                                <div key={service} className="flex items-center justify-between text-sm">
                                    <span className="capitalize opacity-80">{service}</span>
                                    <span className={`px-2 py-0.5 rounded textxs font-bold ${
                                        status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {status}
                                    </span>
                                </div>
                           ))}
                           {!data?.systemHealth?.services && (
                               <div className="text-sm opacity-50 italic">No health data available.</div>
                           )}
                        </div>
                    </div>
                </div>
            </div>
       </div>
    </div>
  )
}

export default Dashboard
