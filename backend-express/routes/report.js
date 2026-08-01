const express = require('express');
const router = express.Router();
const { getReportData } = require('../controllers/ReportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getReportData);

module.exports = router;
