const express = require('express');
const multer = require('multer');
const { analyzeReportFromFile, getMyMedicalReports, deleteMedicalReport } = require('../controllers/analysis.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/report', authenticate, upload.single('reportFile'), analyzeReportFromFile);
router.get('/my-reports', authenticate, getMyMedicalReports);
router.delete('/report/:id', authenticate, deleteMedicalReport);

module.exports = router;
