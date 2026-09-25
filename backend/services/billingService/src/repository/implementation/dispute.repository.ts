// src/repository/implementation/dispute.repository.ts
import { DisputeModel, DisputeDoc } from '../../models/dispute.model'
import { IDisputeRepository, DisputeResolution } from '../interface/IDispute.repository'

export class DisputeRepository implements IDisputeRepository {
  async create(data: Partial<DisputeDoc>): Promise<DisputeDoc> {
    const dispute = new DisputeModel(data)
    return dispute.save()
  }

  async findByBillingId(billingId: string): Promise<DisputeDoc[]> {
    return DisputeModel.find({ billingId }).sort({ createdAt: -1 }).exec()
  }

  async findById(id: string): Promise<DisputeDoc | null> {
    return DisputeModel.findById(id).exec()
  }

  async resolve(disputeId: string, resolution: DisputeResolution): Promise<DisputeDoc | null> {
    return DisputeModel.findByIdAndUpdate(
      disputeId,
      {
        status: resolution.status,
        resolutionNote: resolution.resolutionNote,
        resolvedBy: resolution.resolvedBy,
      },
      { new: true }
    ).exec()
  }

  async updateStatus(disputeId: string, status: string): Promise<DisputeDoc | null> {
    return DisputeModel.findByIdAndUpdate(
      disputeId,
      { status },
      { new: true }
    ).exec()
  }

  async findAll(filters?: any): Promise<DisputeDoc[]> {
    return DisputeModel.find(filters || {}).sort({ createdAt: -1 }).exec()
  }
}
