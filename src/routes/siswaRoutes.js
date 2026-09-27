const express = require('express');
const router = express.Router();
const siswaController = require('../controllers/siswaController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(isAuthenticated, authorizeRoles('SISWA'));

router.get('/dashboard', siswaController.getDashboard);
router.get('/personal-recap', siswaController.getPersonalRecap);
router.get('/upload-note', siswaController.getUploadNote);
router.post('/upload-note', upload.single('suratBukti'), siswaController.postUploadNote);

module.exports = router;
