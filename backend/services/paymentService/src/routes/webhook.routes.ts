// src/routes/webhook.routes.ts
import { Router } from 'express'
import { webhookController } from '../config/container'

const router = Router()

// Stripe: needs raw body parsing!
router.post('/stripe', webhookController.handleStripe.bind(webhookController))
router.post(
  '/razorpay',
  webhookController.handleRazorpay.bind(webhookController)
)

export default router
