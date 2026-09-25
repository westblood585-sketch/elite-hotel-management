// src/utils/webhook.util.ts
import crypto from 'crypto'
import Stripe from 'stripe'

export function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string
) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return expected === signature
}

export function verifyStripeEvent(
  payload: Buffer,
  sig: string | string[] | undefined,
  secret: string,
  stripe: Stripe
) {
  return stripe.webhooks.constructEvent(payload, sig as string, secret)
}
