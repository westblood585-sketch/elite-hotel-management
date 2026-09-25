// src/routes/billing.route.ts
import express from 'express'
import { billingController } from '../config/container'

const router = express.Router()

// Query endpoints
router.get('/', billingController.list.bind(billingController))
router.get('/:id', billingController.getById.bind(billingController))
router.get('/reservation/:reservationId', billingController.getByReservation.bind(billingController))

// Ledger operations
router.post('/:id/charges', billingController.addCharge.bind(billingController))
router.post('/:id/credits', billingController.addCredit.bind(billingController))
router.post('/:id/refund', billingController.processRefund.bind(billingController))
router.post('/:id/adjustment', billingController.addAdjustment.bind(billingController))

// Status management
router.patch('/:id/status', billingController.changeStatus.bind(billingController))
router.post('/:id/send-invoice', billingController.sendInvoice.bind(billingController))

// Invoice & Export
router.get('/:id/download', billingController.downloadInvoice.bind(billingController))
router.get('/reservation/:reservationId/download', billingController.downloadInvoiceByReservation.bind(billingController))
router.get('/export/all', billingController.exportBillings.bind(billingController))

// Administrative
router.get('/:id/audit-log', billingController.getAuditLog.bind(billingController))
router.post('/:id/archive', billingController.archiveBilling.bind(billingController))

// Dispute management
router.post('/:id/dispute', billingController.flagDispute.bind(billingController))
router.patch('/:id/dispute/:disputeId/resolve', billingController.resolveDispute.bind(billingController))
router.get('/:id/disputes', billingController.getDisputesByBilling.bind(billingController))

// Analytics endpoints
import { BillingAnalyticsController } from '../controllers/billing.analytics.controller';
import { BillingModel } from '../models/billing.model';

const billingAnalyticsController = new BillingAnalyticsController(BillingModel);

router.get('/analytics/status', billingAnalyticsController.getBillingStatus.bind(billingAnalyticsController));

export default router

