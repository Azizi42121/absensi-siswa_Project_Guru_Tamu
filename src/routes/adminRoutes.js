const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(isAuthenticated, authorizeRoles('ADMIN'));

router.get('/dashboard', adminController.getDashboard);

// Class routes
router.get('/classes', adminController.getClasses);
router.post('/classes', adminController.createClass);
router.post('/classes/delete/:id', adminController.deleteClass);

// Student routes
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.post('/students/delete/:id', adminController.deleteStudent);

// Teacher routes
router.get('/teachers', adminController.getTeachers);
router.post('/teachers', adminController.createTeacher);
router.post('/teachers/delete/:id', adminController.deleteTeacher);

// Subject routes
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);
router.post('/subjects/delete/:id', adminController.deleteSubject);

// Schedule routes
router.get('/schedules', adminController.getSchedules);
router.post('/schedules', adminController.createSchedule);
router.post('/schedules/delete/:id', adminController.deleteSchedule);

// Audit log route
router.get('/audit', adminController.getAuditLog);

module.exports = router;
