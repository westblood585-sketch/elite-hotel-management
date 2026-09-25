// src/controllers/webhook.controller.ts
import { Request, Response } from 'express'
import { PaymentService } from '../../services/implementation/payment.service'
import {
  verifyRazorpaySignature,
  verifyStripeEvent,
} from '../../utils/webhook.util'
import Stripe from 'stripe'
import NodeCache from 'node-cache'
import logger from '../../utils/logger.service'

// ✅ Cache for processed webhooks (24h TTL)
const processedWebhooks = new NodeCache({ stdTTL: 86400 })

export class WebhookController {
  private svc: PaymentService
  private stripe: Stripe
  

  constructor(svc: PaymentService) {
    this.svc = svc
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-08-27.basil',
    })
  }

  // Stripe webhook handler
  async handleStripe(req: Request, res: Response) {
    try {
      const sig = req.headers['stripe-signature']

      logger.info('Stripe webhook received', {
        correlationId: (req as any).correlationId,
        signature: sig ? 'present' : 'missing',
      })

      const event = verifyStripeEvent(
        (req as any).rawBody || req.body, // fallback to req.body
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || '',
        this.stripe
      )

      // ✅ Idempotency check - prevent duplicate processing
      const eventId = event.id
      if (processedWebhooks.get(eventId)) {
        logger.info('Duplicate webhook detected, skipping', { eventId })
        return res.json({ received: true, duplicate: true })
      }

      // ✅ Timestamp validation - reject events older than 5 minutes
      const eventAge = Date.now() - event.created * 1000
      if (eventAge > 5 * 60 * 1000) {
        logger.warn('Webhook event too old, rejecting', {
          eventId,
          eventAge: `${Math.floor(eventAge / 1000)}s`,
        })
        return res.status(400).send('Event too old')
      }

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const intent = event.data.object as Stripe.PaymentIntent
          const paymentId = intent.metadata?.paymentId

          if (!paymentId) {
            logger.error('Missing paymentId in Stripe metadata', {
              intentId: intent.id,
              metadata: intent.metadata,
            })
            return res.status(400).send('Missing paymentId in metadata')
          }

          await this.svc.updatePaymentStatus(paymentId, 'succeeded', {
            stripeId: intent.id,
          })

          logger.info('Payment succeeded via webhook', {
            paymentId,
            intentId: intent.id,
            amount: intent.amount / 100,
          })
          break
        }

        case 'payment_intent.payment_failed': {
          const intent = event.data.object as Stripe.PaymentIntent
          const paymentId = intent.metadata?.paymentId

          if (!paymentId) {
            logger.error('Missing paymentId in failed payment intent', {
              intentId: intent.id,
            })
            return res.status(400).send('Missing paymentId')
          }

          await this.svc.updatePaymentStatus(paymentId, 'failed', {
            stripeId: intent.id,
            errorMessage: intent.last_payment_error?.message,
          })

          logger.warn('Payment failed via webhook', {
            paymentId,
            intentId: intent.id,
            error: intent.last_payment_error?.message,
          })
          break
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge
          const paymentId = charge.metadata?.paymentId

          if (!paymentId) {
            logger.error('Missing paymentId in refunded charge', {
              chargeId: charge.id,
            })
            return res.status(400).send('Missing paymentId')
          }

          await this.svc.updatePaymentStatus(paymentId, 'refunded', {
            stripeChargeId: charge.id,
          })

          logger.info('Refund processed via webhook', {
            paymentId,
            chargeId: charge.id,
          })
          break
        }

        default:
          logger.debug('Unhandled Stripe event type', { eventType: event.type })
      }

      // ✅ Mark event as processed
      processedWebhooks.set(eventId, true)

      res.json({ received: true })
    } catch (err) {
      logger.error('Stripe webhook error', {
        error: (err as Error).message,
        stack: (err as Error).stack,
        correlationId: (req as any).correlationId,
      })
      res.status(400).send(`Webhook Error: ${(err as any).message}`)
    }
  }

  // Razorpay webhook handler
  async handleRazorpay(req: Request, res: Response) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string
      const body = JSON.stringify(req.body)

      logger.info('Razorpay webhook received', {
        correlationId: (req as any).correlationId,
        signature: signature ? 'present' : 'missing',
      })

      const valid = verifyRazorpaySignature(
        body,
        signature,
        process.env.RAZORPAY_WEBHOOK_SECRET || ''
      )

      if (!valid) {
        logger.error('Invalid Razorpay signature', {
          correlationId: (req as any).correlationId,
        })
        return res.status(400).send('Invalid signature')
      }

      const evt = req.body

      // ✅ Idempotency check for Razorpay
      const eventId = evt.id || `${evt.event}_${evt.created_at}`
      if (processedWebhooks.get(eventId)) {
        logger.info('Duplicate Razorpay webhook, skipping', { eventId })
        return res.json({ received: true, duplicate: true })
      }

      switch (evt.event) {
        case 'payment.captured': {
          const { payment_id, notes } = evt.payload.payment.entity
          const paymentId = notes?.paymentId

          if (!paymentId) {
            logger.error('Missing paymentId in Razorpay payment.captured', {
              paymentIdRazorpay: payment_id,
            })
            
            return res.status(400).send('Missing paymentId')
          }

          await this.svc.updatePaymentStatus(paymentId, 'succeeded', {
            razorpayPaymentId: payment_id,
          })

          logger.info('Razorpay payment captured', {
            paymentId,
            razorpayPaymentId: payment_id,
          })
          break
        }

        case 'payment.failed': {
          const { payment_id, notes, error_description, error_code } = evt.payload.payment.entity
          const paymentId = notes?.paymentId

          if (!paymentId) {
            logger.error('Missing paymentId in Razorpay payment.failed', {
              paymentIdRazorpay: payment_id,
            })
            return res.status(400).send('Missing paymentId')
          }

          await this.svc.updatePaymentStatus(paymentId, 'failed', {
            razorpayPaymentId: payment_id,
            error: error_description || error_code || 'Payment failed',
          })

          logger.warn('Razorpay payment failed', {
            paymentId,
            razorpayPaymentId: payment_id,
            error: error_description,
            code: error_code
          })
          break
        }

        case 'refund.processed': {
          const { id, notes } = evt.payload.refund.entity
          const paymentId = notes?.paymentId

          if (!paymentId) {
            logger.error('Missing paymentId in Razorpay refund.processed', {
              refundId: id,
            })
            return res.status(400).send('Missing paymentId')
          }

          await this.svc.updatePaymentStatus(paymentId, 'refunded', {
            razorpayRefundId: id,
          })

          logger.info('Razorpay refund processed', {
            paymentId,
            razorpayRefundId: id,
          })
          break
        }

        default:
          logger.debug('Unhandled Razorpay event type', {
            eventType: evt.event,
          })
      }

      // ✅ Mark as processed
      processedWebhooks.set(eventId, true)

      res.json({ received: true })
    } catch (err) {
      logger.error('Razorpay webhook error', {
        error: (err as Error).message,
        stack: (err as Error).stack,
        correlationId: (req as any).correlationId,
      })
      res.status(400).send(`Webhook Error: ${(err as any).message}`)
    }
  }
}
