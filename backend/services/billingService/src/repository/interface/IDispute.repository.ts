// src/repository/interface/IDispute.repository.ts
import { DisputeDoc } from '../../models/dispute.model'

export interface DisputeResolution {
  resolutionNote: string
  resolvedBy: string
  status: 'resolved' | 'rejected'
}

export interface IDisputeRepository {
  create(data: Partial<DisputeDoc>): Promise<DisputeDoc>
  findByBillingId(billingId: string): Promise<DisputeDoc[]>
  findById(id: string): Promise<DisputeDoc | null>
  resolve(disputeId: string, resolution: DisputeResolution): Promise<DisputeDoc | null>
  updateStatus(disputeId: string, status: string): Promise<DisputeDoc | null>
  findAll(filters?: any): Promise<DisputeDoc[]>
}
