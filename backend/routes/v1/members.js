/**
 * Members Routes v1
 * Consistent endpoint patterns with consolidated functionality
 */

const express = require('express');
const MembersController = require('../../controllers/membersController');
const { authMiddleware, adminMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initMembersRoutes = (db) => {
  const membersController = new MembersController(db);

  // Members endpoints
  router.get('/tontine/:tontineId', authMiddleware, membersController.getTontineMembers.bind(membersController));
  router.post('/tontine/:tontineId/join', authMiddleware, membersController.joinTontine.bind(membersController));
  router.put('/:membershipId/status', adminMiddleware, membersController.updateMembershipStatus.bind(membersController));
  router.put('/:membershipId/shares', adminMiddleware, membersController.updateMemberShares.bind(membersController));
  router.delete('/:membershipId', adminMiddleware, membersController.removeMember.bind(membersController));
  router.post('/:membershipId/leave', authMiddleware, membersController.leaveTontine.bind(membersController));

  return router;
};

module.exports = initMembersRoutes;
