/**
 * Tontines Routes v1
 * Consistent endpoint patterns with consolidated functionality
 */

const express = require('express');
const TontinesController = require('../../controllers/tontinesController');
const { authMiddleware, adminMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initTontinesRoutes = (db) => {
  const tontinesController = new TontinesController(db);

  // Consolidated tontines endpoint with query parameters
  router.get('/', authMiddleware, tontinesController.getTontines.bind(tontinesController));
  router.get('/:id', authMiddleware, tontinesController.getTontineById.bind(tontinesController));
  router.post('/', adminMiddleware, tontinesController.createTontine.bind(tontinesController));
  router.put('/:id', adminMiddleware, tontinesController.updateTontine.bind(tontinesController));
  router.delete('/:id', adminMiddleware, tontinesController.deleteTontine.bind(tontinesController));
  
  // Action endpoints
  router.post('/:id/join', authMiddleware, tontinesController.joinTontine.bind(tontinesController));

  return router;
};

module.exports = initTontinesRoutes;
