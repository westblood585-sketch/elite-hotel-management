import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { dashboardApi } from '@/services/dashboardApi';
import { format, subDays, subMonths, subYears, isSameDay, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, setMonth, setYear, getYear, getMonth } from 'date-fns';

interface RevenueChartProps {}

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type FilterType = 'week' | 'month' | 'year' | 'custom';



const RevenueChart: React.FC<RevenueChartProps> = () => {
  const [filter, setFilter] = useState<FilterType>('month');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    }

    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange>({ from: undefined, to: undefined });

  // Fetch data from API
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      let start = new Date();
      let end = new Date();
      let interval: 'day' | 'month' = 'day';

      if (filter === 'week') {
        start = subDays(new Date(), 7);
        interval = 'day';
      } else if (filter === 'month') {
        start = subMonths(new Date(), 1);
        interval = 'day';
      } else if (filter === 'year') {
        start = subYears(new Date(), 1);
        interval = 'month';
      } else if (filter === 'custom' && dateRange.from && dateRange.to) {
        start = dateRange.from;
        end = dateRange.to;
        // Determine interval based on range duration
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        interval = daysDiff > 60 ? 'month' : 'day';
      } else {
        return; // Don't fetch if custom range is incomplete
      }

      try {
        // Pass signal to API if dashboardApi supports it, otherwise just handle logic flow
        // dashboardApi implementation doesn't seem to take signal, but we can prevent state update
        const data = await dashboardApi.getRevenueChartData(
          start.toISOString(), 
          end.toISOString(), 
          interval
        );
        
        if (!controller.signal.aborted) {
             const formattedData = data.map((item: any) => ({
                name: item.date,
                revenue: item.amount
            }));
            setChartData(formattedData);
        }
      } catch (error: any) {
        if (!controller.signal.aborted) {
            console.error("Failed to fetch revenue data", error);
            // Don't clear data immediately on error to prevent flashing or loops if error is persistent
            // setChartData([]); 
        }
      }
    };

    fetchData();

    return () => {
        controller.abort();
    };
  }, [filter, dateRange]);


  const handleFilterChange = (newFilter: FilterType) => {
    if (newFilter === 'custom') {
      setIsPickerOpen(true);
      // Initialize picker state with current selection or defaults
      setSelectedRange(dateRange.from ? dateRange : { from: undefined, to: undefined });
      setCurrentMonth(dateRange.from || new Date());
    } else {
      setFilter(newFilter);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    const newDate = setMonth(currentMonth, newMonth);
    setCurrentMonth(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if(!isNaN(val) && val > 1900 && val < 2100) {
          setCurrentMonth(setYear(currentMonth, val));
      }
  };

  const handleDayClick = (day: Date) => {
    if (!selectedRange.from || (selectedRange.from && selectedRange.to)) {
      setSelectedRange({ from: day, to: undefined });
    } else {
        if (day < selectedRange.from) {
            setSelectedRange({ from: day, to: selectedRange.from });
        } else {
            setSelectedRange({ ...selectedRange, to: day });
        }
    }
  };

  const applyCustomRange = () => {
      if (selectedRange.from && selectedRange.to) {
          setDateRange(selectedRange);
          setFilter('custom');
          setIsPickerOpen(false);
      }
  };

  const renderCalendar = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });
    const startDay = getDay(start); // 0 (Sun) to 6 (Sat)
    
    // Adjust for Monday start if needed, but standard is usually Sun=0
    // Let's assume Mon=0 for the image provided (Mon Tue Wed...)
    // The image: Mon Tue Wed Thu Fri Sat Sun. So we need to shift.
    const padding = startDay === 0 ? 6 : startDay - 1; 

    return (
        <div className="grid grid-cols-7 gap-y-2 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-purple-700">{d}</div>
            ))}
            {Array.from({ length: padding }).map((_, i) => (
                <div key={`pad-${i}`} />
            ))}
            {daysInMonth.map(day => {
                const isSelectedStart = selectedRange.from && isSameDay(day, selectedRange.from);
                const isSelectedEnd = selectedRange.to && isSameDay(day, selectedRange.to);
                const isInRange = selectedRange.from && selectedRange.to && isWithinInterval(day, { start: selectedRange.from, end: selectedRange.to });

                let dayClasses = "h-8 w-8 flex items-center justify-center text-sm relative z-10 cursor-pointer rounded-full transition-colors ";
                
                if (isSelectedStart || isSelectedEnd) {
                    dayClasses += "bg-purple-700 text-white font-bold hover:bg-purple-800";
                } else if (isInRange) {
                     // We need a way to style the strip.
                     // The strip itself is usually a background on the parent or a pseudo-element.
                     // For simplicity, we can style the button itself but for the continuous strip look:
                     dayClasses += "bg-purple-200 text-purple-900 hover:bg-purple-300 rounded-none";
                     // Add rounded corners for the ends of the week row if needed, but simpler first.
                } else {
                    dayClasses += "text-gray-700 hover:bg-purple-50";
                }
                
                // wrapper for connection strip visual
                const isStart = isSelectedStart;
                const isEnd = isSelectedEnd;
                const isMiddle = isInRange && !isStart && !isEnd;

                // To achieve the perfect strip:
                // If it's the start, rounded-l-full. If end, rounded-r-full. If middle, no rounded.
                if (isStart && selectedRange.to) dayClasses = dayClasses.replace("rounded-full", "rounded-l-full");
                if (isEnd && selectedRange.from) dayClasses = dayClasses.replace("rounded-full", "rounded-r-full");
                if (isMiddle) dayClasses = dayClasses.replace("rounded-full", "");


                return (
                    <div key={day.toString()} className="flex justify-center" onClick={() => handleDayClick(day)}>
                         <button className={dayClasses}>
                            {format(day, 'd')}
                         </button>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/50 w-full relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Total Revenue</h2>
          <p className="text-gray-500 text-sm mt-1">
             {filter === 'custom' && dateRange.from && dateRange.to 
                ? `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}` 
                : 'Revenue analytics overview'}
          </p>
        </div>
        
        <div className="flex bg-gray-50 p-1 rounded-lg self-start md:self-auto overflow-x-auto max-w-full">
            {(['week', 'month', 'year'] as FilterType[]).map((f) => (
                <button
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        filter === f 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    {f === 'week' ? 'Last Week' : f === 'month' ? 'Last Month' : 'Year'}
                </button>
            ))}
             <button
                onClick={() => handleFilterChange('custom')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    filter === 'custom'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
            >
                <Calendar size={14} />
                Custom
            </button>
        </div>
      </div>

      <div className="h-[350px] w-full">
        {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }} 
                    tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#3B82F6', fontWeight: 600 }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                />
            </AreaChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="mb-2 bg-gray-50 p-3 rounded-full">
                    <AreaChart className="w-6 h-6 text-gray-300" /> {/* Just an icon representation */}
                </div>
                <p>No revenue data available for this period</p>
            </div>
        )}
      </div>

      {/* Custom Date Picker Modal */}
      {isPickerOpen && (
        <div ref={pickerRef} className="absolute top-16 right-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-6 w-[340px] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Select Range</h3>
                <button onClick={() => setIsPickerOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                </button>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between mb-4 gap-2">
                 <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                    <ChevronLeft size={20} />
                 </button>
                 
                 <div className="flex items-center gap-2">
                    <div className="relative">
                        <select 
                            value={getMonth(currentMonth)} 
                            onChange={handleMonthChange}
                            className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 pl-3 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        >
                            {months.map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                    <input 
                        type="number"
                        value={getYear(currentMonth)}
                        onChange={handleYearChange}
                        className="w-16 bg-gray-50 border border-gray-200 text-gray-700 py-1 px-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                    />
                 </div>

                 <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                    <ChevronRight size={20} />
                 </button>
            </div>

            {/* Calendar Grid */}
            <div className="mb-6">
                {renderCalendar()}
            </div>

             {/* Footer Actions */}
             <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button 
                    onClick={() => setSelectedRange({ from: undefined, to: undefined })}
                    className="text-sm font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5"
                >
                    Clear
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsPickerOpen(false)}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={applyCustomRange}
                        disabled={!selectedRange.from || !selectedRange.to}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200"
                    >
                        Confirm
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;
