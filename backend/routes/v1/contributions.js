/**
 * Contributions Routes v1
 * Consistent endpoint patterns with consolidated functionality
 */

const express = require('express');
const ContributionsController = require('../../controllers/contributionsController');
const { authMiddleware, adminMiddleware, recordingMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initContributionsRoutes = (db) => {
  const contributionsController = new ContributionsController(db);

  // Contributions endpoints
  router.get('/', authMiddleware, contributionsController.getContributions.bind(contributionsController));
  router.get('/:contributionId', authMiddleware, contributionsController.getContributionById.bind(contributionsController));
  router.post('/', adminMiddleware, contributionsController.createContribution.bind(contributionsController));
  router.post('/tontine/:tontineId/bulk', recordingMiddleware, contributionsController.recordBulkContributions.bind(contributionsController));
  router.put('/:contributionId', adminMiddleware, contributionsController.updateContributionStatus.bind(contributionsController));
  router.delete('/:contributionId', adminMiddleware, contributionsController.deleteContribution.bind(contributionsController));

  return router;
};

module.exports = initContributionsRoutes;
