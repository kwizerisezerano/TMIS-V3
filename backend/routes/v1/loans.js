/**
 * Loans Routes v1
 * Consistent endpoint patterns with consolidated functionality
 */

const express = require('express');
const LoansController = require('../../controllers/loansController');
const { authMiddleware, adminMiddleware, recordingMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initLoansRoutes = (db) => {
  const loansController = new LoansController(db);

  // Loans endpoints
  router.get('/', authMiddleware, loansController.getLoans.bind(loansController));
  router.get('/:loanId', authMiddleware, loansController.getLoanById.bind(loansController));
  router.post('/', authMiddleware, loansController.requestLoan.bind(loansController));
  router.post('/tontine/:tontineId/bulk', recordingMiddleware, loansController.recordBulkLoans.bind(loansController));
  router.put('/:loanId', adminMiddleware, loansController.updateLoanStatus.bind(loansController));
  router.post('/:loanId/confirm-receipt', authMiddleware, loansController.confirmLoanReceipt.bind(loansController));
  router.delete('/:loanId', adminMiddleware, loansController.deleteLoan.bind(loansController));

  return router;
};

module.exports = initLoansRoutes;
