// src/routes/payment.route.ts
import express from 'express'
import { paymentController } from '../config/container'

const router = express.Router()

router.get('/', paymentController.list.bind(paymentController))
router.get('/:id', paymentController.getById.bind(paymentController))
router.post('/initiate', paymentController.initiate.bind(paymentController))
router.patch(
  '/:paymentId/status',
  paymentController.updateStatus.bind(paymentController)
)

// Analytics endpoints
import { PaymentAnalyticsController } from '../controllers/payment.analytics.controller';
import { PaymentModel } from '../models/payment.model';

const paymentAnalyticsController = new PaymentAnalyticsController(PaymentModel);

router.get('/analytics/revenue', paymentAnalyticsController.getRevenueMetrics.bind(paymentAnalyticsController));
router.get('/analytics/revenue/chart', paymentAnalyticsController.getRevenueTimeSeries.bind(paymentAnalyticsController));
router.get('/analytics/pending', paymentAnalyticsController.getPendingPayments.bind(paymentAnalyticsController));

export default router
