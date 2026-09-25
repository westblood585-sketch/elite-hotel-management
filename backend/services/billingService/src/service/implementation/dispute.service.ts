// src/service/implementation/dispute.service.ts
import { DisputeRepository } from '../../repository/implementation/dispute.repository'
import { BillingRepository } from '../../repository/implementation/billing.repository'
import { DisputeDoc } from '../../models/dispute.model'
import { DisputeResolution } from '../../repository/interface/IDispute.repository'
import { IDisputeService } from '../interface/IDispute.service'
import logger from '../../utils/logger.service'

export class DisputeService implements IDisputeService {
  constructor(
    private disputeRepo: DisputeRepository,
    private billingRepo: BillingRepository
  ) {}

  async createDispute(
    billingId: string,
    reason: string,
    createdBy: string
  ): Promise<DisputeDoc> {
    logger.info('Creating dispute', { billingId, createdBy })

    // Check if billing exists
    const billing = await this.billingRepo.findById(billingId)
    if (!billing) {
      throw new Error('Billing not found')
    }

    // Create dispute
    const dispute = await this.disputeRepo.create({
      billingId: billing._id,
      reason,
      status: 'open',
      createdBy,
    } as any)

    // Link dispute to billing
    await this.billingRepo.findById(billingId)
    // Note: Linking is done via billingId in dispute, no need to update billing document

    logger.info('Dispute created', {
      disputeId: dispute._id,
      billingId,
    })

    return dispute
  }

  async getDisputesByBilling(billingId: string): Promise<DisputeDoc[]> {
    logger.info('Fetching disputes for billing', { billingId })
    return this.disputeRepo.findByBillingId(billingId)
  }

  async getDisputeById(id: string): Promise<DisputeDoc | null> {
    logger.info('Fetching dispute by ID', { id })
    return this.disputeRepo.findById(id)
  }

  async resolveDispute(
    disputeId: string,
    resolution: DisputeResolution
  ): Promise<DisputeDoc | null> {
    logger.info('Resolving dispute', { disputeId, resolution })

    const dispute = await this.disputeRepo.resolve(disputeId, resolution)
    if (dispute) {
      logger.info('Dispute resolved', {
        disputeId,
        status: resolution.status,
        resolvedBy: resolution.resolvedBy,
      })
    }

    return dispute
  }

  async updateDisputeStatus(disputeId: string, status: string): Promise<DisputeDoc | null> {
    logger.info('Updating dispute status', { disputeId, status })
    return this.disputeRepo.updateStatus(disputeId, status)
  }

  async getAllDisputes(filters?: any): Promise<DisputeDoc[]> {
    logger.info('Fetching all disputes', { filters })
    return this.disputeRepo.findAll(filters)
  }
}
