// src/services/interface/IPayment.service.ts
import { PaymentDoc } from '../../models/payment.model'

export interface IPaymentService {
  initiatePayment(input: {
    reservationId: string
    guestId: string
    amount: number
    currency: string
    provider: 'stripe' | 'razorpay'
  }): Promise<{ payment: PaymentDoc; providerResponse: any }>

  updatePaymentStatus(
    paymentId: string,
    status: 'succeeded' | 'failed' | 'refunded',
    metadata?: any
  ): Promise<PaymentDoc | null>

  list(query: {
    page?: number
    limit?: number
    status?: 'initiated' | 'succeeded' | 'failed' | 'refunded'
    provider?: 'stripe' | 'razorpay'
    minAmount?: number
    maxAmount?: number
    dateFrom?: string
    dateTo?: string
    search?: string
    sortBy?: 'createdAt' | 'amount'
    sortOrder?: 'asc' | 'desc'
    sort?: Array<{ column: string; direction: 'asc' | 'desc' }>
  }): Promise<{ data: PaymentDoc[]; total: number; page: number; limit: number }>

  findAll(filters?: any): Promise<PaymentDoc[]>
  findById(id: string): Promise<PaymentDoc | null>
}
