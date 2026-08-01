const express = require('express');
const router = express.Router();
const { getSettings, createSetting, deleteSetting } = require('../controllers/IrrigationSettingController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getSettings);
router.post('/', verifyToken, createSetting);

router.delete('/:id', verifyToken, deleteSetting);

module.exports = router;
