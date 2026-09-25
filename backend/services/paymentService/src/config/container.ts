// src/config/container.ts
import { PaymentRepository } from '../repository/implementation/payment.repository'
import { PaymentService } from '../services/implementation/payment.service'
import { PaymentController } from '../controllers/implementation/payment.controller'
import { WebhookController } from '../controllers/implementation/webhook.controller'

const paymentRepository = new PaymentRepository()
export const paymentService = new PaymentService(paymentRepository)
export const paymentController = new PaymentController(paymentService)
export const webhookController = new WebhookController(paymentService)
