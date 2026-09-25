import express from 'express'
import authenticateToken from '../middleware/auth.middleware'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller'

const router = express.Router()

router.get('/', authenticateToken, getNotifications)
router.put('/:id/read', authenticateToken, markAsRead)
router.put('/read-all', authenticateToken, markAllAsRead)
router.delete('/:id', authenticateToken, deleteNotification)

export default router
