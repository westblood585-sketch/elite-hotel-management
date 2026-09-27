import { useState, useEffect } from 'react'
import { fetchGuests } from '@/services/guestApi'
import type { Guest } from '@/services/guestApi'
import { fetchReservations, fetchRooms } from '@/services/adminApi'
import type { Reservation, Room } from '@/services/adminApi'
import { useDebounce } from './useDebounce'

export interface SearchResults {
  guests: Guest[]
  reservations: Reservation[]
  rooms: Room[]
}

export const useGlobalSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({
    guests: [],
    reservations: [],
    rooms: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setResults({ guests: [], reservations: [], rooms: [] })
        return
      }

      setIsLoading(true)
      try {
        const [guestsResult, reservationsResult, roomsResult] = await Promise.allSettled([
          fetchGuests({ search: debouncedQuery, limit: 5 }),
          fetchReservations({ search: debouncedQuery, limit: 5 }),
          fetchRooms({ search: debouncedQuery, limit: 5 })
        ])

        setResults({
          guests: guestsResult.status === 'fulfilled' ? guestsResult.value.data : [],
          reservations: reservationsResult.status === 'fulfilled' ? reservationsResult.value.data : [],
          rooms: roomsResult.status === 'fulfilled' ? roomsResult.value.data : []
        })

        if (guestsResult.status === 'rejected') console.error('Guests search failed:', guestsResult.reason)
        if (reservationsResult.status === 'rejected') console.error('Reservations search failed:', reservationsResult.reason)
        if (roomsResult.status === 'rejected') console.error('Rooms search failed:', roomsResult.reason)
      } catch (error) {
        console.error('Global search failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  return { query, setQuery, results, isLoading }
}
