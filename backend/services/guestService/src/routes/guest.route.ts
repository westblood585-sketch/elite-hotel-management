import express from 'express'
import validateRequest from '../middleware/validateRequest'
import {
  createGuestSchema,
  updateGuestSchema,
  patchGuestSchema,
  ensureGuestSchema,
} from '../validators/guest.validator'
import { guestController } from '../config/container'
import authenticateToken from '../middleware/auth.middleware'
import { authorizeRole } from '../middleware/authorizeRole'
import { upload, validateImageContent } from '../middleware/upload.middleware'

const router = express.Router()

// Create guest (Admin/Receptionist)
router.post(
  '/',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  upload.single('idProofImage'),
  validateImageContent,
  validateRequest(createGuestSchema),
  guestController.create.bind(guestController)
)

// List / Get
router.get(
  '/',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  guestController.list.bind(guestController)
)

router.get(
  '/:id',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  guestController.getById.bind(guestController)
)

// Patch
router.patch(
  '/:id',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  validateRequest(patchGuestSchema),
  guestController.patch.bind(guestController)
)

// Delete
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole(['admin']),
  guestController.remove.bind(guestController)
)

// ID Proof image ops
router.post(
  '/:id/id-proof',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  upload.single('image'),
  validateImageContent,
  guestController.updateIdProofImage.bind(guestController)
)

router.delete(
  '/:id/id-proof',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  guestController.removeIdProofImage.bind(guestController)
)

// Booking-time helper (ReservationService should call this)
router.post(
  '/ensure',
  authenticateToken,
  authorizeRole(['admin', 'receptionist']),
  validateRequest(ensureGuestSchema),
  guestController.ensureForBooking.bind(guestController)
)

export default router
