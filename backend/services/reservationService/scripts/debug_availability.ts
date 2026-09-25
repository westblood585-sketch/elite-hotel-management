
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { RoomLookupAdapter } from '../src/services/adapters/roomLookup.adapter'
import { ReservationRepository } from '../src/repository/implementation/reservation.repository'

dotenv.config()

async function run() {
  try {
    // 1. Connect to DB
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/reservation_db'
    console.log('Connecting to', uri)
    await mongoose.connect(uri)
    console.log('Connected to DB')

    // 2. Fetch Rooms
    const roomLookup = new RoomLookupAdapter()
    const allRooms = await roomLookup.getAllRooms()
    console.log(`Fetched ${allRooms.length} rooms from RoomService`)

    const targetRoom = allRooms.find(r => r.number === 4) // "Room #4" from screenshot
    if (!targetRoom) {
      console.error('Room #4 not found in RoomService listing!')
      // List all brief info
      console.log('Available rooms:', allRooms.map(r => `#${r.number} (${r.name})`))
    } else {
      console.log('Found Room #4:', {
        id: targetRoom.id,
        available: targetRoom.available,
        name: targetRoom.name
      })

      if (!targetRoom.available) {
        console.warn('WARNING: Room #4 is marked as unavailable in RoomService!')
      }
      
      // 3. Fetch Overlapping Reservations
      // Dates from screenshot: 12-12-2025 to 14-12-2025
      const checkIn = new Date('2025-12-12T00:00:00.000Z')
      const checkOut = new Date('2025-12-14T00:00:00.000Z')
      
      const repo = new ReservationRepository()
      const overlaps = await repo.findAll({
        roomId: targetRoom.id,
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
        status: { $in: ['PendingPayment', 'Confirmed', 'CheckedIn'] }
      })
      
      console.log(`Found ${overlaps.length} overlapping reservations for Room #4 during Dec 12-14, 2025:`)
      overlaps.forEach(r => {
        console.log(` - [${r.status}] ${r.code} (${r.checkIn.toISOString().split('T')[0]} to ${r.checkOut.toISOString().split('T')[0]}) Guest: ${r.guestId}`)
      })
    }

  } catch (err) {
    console.error('Error:', err)
  } finally {
    await mongoose.disconnect()
    process.exit()
  }
}

run()
