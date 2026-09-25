// src/service/interface/IDispute.service.ts
import { DisputeDoc } from '../../models/dispute.model'
import { DisputeResolution } from '../../repository/interface/IDispute.repository'

export interface IDisputeService {
  createDispute(billingId: string, reason: string, createdBy: string): Promise<DisputeDoc>
  getDisputesByBilling(billingId: string): Promise<DisputeDoc[]>
  getDisputeById(id: string): Promise<DisputeDoc | null>
  resolveDispute(disputeId: string, resolution: DisputeResolution): Promise<DisputeDoc | null>
  updateDisputeStatus(disputeId: string, status: string): Promise<DisputeDoc | null>
  getAllDisputes(filters?: any): Promise<DisputeDoc[]>
}
