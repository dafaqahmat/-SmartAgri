const prisma = require('../prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Fungsi Registrasi User/Petani
const register = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Cek apakah email sudah terdaftar
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email sudah terdaftar.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Buat user baru
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: role || 'PETANI' // Default role PETANI
            }
        });

        res.status(201).json({
            message: 'Registrasi berhasil',
            data: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Fungsi Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cari user berdasarkan email
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return res.status(401).json({ message: 'Email atau Password salah.' });
        }

        // Cek kecocokan password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email atau Password salah.' });
        }

        // Buat token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token berlaku 1 hari
        );

        res.status(200).json({
            message: 'Login berhasil',
            token: token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Fungsi Ambil Profil Saat Ini (Get Current User)
const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, name: true, email: true, phone: true, role: true }
        });
        
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
        
        res.status(200).json({ data: user });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

module.exports = {
    register,
    login,
    getProfile
};
