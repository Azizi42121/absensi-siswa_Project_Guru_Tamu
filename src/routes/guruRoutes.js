const express = require('express');
const router = express.Router();
const guruController = require('../controllers/guruController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(isAuthenticated, authorizeRoles('GURU_MAPEL'));

router.get('/dashboard', guruController.getDashboard);

// Input Attendance & Teaching Journal
router.get('/attendance/:scheduleId', guruController.getAttendanceInput);
router.post('/attendance/:scheduleId', guruController.postAttendanceInput);

// Note Verification
router.get('/verify-notes', guruController.getVerifyNotes);
router.post('/verify-notes', guruController.postVerifyNote);

// Monthly Recap Print
router.get('/monthly-recap', guruController.getMonthlyRecap);

module.exports = router;
