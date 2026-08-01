const express = require('express');
const router = express.Router();
const { 
    createBooking, 
    getBookings, 
    updateBookingStatus, 
    finishBooking, 
    rescheduleBooking 
} = require('../controllers/WaterBookingController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getBookings);
router.post('/', verifyToken, createBooking);

// Khusus Admin
router.put('/:id/status', verifyToken, verifyAdmin, updateBookingStatus);

// Bisa Petani atau Admin
router.put('/:id/finish', verifyToken, finishBooking);
router.put('/:id/reschedule', verifyToken, rescheduleBooking);

module.exports = router;
