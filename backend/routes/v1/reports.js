const express = require('express');
const ReportsController = require('../../controllers/reportsController');
const { authMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

const initReportsRoutes = (db) => {
  const ctrl = new ReportsController(db);
  router.get('/summary', authMiddleware, ctrl.getSummary.bind(ctrl));
  router.get('/transactions', authMiddleware, ctrl.getTransactions.bind(ctrl));
  return router;
};

module.exports = initReportsRoutes;
