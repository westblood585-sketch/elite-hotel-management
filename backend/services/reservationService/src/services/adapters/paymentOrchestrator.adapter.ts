// src/services/adapters/paymentOrchestrator.adapter.ts
import axios from 'axios'
import { IPaymentOrchestrator } from '../interface/IReservation.service'

export class PaymentOrchestratorAdapter implements IPaymentOrchestrator {
  private baseUrl: string
  constructor(
    baseUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4006'
  ) {
    this.baseUrl = baseUrl
  }
  async createPaymentIntent(params: {
    provider: 'Stripe' | 'Razorpay'
    amount: number
    currency: string
    reservationCode: string
    customer: { guestId: string; email?: string; phoneNumber?: string }
    metadata?: Record<string, any>
  }) {
    // Delegates to PaymentService
    const payload = {
      reservationId: params.metadata?.reservationId,
      guestId: params.customer.guestId,
      guestContact: {
        email: params.customer.email,
        phoneNumber: params.customer.phoneNumber
      },
      amount: params.amount,
      currency: params.currency,
      provider: params.provider.toLowerCase(),
    }

    const res = await axios.post(`${this.baseUrl}/initiate`, payload)
    
    // PaymentService returns { payment: PaymentDoc, providerResponse: any }
    // We need to return { id, clientSecret?, provider, extra? }
    
    const { payment, providerResponse } = res.data
    
    return {
       id: payment._id, // Internal payment ID
       provider: payment.provider,
       clientSecret: params.provider === 'Stripe' ? (providerResponse as any).client_secret : undefined,
       extra: params.provider === 'Razorpay' ? providerResponse : undefined
    }
  }
}
