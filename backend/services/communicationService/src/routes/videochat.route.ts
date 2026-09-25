import express from 'express'
import videoChatController from '../controllers/videochat.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Video call management
router.post('/initiate', (req, res) => videoChatController.initiateCall(req, res))
router.put('/:sessionId/status', (req, res) => videoChatController.updateCallStatus(req, res))
router.get('/history', (req, res) => videoChatController.getCallHistory(req, res))
router.get('/active', (req, res) => videoChatController.getActiveCall(req, res))
router.get('/:sessionId', (req, res) => videoChatController.getCallById(req, res))

// Admin/Staff only: Get all active calls
router.get('/admin/active-calls', (req, res) => videoChatController.getAllActiveCalls(req, res))

export default router
