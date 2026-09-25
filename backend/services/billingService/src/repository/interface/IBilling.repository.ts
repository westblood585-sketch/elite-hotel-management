import { BillingDoc, LedgerEntry } from '../../models/billing.model'

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

export interface IBillingRepository {
  create(data: Partial<BillingDoc>): Promise<BillingDoc>

  updateStatus(
    paymentId: string,
    status: BillingDoc['status'],
    ledgerEntry?: { type: string; amount: number; note?: string }
  ): Promise<BillingDoc | null>

  // Ledger operations
  addCharge(
    billingId: string,
    charge: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null>

  addCredit(
    billingId: string,
    credit: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null>

  addRefund(
    billingId: string,
    refund: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null>

  addAdjustment(
    billingId: string,
    adjustment: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null>

  // Status management
  changeStatus(
    billingId: string,
    newStatus: BillingDoc['status'],
    ledgerEntry: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null>

  // Administrative
  archive(billingId: string): Promise<BillingDoc | null>
  getAuditLog(billingId: string): Promise<LedgerEntry[]>
  updateTotalAmount(billingId: string, newAmount: number): Promise<BillingDoc | null>

  // Existing methods
  findByPaymentId(paymentId: string): Promise<BillingDoc | null>
  findAll(
    filters?: any,
    options?: { page: number; limit: number; sort?: any }
  ): Promise<PaginatedResult<BillingDoc>>
  findById(id: string): Promise<BillingDoc | null>
  findByReservation(reservationId: string): Promise<BillingDoc | null>
}
