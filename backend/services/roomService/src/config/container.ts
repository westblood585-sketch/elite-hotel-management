import { RoomRepository } from '../repository/implementation/room.repository'
import { RoomService } from '../services/implementation/room.service'
import { RoomController } from '../controllers/implementation/room.controller'
import { MediaService } from '../services/implementation/media.service'

// repositories
const roomRepository = new RoomRepository()

// services
const mediaService = new MediaService()
const roomService = new RoomService(roomRepository, mediaService)

// controllers
const roomController = new RoomController(roomService)

export { roomRepository, mediaService, roomService, roomController }
