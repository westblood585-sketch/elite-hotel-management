import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.middleware'
import { Notification } from '../models/notification.model'
import logger from '../utils/logger.service'

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.query
    const userId = req.user?.id
    const userRole = req.user?.role

    // Security check: only allow querying own role unless admin
    if (role && role !== userRole && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const query: any = {
      $or: [
        { recipientRole: role || userRole }, // Role-based (e.g. all receptionists)
        { userId: userId }, // specific to this user
      ],
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const unreadCount = await Notification.countDocuments({
      ...query,
      read: false,
    })

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    })
  } catch (err) {
    logger.error('Get notifications error', { error: err })
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Not found' })
    }

    res.json({ success: true, data: notification })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const userRole = req.user?.role

    const query: any = {
      $or: [{ recipientRole: userRole }, { userId: userId }],
      read: false,
    }

    await Notification.updateMany(query, { read: true })
    res.json({ success: true, message: 'All marked as read' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const notification = await Notification.findByIdAndDelete(id)

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Not found' })
    }

    res.json({ success: true, message: 'Notification deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
