import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store/store'
import { Search, Loader2, User, Calendar, Bed, HelpCircle } from 'lucide-react'
import { useGlobalSearch } from '@/Hooks/useGlobalSearch'

export const GlobalSearch = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const baseRoute = user?.role === 'receptionist' ? '/receptionist' : '/admin'
  const { query, setQuery, results, isLoading } = useGlobalSearch()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Computed flat list of results for keyboard navigation
  const flatResults = [
    ...results.guests.map(g => ({ type: 'guest', id: g._id, path: `${baseRoute}/guests?search=${g.phoneNumber}`, data: g })),
    ...results.reservations.map(r => ({ type: 'reservation', id: r._id, path: `${baseRoute}/reservations?search=${r.code}`, data: r })),
    ...results.rooms.map(r => ({ type: 'room', id: r._id, path: `${baseRoute}/rooms/${r._id}`, data: r }))
  ]

  // Reset selected index when query results change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [results])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSelect = (path: string) => {
    console.log('GlobalSearch navigating to:', path)
    navigate(path)
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex].path)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const hasResults = flatResults.length > 0

  return (
    <div ref={wrapperRef} className="relative w-96 hidden md:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Search globally..." // Updated placeholder
          className="w-full bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-lg pl-10 pr-4 py-2 text-sm outline-none transition-all duration-200"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
           {isLoading ? (
            <Loader2 className="text-blue-500 w-4 h-4 animate-spin" />
          ) : (
            <div className="group relative">
              <HelpCircle className="text-gray-400 w-4 h-4 cursor-help hover:text-gray-600 transition-colors" />
              <div className="absolute right-0 top-8 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
                <div className="font-semibold mb-1 text-gray-300">Searchable Fields:</div>
                <ul className="space-y-1 list-disc list-inside text-gray-400">
                  <li><span className="text-white">Guests:</span> Name, Email, Phone</li>
                  <li><span className="text-white">Reservations:</span> Code or Guest Name</li>
                  <li><span className="text-white">Rooms:</span> Name, Description</li>
                </ul>
                <div className="absolute -top-1 right-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
          {!isLoading && !hasResults && (
            <div className="p-4 text-center text-sm text-gray-500 py-8">
              No results found for "{query}"
            </div>
          )}

          {results.guests.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User size={12} /> Guests
              </div>
              {results.guests.map((guest) => {
                const isSelected = flatResults[selectedIndex]?.id === guest._id && flatResults[selectedIndex]?.type === 'guest'
                return (
                  <button
                    key={guest._id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSelect(`${baseRoute}/guests?search=${encodeURIComponent(guest.phoneNumber)}`)
                    }}
                    className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors group ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-100' : 'hover:bg-gray-50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs">
                      {guest.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        {guest.firstName} {guest.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{guest.phoneNumber}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {results.reservations.length > 0 && (
            <>
              {results.guests.length > 0 && <div className="border-t border-gray-100 my-1" />}
              <div className="py-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> Reservations
                </div>
                {results.reservations.map((res) => {
                  const isSelected = flatResults[selectedIndex]?.id === res._id && flatResults[selectedIndex]?.type === 'reservation'
                  return (
                    <button
                      key={res._id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleSelect(`${baseRoute}/reservations?search=${res.code}`)
                      }}
                      className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors group ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-100' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                        #{res.code.slice(-3)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                          {res.code}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(res.checkIn).toLocaleDateString()} - {res.status}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {results.rooms.length > 0 && (
            <>
              {(results.guests.length > 0 || results.reservations.length > 0) && <div className="border-t border-gray-100 my-1" />}
              <div className="py-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Bed size={12} /> Rooms
                </div>
                {results.rooms.map((room) => {
                  const isSelected = flatResults[selectedIndex]?.id === room._id && flatResults[selectedIndex]?.type === 'room'
                  return (
                    <button
                      key={room._id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleSelect(`${baseRoute}/rooms/${room._id}`)
                      }}
                      className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors group ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-100' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                        {room.number}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                          Room {room.number}
                        </p>
                        <p className="text-xs text-gray-400">{room.type} • {room.available ? 'Available' : 'Occupied'}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
