import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  CreditCard, 
  Users,
  BedDouble,
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Wallet,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store/store';
import * as reservationApi from '@/services/reservationApi';
import { searchAvailableRooms } from '@/services/publicApi';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';

const DeskBooking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';
  
  const [step, setStep] = useState(1);
  const [searchParams, setSearchParams] = useState({
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    guests: 1
  });
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [guestDetails, setGuestDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setIsLoading(true);
    try {
      const rooms = await searchAvailableRooms(searchParams);
      // Mock delay for effect
      await new Promise(resolve => setTimeout(resolve, 600)); 
      setAvailableRooms(rooms);
      setStep(2);
    } catch (error) {
      toast.error('Failed to search rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    try {
      setIsLoading(true);
      const reservationData = {
        roomId: selectedRoom.id || selectedRoom._id,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        adults: searchParams.guests,
        children: 0,
        guestDetails: {
          firstName: guestDetails.firstName,
          lastName: guestDetails.lastName,
          email: guestDetails.email,
          phoneNumber: guestDetails.phone
        },
        paymentProvider: 'Offline',
        requiresPrepayment: paymentMethod === 'pay_later',
        source: isAdmin ? 'Admin' : 'FrontDesk',
        notes: isAdmin 
          ? `Booked by Admin (${user?.fullName || 'System'}). Payment: ${paymentMethod}` 
          : `Desk booking via Receptionist. Payment: ${paymentMethod}`
      };

      await reservationApi.createReservation(reservationData);
      toast.success('Booking confirmed successfully!');
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/receptionist/dashboard');
      }
    } catch (error) {
       console.error(error);
      toast.error('Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
      { id: 1, label: 'Search', icon: Search },
      { id: 2, label: 'Select Room', icon: BedDouble },
      { id: 3, label: 'Checkout', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
      {/* Top Decoration */}
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-serif font-bold text-gray-900">Desk Booking Console</h1>
               <p className="text-gray-500 font-medium">Streamlined reservation process for walk-ins.</p>
            </div>
            
            {/* Step Tracker */}
            <div className="flex items-center bg-white/60 backdrop-blur-md rounded-2xl p-2 border border-white/50 shadow-sm">
                {steps.map((s, idx) => (
                    <div key={s.id} className="flex items-center">
                        <div 
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-500 ${
                                step === s.id 
                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/10' 
                                : step > s.id 
                                ? 'text-green-600 bg-green-50' 
                                : 'text-gray-400'
                            }`}
                        >
                            <s.icon size={16} />
                            <span>{s.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-8 h-0.5 mx-2 ${step > s.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Main Glass Console */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-xl overflow-hidden min-h-[600px] relative">
            <AnimatePresence mode="wait">
                
                {/* Step 1: Search */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="p-8 md:p-16 flex flex-col items-center justify-center h-full min-h-[600px] text-center"
                    >
                        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                            <Calendar className="w-10 h-10 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Check Availability</h2>
                        <p className="text-gray-500 mb-10 max-w-md">Enter check-in dates and guest details to find available rooms.</p>

                        <form onSubmit={handleSearch} className="w-full max-w-4xl bg-white p-4 rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row gap-4">
                            <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all text-left">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Check-in</label>
                                <input 
                                    type="date" 
                                    required
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    value={searchParams.checkIn}
                                    onChange={(e) => {
                                        const newCheckIn = e.target.value;
                                        setSearchParams(prev => ({
                                            ...prev,
                                            checkIn: newCheckIn,
                                            checkOut: prev.checkOut <= newCheckIn ? format(addDays(new Date(newCheckIn), 1), 'yyyy-MM-dd') : prev.checkOut
                                        }));
                                    }}
                                    className="w-full bg-transparent font-bold text-gray-900 outline-none"
                                />
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all text-left">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Check-out</label>
                                <input 
                                    type="date" 
                                    required
                                    min={searchParams.checkIn ? format(addDays(new Date(searchParams.checkIn), 1), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                                    value={searchParams.checkOut}
                                    onChange={(e) => setSearchParams({...searchParams, checkOut: e.target.value})}
                                    className="w-full bg-transparent font-bold text-gray-900 outline-none"
                                />
                            </div>
                            <div className="w-full md:w-48 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all text-left relative">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Guests</label>
                                <select 
                                    value={searchParams.guests}
                                    onChange={(e) => setSearchParams({...searchParams, guests: parseInt(e.target.value)})}
                                    className="w-full bg-transparent font-bold text-gray-900 outline-none appearance-none relative z-10"
                                >
                                    {[1,2,3,4,5,6].map(num => <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>)}
                                </select>
                                <Users className="absolute right-4 bottom-4 text-gray-400 w-5 h-5 pointer-events-none" />
                            </div>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full md:w-auto px-8 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20"
                            >
                                {isLoading ? (
                                    <RefreshCw className="animate-spin" />
                                ) : (
                                    <>
                                        Search <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Step 2: Select Room */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="p-8 h-full flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-6">
                             <div>
                                <h2 className="text-2xl font-bold text-gray-900">Select Room</h2>
                                <p className="text-gray-500 text-sm">Showing available rooms for <span className="font-bold">{searchParams.guests} Guests</span> • {format(new Date(searchParams.checkIn), 'MMM d')} - {format(new Date(searchParams.checkOut), 'MMM d')}</p>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => setStep(1)} className="px-4 py-2 bg-white rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                                    Change Dates
                                </button>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10">
                            {availableRooms.map((room) => (
                                <div 
                                    key={room._id || room.id}
                                    onClick={() => { setSelectedRoom(room); setStep(3); }}
                                    className="group relative bg-white/50 hover:bg-white rounded-3xl p-4 border border-white/60 hover:border-blue-500/30 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer text-left"
                                >
                                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                                        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                        <img src={room.image?.url || room.images?.[0]?.url} alt={room.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-gray-900 shadow-sm">
                                            Room {room.number}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{room.name}</h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-1">{room.type}</p>
                                    
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Price</p>
                                            <p className="text-2xl font-bold text-blue-600">${room.price}</p>
                                        </div>
                                        <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {availableRooms.length === 0 && (
                                <div className="col-span-full py-20 text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <BedDouble className="text-gray-300 w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-400">No rooms available</h3>
                                    <button onClick={() => setStep(1)} className="mt-4 text-blue-600 font-bold hover:underline">Try different dates</button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Checkout */}
                {step === 3 && selectedRoom && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="p-8 h-full"
                    >
                        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                             {/* Left: Form */}
                             <div className="lg:col-span-7 space-y-8">
                                <button onClick={() => setStep(2)} className="flex items-center text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors mb-4">
                                    <ArrowLeft size={16} className="mr-1" /> Back to Rooms
                                </button>
                                
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">1</span>
                                            Guest Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input 
                                                type="text" 
                                                placeholder="First Name" 
                                                value={guestDetails.firstName}
                                                onChange={e => setGuestDetails({...guestDetails, firstName: e.target.value})}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Last Name" 
                                                value={guestDetails.lastName}
                                                onChange={e => setGuestDetails({...guestDetails, lastName: e.target.value})}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                                            />
                                            <input 
                                                type="email" 
                                                placeholder="Email Address" 
                                                value={guestDetails.email}
                                                onChange={e => setGuestDetails({...guestDetails, email: e.target.value})}
                                                className="col-span-2 w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                                            />
                                            <input 
                                                type="tel" 
                                                placeholder="Phone Number" 
                                                value={guestDetails.phone}
                                                onChange={e => setGuestDetails({...guestDetails, phone: e.target.value})}
                                                className="col-span-2 w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">2</span>
                                            Payment Method
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { id: 'cash', label: 'Cash', icon: Wallet },
                                                { id: 'card_machine', label: 'Cash Machine', icon: CreditCard },
                                                { id: 'pay_later', label: 'Pay Later', icon: Clock }
                                            ].map((method) => (
                                                <div 
                                                    key={method.id}
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    className={`cursor-pointer p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                                                        paymentMethod === method.id 
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                        : 'border-gray-100 bg-white hover:border-gray-200 text-gray-500'
                                                    }`}
                                                >
                                                    <method.icon size={24} />
                                                    <span className="font-bold text-sm">{method.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* Right: Summary */}
                             <div className="lg:col-span-5">
                                 <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-full flex flex-col">
                                     {/* Background patterns */}
                                     <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
                                     
                                     <h3 className="text-lg font-bold text-gray-300 mb-6 uppercase tracking-widest">Booking Summary</h3>
                                     
                                     <div className="flex-1 space-y-6">
                                         <div className="flex gap-4 items-start pb-6 border-b border-gray-800">
                                             <img src={selectedRoom.image?.url || selectedRoom.images?.[0]?.url} className="w-20 h-20 rounded-xl object-cover" alt="Room" />
                                             <div>
                                                 <h4 className="text-xl font-bold">{selectedRoom.name}</h4>
                                                 <p className="text-gray-400">Room #{selectedRoom.number}</p>
                                             </div>
                                         </div>

                                         <div className="space-y-4 text-sm">
                                             <div className="flex justify-between">
                                                 <span className="text-gray-400">Check-in</span>
                                                 <span className="font-bold">{format(new Date(searchParams.checkIn), 'MMM dd, yyyy')}</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span className="text-gray-400">Check-out</span>
                                                 <span className="font-bold">{format(new Date(searchParams.checkOut), 'MMM dd, yyyy')}</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span className="text-gray-400">Guests</span>
                                                 <span className="font-bold">{searchParams.guests} Adults</span>
                                             </div>
                                         </div>
                                     </div>

                                     <div className="mt-8 pt-8 border-t border-gray-800">
                                         <div className="flex justify-between items-end mb-6">
                                             <span className="text-gray-400 font-medium">Total Due</span>
                                             <span className="text-4xl font-bold text-white">
                                                 ${selectedRoom.price * Math.ceil((new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) / (1000 * 60 * 60 * 24))}
                                             </span>
                                         </div>

                                         <button 
                                            onClick={handleBooking}
                                            disabled={isLoading || !guestDetails.firstName || !guestDetails.email}
                                            className="w-full py-5 bg-white text-gray-900 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                         >
                                             {isLoading ? 'Processing...' : (
                                                 <>
                                                    <Sparkles size={20} className="text-blue-600" /> Confirm Booking
                                                 </>
                                             )}
                                         </button>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DeskBooking;
