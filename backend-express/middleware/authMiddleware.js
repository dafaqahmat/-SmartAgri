const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Ambil token dari header Authorization (format: Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
    }
};

const verifyAdmin = (req, res, next) => {
    if (req.userRole !== 'ADMIN') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya Admin yang diizinkan.' });
    }
    next();
};

module.exports = {
    verifyToken,
    verifyAdmin
};
