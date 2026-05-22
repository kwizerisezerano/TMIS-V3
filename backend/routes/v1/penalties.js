/**
 * Penalties Routes v1
 * Clean route definitions separated from business logic
 */

const express = require('express');
const PenaltiesController = require('../../controllers/penaltiesController');
const { authMiddleware, adminMiddleware, recordingMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initPenaltiesRoutes = (db) => {
  const penaltiesController = new PenaltiesController(db);

  // Penalties endpoints
  router.get('/', authMiddleware, penaltiesController.getPenalties.bind(penaltiesController));

  // User routes (protected)
  router.get('/user/:userId', authMiddleware, penaltiesController.getUserPenalties.bind(penaltiesController));
  router.get('/user/:userId/stats', authMiddleware, penaltiesController.getUserPenaltyStats.bind(penaltiesController));

  // Admin routes (protected + admin)
  router.get('/tontine/:tontineId', authMiddleware, penaltiesController.getTontinePenalties.bind(penaltiesController));
  router.get('/tontine/:tontineId/stats', adminMiddleware, penaltiesController.getTontinePenaltyStats.bind(penaltiesController));
  router.get('/all', adminMiddleware, penaltiesController.getAllPenalties.bind(penaltiesController));
  router.post('/apply', adminMiddleware, penaltiesController.applyPenalty.bind(penaltiesController));
  router.put('/:penaltyId/status', adminMiddleware, penaltiesController.updatePenaltyStatus.bind(penaltiesController));
  router.delete('/:penaltyId', adminMiddleware, penaltiesController.deletePenalty.bind(penaltiesController));
  router.post('/tontine/:tontineId/bulk-payments', recordingMiddleware, penaltiesController.recordBulkPenaltyPayments.bind(penaltiesController));

  return router;
};

module.exports = initPenaltiesRoutes;
