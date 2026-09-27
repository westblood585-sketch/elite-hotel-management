import { format } from 'date-fns'
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

interface Activity {
  _id: string
  guestName: string
  roomNumber: number
  status: 'Confirmed' | 'PendingPayment' | 'CheckedIn' | 'CheckedOut' | 'Cancelled'
  amount: number
  createdAt: string
  type: 'booking' | 'check-in' | 'check-out' | 'cancellation'
}

interface RecentActivityProps {
  activities?: Activity[]
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Confirmed':
    case 'CheckedIn':
      return <CheckCircle size={16} className="text-green-500" />
    case 'PendingPayment':
      return <Clock size={16} className="text-yellow-500" />
    case 'Cancelled':
      return <XCircle size={16} className="text-red-500" />
    default:
      return <AlertCircle size={16} className="text-gray-500" />
  }
}

const RecentActivity = ({ activities = [] }: RecentActivityProps) => {
  return (
    <div className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/50 h-full">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
         <button className="text-xs font-bold text-amber-700 hover:text-amber-800 uppercase tracking-wider">View All</button>
      </div>
      
      <div className="space-y-0 relative">
        {/* Vertical Line */}
        {activities.length > 0 && (
            <div className="absolute left-[19px] top-2 bottom-4 w-[2px] bg-gray-100 dark:bg-gray-700/50" />
        )}

        {activities.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center">
             <div className="p-4 bg-gray-50 rounded-full mb-3">
                <Clock className="text-gray-300 w-6 h-6" />
             </div>
             <p className="text-gray-400 font-medium">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity._id} className="group flex gap-4 relative pb-6 last:pb-0">
               {/* Icon Dot */}
               <div className="relative z-10 flex-shrink-0 mt-0.5">
                   <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {getStatusIcon(activity.status)}
                   </div>
               </div>

               {/* Content */}
               <div className="flex-1 bg-white/50 rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all group-hover:bg-white/80">
                   <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-900 text-sm">
                        {activity.guestName}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                      </span>
                   </div>
                   
                   <p className="text-xs text-gray-600 font-medium flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-500">Room {activity.roomNumber}</span>
                      <span>•</span>
                      <span className={
                          activity.status === 'Confirmed' ? 'text-green-600' :
                          activity.status === 'PendingPayment' ? 'text-yellow-600' :
                          activity.status === 'Cancelled' ? 'text-red-600' : 'text-gray-600'
                      }>
                          {activity.status}
                      </span>
                   </p>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default RecentActivity
