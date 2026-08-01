const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/DashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getDashboardStats);

module.exports = router;
