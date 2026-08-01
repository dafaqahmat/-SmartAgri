const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, createFarmField, deleteFarmField, updateProfile } = require('../controllers/UserController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getUsers);
router.get('/:id', verifyToken, getUserById);
router.post('/', verifyToken, createUser);
router.put('/profile/me', verifyToken, updateProfile);
router.put('/:id', verifyToken, updateUser);
router.delete('/:id', verifyToken, deleteUser);

router.post('/:id/fields', verifyToken, createFarmField);
router.delete('/fields/:fieldId', verifyToken, deleteFarmField);

module.exports = router;
