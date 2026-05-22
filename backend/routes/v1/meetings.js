/**
 * Meetings Routes v1
 * Consistent endpoint patterns with consolidated functionality
 */

const express = require('express');
const MeetingsController = require('../../controllers/meetingsController');
const { authMiddleware, adminMiddleware, meetingMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initMeetingsRoutes = (db) => {
  const meetingsController = new MeetingsController(db);

  // Meetings endpoints
  router.get('/', authMiddleware, meetingsController.getAllMeetings.bind(meetingsController));
  router.get('/tontine/:tontineId', authMiddleware, meetingsController.getTontineMeetings.bind(meetingsController));
  router.post('/', meetingMiddleware, meetingsController.createMeeting.bind(meetingsController));
  router.put('/:meetingId', meetingMiddleware, meetingsController.updateMeeting.bind(meetingsController));
  router.delete('/:meetingId', meetingMiddleware, meetingsController.deleteMeeting.bind(meetingsController));

  // Action endpoints - accountant can record attendance
  router.put('/:meetingId/attendance', adminMiddleware, meetingsController.recordAttendance.bind(meetingsController));
  router.get('/:meetingId/attendance', authMiddleware, meetingsController.getMeetingAttendance.bind(meetingsController));

  return router;
};

module.exports = initMeetingsRoutes;
