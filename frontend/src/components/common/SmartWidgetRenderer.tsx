import React from 'react';
import { Calendar, CreditCard, Utensils } from 'lucide-react';

interface SmartWidgetProps {
  type: 'room_service_menu' | 'bill_summary' | 'booking_card' | string;
  data: any;
}

export const SmartWidgetRenderer: React.FC<SmartWidgetProps> = ({ type, data }) => {
  switch (type) {
    case 'booking_card':
      return (
        <div className="mt-2 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="bg-blue-600 p-3 flex items-center gap-2 text-white">
            <Calendar className="w-4 h-4" />
            <span className="font-semibold text-sm">Booking Details</span>
          </div>
          <div className="p-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Room</span>
              <span className="font-medium">{data.room}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Dates</span>
              <span className="font-medium">{data.dates}</span>
            </div>
            <div className="mt-2 text-right">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                data.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {data.status}
              </span>
            </div>
          </div>
        </div>
      );

    case 'bill_summary':
      return (
        <div className="mt-2 bg-white rounded-xl shadow-md p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3 text-gray-800">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span className="font-semibold">Current Bill</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center mb-3">
            <span className="text-gray-600">Total</span>
            <span className="text-xl font-bold text-gray-900">{data.total}</span>
          </div>
          <button className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Pay Now
          </button>
        </div>
      );

    case 'room_service_menu':
      return (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-2 text-gray-700">
            <Utensils className="w-4 h-4" />
            <span className="font-medium text-sm">Popular Items</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {data.items?.map((item: string, idx: number) => (
              <div key={idx} className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-2 shadow-sm min-w-[100px] text-center">
                <div className="w-full h-12 bg-gray-100 rounded mb-1 animate-pulse" />
                <span className="text-xs font-medium block">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
};
