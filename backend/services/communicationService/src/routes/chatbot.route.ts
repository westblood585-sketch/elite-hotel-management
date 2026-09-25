import express from 'express'
import chatbotController from '../controllers/chatbot.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = express.Router()

// Guest token generation (Public)
router.post('/guest-token', (req, res) => chatbotController.getGuestToken(req, res))

// Available Staff (Public/Guest)
router.get('/available-staff', (req, res) => chatbotController.getAvailableStaff(req, res))

// All routes AFTER this require authentication
router.use(authenticateToken)

// conversation management
router.post('/conversation', (req, res) => chatbotController.createConversation(req, res))
router.get('/conversations', (req, res) => chatbotController.getConversations(req, res))
router.get('/conversation/:conversationId', (req, res) =>
  chatbotController.getConversationById(req, res)
)
router.delete('/conversation/:conversationId', (req, res) =>
  chatbotController.closeConversation(req, res)
)

// Messaging
router.post('/message', (req, res) => chatbotController.sendMessage(req, res))

// Context and handoff
router.put('/context/:conversationId', (req, res) => chatbotController.updateContext(req, res))
router.post('/handoff', (req, res) => chatbotController.handoffToAgent(req, res))
router.post('/return-to-bot', (req, res) => chatbotController.returnToBot(req, res))

// Analytics endpoints (public - no auth needed for API Gateway aggregation)
import { CommunicationAnalyticsController } from '../controllers/communication.analytics.controller';

// Note: These endpoints will be called by API Gateway, so removing auth requirement
const communicationAnalyticsController = new CommunicationAnalyticsController(null, null);

// Create a separate router without auth middleware for analytics
const analyticsRouter = express.Router();
analyticsRouter.get('/analytics/metrics', (req, res, next) => communicationAnalyticsController.getCommunicationMetrics(req, res, next));
analyticsRouter.get('/analytics/live', (req, res, next) => communicationAnalyticsController.getLiveCommunication(req, res, next));

// Combine routers
const combinedRouter = express.Router();
combinedRouter.use('/', router);
combinedRouter.use('/', analyticsRouter);

export default combinedRouter
