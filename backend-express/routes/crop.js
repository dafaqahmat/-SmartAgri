const express = require('express');
const router = express.Router();
const { createCrop, updateCrop, getAllCrops, updateMarketPrice } = require('../controllers/CropController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllCrops);
router.post('/', verifyToken, verifyAdmin, createCrop);
router.put('/:id', verifyToken, verifyAdmin, updateCrop);

router.post('/prices', verifyToken, verifyAdmin, updateMarketPrice);

module.exports = router;
