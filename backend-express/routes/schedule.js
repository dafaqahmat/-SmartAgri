const express = require('express');
const router = express.Router();
const { 
    createSchedule, 
    getSchedules, 
    updateSchedule, 
    addExpense,
    editScheduleBase,
    deleteSchedule,
    editExpense,
    deleteExpense
} = require('../controllers/ScheduleController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getSchedules);
router.post('/', verifyToken, createSchedule);

// Update Status/Yield (Saat Panen)
router.put('/:id/harvest', verifyToken, updateSchedule);

// Edit & Hapus Base Jadwal
router.put('/:id', verifyToken, editScheduleBase);
router.delete('/:id', verifyToken, deleteSchedule);

// Edit & Hapus Pengeluaran
router.post('/:id/expenses', verifyToken, addExpense);
router.put('/expenses/:expenseId', verifyToken, editExpense);
router.delete('/expenses/:expenseId', verifyToken, deleteExpense);

module.exports = router;
