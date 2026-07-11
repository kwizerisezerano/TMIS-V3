const express = require('express');
const SurplusController = require('../../controllers/surplusController');
const { authMiddleware, adminMiddleware, recordingMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

const initSurplusRoutes = (db) => {
  const ctrl = new SurplusController(db);

  // Member routes
  router.get('/my', authMiddleware, ctrl.getMySurplus.bind(ctrl));
  router.put('/:surplusId/allocate', authMiddleware, ctrl.allocateSurplus.bind(ctrl));

  // Accountant/Admin routes
  router.get('/tontine/:tontineId', recordingMiddleware, ctrl.getTontineSurplus.bind(ctrl));

  return router;
};

module.exports = initSurplusRoutes;
