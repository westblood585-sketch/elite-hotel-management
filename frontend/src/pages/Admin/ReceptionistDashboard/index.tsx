import React from 'react';
import { 
  Clock, 
  BedDouble,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Phone,
  Bell
} from 'lucide-react';
import { useReceptionistDashboard } from '@/Hooks/useDashboardData';
import { useRealtimeUpdates } from '@/Hooks/useRealtimeUpdates';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ErrorWidget } from '@/components/shared/ErrorWidget';
import { LoadingWidget } from '@/components/shared/LoadingWidget';

import { useNavigate } from 'react-router-dom';

import { NotificationBell } from '@/components/shared/NotificationBell';
import EmptyState from '@/components/common/EmptyState';

const ReceptionistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useReceptionistDashboard();
  
  // Enable real-time updates
  useRealtimeUpdates('receptionist');

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Receptionist Dashboard</h1>
        <LoadingWidget variant="grid" count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Receptionist Dashboard</h1>
        <ErrorWidget
          title="Failed to Load Dashboard"
          message="Unable to fetch dashboard data. Please try again."
          severity="error"
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      </div>
    );
  }

  const {
    todayActivity,
    roomStatus,
    pendingPayments,
    quickActions,
    serviceHealth,
  } = data || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
          <p className="text-gray-500 mt-1">Operational command center</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <span className="text-sm text-gray-500">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Quick Actions & Alerts */}
      {quickActions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Rooms to Assign"
            value={quickActions.roomsToAssign || 0}
            icon={<BedDouble className="w-6 h-6" />}
            color={quickActions.roomsToAssign > 0 ? 'yellow' : 'green'}
            onClick={() => {/* Navigate to room assignment */}}
          />
          <StatCard
            title="Early Check-In Requests"
            value={quickActions.earlyCheckInRequests || 0}
            icon={<Clock className="w-6 h-6" />}
            color={quickActions.earlyCheckInRequests > 0 ? 'blue' : 'gray'}
            onClick={() => {/* Navigate to requests */}}
          />
          <StatCard
            title="Late Check-Out Requests"
            value={quickActions.lateCheckOutRequests || 0}
            icon={<Clock className="w-6 h-6" />}
            color={quickActions.lateCheckOutRequests > 0 ? 'purple' : 'gray'}
            onClick={() => {/* Navigate to requests */}}
          />
        </div>
      )}

      {/* New Action Button */}
      <div className="flex justify-start">
         <button
            onClick={() => navigate('/receptionist/desk-booking')}
            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Clock className="w-5 h-5" />
            New Desk Booking
          </button>
      </div>

      {/* Today's Activity */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Activity</h2>
        {todayActivity ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-Ins */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Check-Ins Scheduled
                </h3>
                <span className="text-2xl font-bold text-green-600">
                  {todayActivity.checkInsScheduled?.count || 0}
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayActivity.checkInsScheduled?.reservations && todayActivity.checkInsScheduled.reservations.length > 0 ? (
                  todayActivity.checkInsScheduled.reservations.map((reservation: any) => (
                    <div key={reservation._id} className="border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{reservation.guestName}</span>
                        <StatusBadge status={reservation.status} size="sm" />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4" />
                          Room {reservation.roomNumber} ({reservation.roomType})
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(reservation.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {reservation.guestContact?.phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8">
                    <EmptyState
                      title="No check-ins"
                      description="No check-ins scheduled for today."
                      icon={CheckCircle}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Check-Outs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Check-Outs Scheduled
                </h3>
                <span className="text-2xl font-bold text-blue-600">
                  {todayActivity.checkOutsScheduled?.count || 0}
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayActivity.checkOutsScheduled?.reservations && todayActivity.checkOutsScheduled.reservations.length > 0 ? (
                  todayActivity.checkOutsScheduled.reservations.map((reservation: any) => (
                    <div key={reservation._id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{reservation.guestName}</span>
                        <StatusBadge status={reservation.status} size="sm" />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4" />
                          Room {reservation.roomNumber}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(reservation.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          ₹{reservation.totalAmount?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8">
                    <EmptyState
                      title="No check-outs"
                      description="No check-outs scheduled for today."
                      icon={AlertCircle}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <ErrorWidget
            title="Activity Data Unavailable"
            message="Reservation service is currently down."
            severity="warning"
          />
        )}
      </section>

      {/* Room Status Overview */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Room Status Overview</h2>
        {roomStatus ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <StatCard
                title="Ready for Check-In"
                value={roomStatus.quickStats?.readyForCheckIn || 0}
                color="green"
              />
              <StatCard
                title="Awaiting Cleaning"
                value={roomStatus.quickStats?.awaitingCleaning || 0}
                color="yellow"
              />
              <StatCard
                title="Out of Order"
                value={roomStatus.quickStats?.outOfOrder || 0}
                color="red"
              />
            </div>
            
            {/* Room Grid - Simplified */}
            <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {roomStatus.grid && roomStatus.grid.slice(0, 48).map((room: any) => (
                <div
                  key={room.roomId}
                  className={`
                    p-2 rounded text-center text-xs font-medium cursor-pointer
                    transition-all hover:scale-105
                    ${room.status === 'available' ? 'bg-green-100 text-green-700 border border-green-300' : ''}
                    ${room.status === 'occupied' ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
                    ${room.status === 'maintenance' ? 'bg-red-100 text-red-700 border border-red-300' : ''}
                    ${room.status === 'cleaning' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : ''}
                  `}
                  title={`Room ${room.roomNumber} - ${room.type} - ${room.status}`}
                >
                  {room.roomNumber}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ErrorWidget
            title="Room Status Unavailable"
            message="Room service is currently down."
            severity="warning"
          />
        )}
      </section>

      {/* Pending Payments */}
      {pendingPayments && pendingPayments.count > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Payments</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <StatCard
                title="Total Pending"
                value={`₹${pendingPayments.totalAmount?.toLocaleString() || 0}`}
                subtitle={`${pendingPayments.count} reservations`}
                color="yellow"
                icon={<DollarSign className="w-6 h-6" />}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingPayments.reservations?.slice(0, 6).map((payment: any) => (
                <div key={payment.reservationId} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                  <p className="font-medium text-gray-900">{payment.guestName}</p>
                  <p className="text-sm text-gray-600">₹{payment.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service Health */}
      {serviceHealth && Object.values(serviceHealth).some(s => s !== 'healthy') && (
        <ErrorWidget
          title="Service Issues Detected"
          message="Some services are experiencing issues. Dashboard may show partial data."
          severity="warning"
        />
      )}
    </div>
  );
};

export default ReceptionistDashboard;
