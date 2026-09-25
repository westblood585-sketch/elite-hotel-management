import express from 'express'
import validateRequest from '../middleware/validateRequest'
import {
  createRoomSchema,
  updateRoomSchema,
  patchRoomSchema,
} from '../validators/room.validator'
import { roomController } from '../config/container'
import authenticateToken from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'
import { authorizeRole } from '../middleware/authorizeRole'

const router = express.Router()

/**
 * Upload room image + details in one multipart/form-data request
 * field name for image: "image"
 */
router.post(
  '/',
  authenticateToken,
  authorizeRole(['admin']),
  upload.single('image'),
  validateRequest(createRoomSchema),
  roomController.create.bind(roomController)
)

router.get('/', roomController.list.bind(roomController))

router.get('/:id', roomController.getById.bind(roomController))

router.patch(
  '/:id',
  authenticateToken,
  authorizeRole(['admin']),
  upload.array('images'),
  validateRequest(patchRoomSchema),
  roomController.patch.bind(roomController)
)

router.delete(
  '/:id',
  authenticateToken,
  authorizeRole(['admin']),
  roomController.remove.bind(roomController)
)

// Analytics endpoints
import { RoomAnalyticsController } from '../controllers/implementation/room.analytics.controller';
import { roomService } from '../config/container';

const roomAnalyticsController = new RoomAnalyticsController(roomService);

router.get('/analytics/inventory', roomAnalyticsController.getInventoryAnalytics.bind(roomAnalyticsController));
router.get('/analytics/room-status', roomAnalyticsController.getRoomStatusGrid.bind(roomAnalyticsController));

export default router
