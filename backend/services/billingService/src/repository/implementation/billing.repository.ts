// src/repository/implementation/billing.repository.ts
import { BillingModel, BillingDoc, LedgerEntry } from '../../models/billing.model'
import { IBillingRepository, PaginatedResult } from '../interface/IBilling.repository'

export class BillingRepository implements IBillingRepository {
  // ... existing methods ...

  async create(data: Partial<BillingDoc>): Promise<BillingDoc> {
    const billing = new BillingModel(data)
    return billing.save()
  }

  async findAll(
    filters?: any,
    options: { page: number; limit: number; sort?: any } = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<BillingDoc>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      BillingModel.find(filters || {})
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      BillingModel.countDocuments(filters || {}),
    ])

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async updateStatus(
    paymentId: string,
    status: BillingDoc['status'],
    ledgerEntry?: { type: string; amount: number; note?: string }
  ): Promise<BillingDoc | null> {
    const update: any = { status }
    if (ledgerEntry) {
      update.$push = { ledger: { ...ledgerEntry, createdAt: new Date() } }
    }
    return BillingModel.findOneAndUpdate({ paymentId }, update, {
      new: true,
    }).exec()
  }

  // Ledger Operations
  async addCharge(
    billingId: string,
    charge: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null> {
    return BillingModel.findByIdAndUpdate(
      billingId,
      {
        $push: { ledger: { ...charge, createdAt: new Date() } },
      },
      { new: true }
    ).exec()
  }

  async addCredit(
    billingId: string,
    credit: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null> {
    return BillingModel.findByIdAndUpdate(
      billingId,
      {
        $push: { ledger: { ...credit, createdAt: new Date() } },
      },
      { new: true }
    ).exec()
  }

  async addRefund(
    billingId: string,
    refund: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null> {
    return BillingModel.findByIdAndUpdate(
      billingId,
      {
        $push: { ledger: { ...refund, createdAt: new Date() } },
      },
      { new: true }
    ).exec()
  }

  async addAdjustment(
    billingId: string,
    adjustment: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null> {
    return BillingModel.findByIdAndUpdate(
      billingId,
      {
        $push: { ledger: { ...adjustment, createdAt: new Date() } },
      },
      { new: true }
    ).exec()
  }

  // Status Management
  async changeStatus(
    billingId: string,
    newStatus: BillingDoc['status'],
    ledgerEntry: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null> {
    return BillingModel.findByIdAndUpdate(
      billingId,
      {
        status: newStatus,
        $push: { ledger: { ...ledgerEntry, createdAt: new Date() } },
      },
      { new: true }
    ).exec()
  }

  // Administrative
  async archive(billingId: string): Promise<BillingDoc | null> {
    return BillingModel.findByIdAndUpdate(
      billingId,
      {
        archived: true,
        archivedAt: new Date(),
        status: 'archived',
        $push: {
          ledger: {
            type: 'status_change',
            amount: 0,
            note: 'Billing archived',
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).exec()
  }

  async getAuditLog(billingId: string): Promise<LedgerEntry[]> {
    const billing = await BillingModel.findById(billingId).select('ledger').exec()
    return billing?.ledger || []
  }

  async updateTotalAmount(
    billingId: string,
    newAmount: number
  ): Promise<BillingDoc | null> {
    return BillingModel.findByIdAndUpdate(
      billingId,
      { amount: newAmount },
      { new: true }
    ).exec()
  }

  // Existing methods
  async findByPaymentId(paymentId: string): Promise<BillingDoc | null> {
    return BillingModel.findOne({ paymentId }).exec()
  }



  async findById(id: string): Promise<BillingDoc | null> {
    return BillingModel.findById(id).exec()
  }

  async findByReservation(reservationId: string): Promise<BillingDoc | null> {
    return BillingModel.findOne({ reservationId }).exec()
  }
}
