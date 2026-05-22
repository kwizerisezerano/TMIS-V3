/**
 * Payments Routes v1
 * Consistent endpoint patterns with consolidated functionality
 */

const express = require('express');
const PaymentsController = require('../../controllers/paymentsController');
const { authMiddleware, adminMiddleware, recordingMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initPaymentsRoutes = (db) => {
  const paymentsController = new PaymentsController(db);

  // Payments endpoints
  router.post('/hdev/callback', paymentsController.handleHdevCallback.bind(paymentsController));
  router.get('/', authMiddleware, paymentsController.getPayments.bind(paymentsController));
  router.get('/history', authMiddleware, paymentsController.getPaymentHistory.bind(paymentsController));
  router.get('/:paymentId', authMiddleware, paymentsController.getPaymentById.bind(paymentsController));
  router.post('/contribution', authMiddleware, paymentsController.processContributionPayment.bind(paymentsController));
  router.post('/loan', authMiddleware, paymentsController.processLoanPayment.bind(paymentsController));
  router.post('/penalty', authMiddleware, paymentsController.processPenaltyPayment.bind(paymentsController));
  router.post('/tontine/:tontineId/loan-bulk', recordingMiddleware, paymentsController.recordManualLoanPayments.bind(paymentsController));
  router.put('/:paymentId', adminMiddleware, paymentsController.updatePaymentStatus.bind(paymentsController));

  return router;
};

module.exports = initPaymentsRoutes;
