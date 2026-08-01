const express = require('express');
const router = express.Router();
const { createSchedule, getSchedules, updateSchedule } = require('../controllers/ScheduleController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getSchedules);
router.post('/', verifyToken, createSchedule);
router.put('/:id', verifyToken, updateSchedule);

module.exports = router;
