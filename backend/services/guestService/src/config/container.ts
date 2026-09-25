// src/config/container.ts
import { GuestRepository } from '../repository/implementation/guest.repository'
import { GuestService } from '../services/implementation/guest.service'
import { GuestController } from '../controllers/implementation/guest.controller'

// repositories
const guestRepository = new GuestRepository()

// services (re-use existing MediaService instance you already export)
import { MediaService } from '../services/implementation/media.service'
const mediaService = new MediaService()
const guestService = new GuestService(guestRepository, mediaService)

// controllers
const guestController = new GuestController(guestService)

export { guestRepository, guestService, guestController }
