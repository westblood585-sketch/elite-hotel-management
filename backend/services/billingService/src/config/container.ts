// src/config/container.ts
import { BillingRepository } from '../repository/implementation/billing.repository'
import { DisputeRepository } from '../repository/implementation/dispute.repository'
import { BillingService } from '../service/implementation/billing.service'
import { DisputeService } from '../service/implementation/dispute.service'
import { BillingController } from '../controllers/implementation/billing.controller'

// Initialize repositories
const billingRepository = new BillingRepository()
const disputeRepository = new DisputeRepository()

// Initialize services
const billingService = new BillingService(billingRepository)
const disputeService = new DisputeService(disputeRepository, billingRepository)

// Initialize controllers
export const billingController = new BillingController(billingService, disputeService)

export { billingService, billingRepository, disputeService, disputeRepository }


