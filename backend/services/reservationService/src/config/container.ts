// src/config/container.ts
import { ReservationRepository } from '../repository/implementation/reservation.repository'
import { ReservationService } from '../services/implementation/reservation.service'
import { ReservationController } from '../controllers/implementation/reservation.controller'
import { RoomLookupAdapter } from '../services/adapters/roomLookup.adapter'
import { PaymentOrchestratorAdapter } from '../services/adapters/paymentOrchestrator.adapter'
import { DynamicPricingEngine } from '../services/adapters/dynamicPricingEngine'

// repositories
const reservationRepository = new ReservationRepository()

// cross-service adapters
const roomLookupAdapter = new RoomLookupAdapter() // reads ROOM_SERVICE_URL
const paymentOrchestrator = new PaymentOrchestratorAdapter() // reads PAYMENT_SERVICE_URL
// pricing engine
const pricingEngine = new DynamicPricingEngine()

// services
const reservationService = new ReservationService(
  reservationRepository,
  roomLookupAdapter,
  pricingEngine,
  paymentOrchestrator
)

// controllers
const reservationController = new ReservationController(reservationService)

export {
  reservationRepository,
  reservationService,
  reservationController,
  roomLookupAdapter,
  pricingEngine,
  paymentOrchestrator,
}
