/**
 * Users Routes v1
 * Consistent endpoint patterns with consolidated functionality
 */

const express = require('express');
const UsersController = require('../../controllers/usersController');
const { authMiddleware, adminMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initUsersRoutes = (db) => {
  const usersController = new UsersController(db);

  // User endpoints
  router.get('/', authMiddleware, usersController.getUsers.bind(usersController));
  router.get('/:userId', authMiddleware, usersController.getUsers.bind(usersController)); // Get single user by ID
  router.post('/', adminMiddleware, usersController.createUser.bind(usersController));
  router.put('/:userId', authMiddleware, usersController.updateProfile.bind(usersController));
  router.delete('/:userId', adminMiddleware, usersController.deleteUser.bind(usersController));

  return router;
};

module.exports = initUsersRoutes;
