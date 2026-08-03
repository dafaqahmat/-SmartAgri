const prisma = require('../prisma/client');
const bcrypt = require('bcrypt');

// Get all users (mostly PETANI)
const getUsers = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN') {
            return res.status(403).json({ message: 'Akses ditolak' });
        }
        const users = await prisma.user.findMany({
            where: { role: 'PETANI' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                deletedAt: true,
                createdAt: true,
                fields: true
            }
        });
        res.status(200).json({ data: users });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data petani', error: error.message });
    }
};

// Get single user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Hanya Admin atau user yang bersangkutan yang boleh melihat
        if (req.userRole !== 'ADMIN' && req.userId !== parseInt(id)) {
            return res.status(403).json({ message: 'Akses ditolak' });
        }
        
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
                fields: true
            }
        });
        
        if (!user) return res.status(404).json({ message: 'Petani tidak ditemukan' });
        res.status(200).json({ data: user });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil detail petani', error: error.message });
    }
};

// Create user
const createUser = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Akses ditolak' });
        
        const { name, email, password, phone } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Email sudah terdaftar' });

        const hashedPassword = await bcrypt.hash(password || 'petani123', 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: 'PETANI'
            },
            select: { id: true, name: true, email: true, phone: true, isActive: true }
        });

        res.status(201).json({ message: 'Petani berhasil ditambahkan', data: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambah petani', error: error.message });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Akses ditolak' });
        
        const { id } = req.params;
        const { name, phone, isActive, deletedAt } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;

        if (isActive !== undefined) {
            updateData.isActive = isActive === true || isActive === 'true';
        }

        if (deletedAt === null) {
            updateData.deletedAt = null;
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: { id: true, name: true, phone: true, isActive: true, deletedAt: true }
        });

        res.status(200).json({ message: 'Data petani berhasil diupdate', data: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengupdate petani', error: error.message });
    }
};

// Delete user (Soft Delete)
const deleteUser = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Akses ditolak' });
        const { id } = req.params;
        
        await prisma.user.update({ 
            where: { id: parseInt(id) },
            data: { deletedAt: new Date(), isActive: false }
        });
        
        res.status(200).json({ message: 'Petani berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus petani', error: error.message });
    }
};

// Create Farm Field for User
const createFarmField = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Akses ditolak' });
        
        const { id } = req.params; // userId
        const { name, address, latitude, longitude } = req.body;

        const newField = await prisma.farmField.create({
            data: {
                userId: parseInt(id),
                name,
                address,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            }
        });

        res.status(201).json({ message: 'Sawah berhasil ditambahkan', data: newField });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambah sawah', error: error.message });
    }
};

// Delete Farm Field
const deleteFarmField = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Akses ditolak' });
        
        const { fieldId } = req.params;
        await prisma.farmField.delete({ where: { id: parseInt(fieldId) } });
        
        res.status(200).json({ message: 'Sawah berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus sawah', error: error.message });
    }
};

// Update own profile
const updateProfile = async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const updateData = { name, phone };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: updateData,
            select: { id: true, name: true, email: true, phone: true, role: true }
        });

        res.status(200).json({ message: 'Profil berhasil diperbarui', data: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui profil', error: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    createFarmField,
    deleteFarmField,
    updateProfile
};
