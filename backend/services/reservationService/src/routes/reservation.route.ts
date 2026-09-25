// src/routes/reservation.route.ts
import express from 'express'
import authenticateToken from '../middleware/auth.middleware'
import { authorizeRole } from '../middleware/authorizeRole'
import validateRequest from '../middleware/validateRequest'
import { reservationController } from '../config/container'
import {
  quoteSchema,
  createReservationSchema,
  listReservationSchema,
  patchReservationSchema,
} from '../validators/reservation.validator'

const router = express.Router()

// Public/Online quote (no auth if you want to expose public pricing)
router.post(
  '/quote',
  validateRequest(quoteSchema),
  reservationController.quote.bind(reservationController)
)

// Create reservation
router.post(
  '/',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']), // if online guest booking, you can relax this or move to a different public route
  validateRequest(createReservationSchema),
  reservationController.create.bind(reservationController)
)

// For guests (Online Booking)
router.post(
  '/public',
  validateRequest(createReservationSchema),
  reservationController.createPublic.bind(reservationController)
)

  // Check Availability (Public)
  router.post(
    '/available-rooms',
    // Add validation schema if needed, e.g., validateRequest(availabilitySchema)
    reservationController.checkAvailability.bind(reservationController)
  )

  // Guest Lookup (Public)
  router.post(
    '/public/guest-lookup',
    reservationController.lookupGuest.bind(reservationController)
  )

// List / Get
router.get(
  '/my-reservations',
  authenticateToken,
  reservationController.myReservations.bind(reservationController)
)

router.post(
  '/public/lookup',
  reservationController.publicLookup.bind(reservationController)
)

router.get(
  '/',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  validateRequest(listReservationSchema),
  reservationController.list.bind(reservationController)
)
router.get(
  '/:id',
  authenticateToken,
  reservationController.getById.bind(reservationController)
)
router.get(
  '/code/:code',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  reservationController.getByCode.bind(reservationController)
)

// Patch (date/room changes)
router.patch(
  '/:id',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  validateRequest(patchReservationSchema),
  reservationController.patch.bind(reservationController)
)

// Status transitions
router.post(
  '/:id/confirm',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  reservationController.confirm.bind(reservationController)
)
router.post(
  '/:id/cancel',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  reservationController.cancel.bind(reservationController)
)
router.post(
  '/:id/check-in',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  reservationController.checkIn.bind(reservationController)
)
router.post(
  '/:id/check-out',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  reservationController.checkOut.bind(reservationController)
)

// Analytics endpoints
import { ReservationAnalyticsController } from '../controllers/reservation.analytics.controller';
import { Reservation } from '../models/reservation.model';

const reservationAnalyticsController = new ReservationAnalyticsController(Reservation);

router.get('/analytics/occupancy', reservationAnalyticsController.getOccupancyMetrics.bind(reservationAnalyticsController));
router.get('/analytics/today-activity', reservationAnalyticsController.getTodayActivity.bind(reservationAnalyticsController));
router.get('/analytics/recent-activity', reservationAnalyticsController.getRecentActivity.bind(reservationAnalyticsController));
router.get('/analytics/room-context', reservationAnalyticsController.getRoomContext.bind(reservationAnalyticsController));

export default router
