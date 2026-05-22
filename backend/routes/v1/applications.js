/**
 * Applications Routes v1
 * Consistent endpoint patterns with consolidated functionality
 */

const express = require('express');
const ApplicationsController = require('../../controllers/applicationsController');
const { adminMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initApplicationsRoutes = (db) => {
  const applicationsController = new ApplicationsController(db);

  // Applications endpoints
  router.get('/', adminMiddleware, applicationsController.getApplications.bind(applicationsController));
  router.get('/:applicationId', applicationsController.getApplicationById.bind(applicationsController));
  router.post('/',
    applicationsController.upload.single('document'),
    (req, res, next) => {
      if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
      }
      next();
    },
    applicationsController.submitApplication.bind(applicationsController)
  );
  router.put('/:applicationId/status', adminMiddleware, applicationsController.updateApplicationStatus.bind(applicationsController));
  router.delete('/:applicationId', adminMiddleware, applicationsController.deleteApplication.bind(applicationsController));

  // File upload endpoint (for additional files after application creation)
  router.post('/:applicationId/files', applicationsController.uploadFiles.bind(applicationsController));

  return router;
};

module.exports = initApplicationsRoutes;
