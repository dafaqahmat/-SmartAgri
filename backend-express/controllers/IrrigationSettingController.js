const prisma = require('../prisma/client');

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// GET semua pengaturan
const getSettings = async (req, res) => {
    try {
        const settings = await prisma.irrigationSetting.findMany({
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
        });
        res.status(200).json({ data: settings });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil pengaturan', error: error.message });
    }
};

// POST buat slot baru
const createSetting = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Akses ditolak' });

        const { dayOfWeek, startTime, endTime, description } = req.body;

        // Validasi waktu
        const toMins = (t) => { const [h, m] = t.split(':'); return parseInt(h) * 60 + parseInt(m); };
        if (toMins(endTime) <= toMins(startTime)) {
            return res.status(400).json({ message: 'Jam selesai harus lebih besar dari jam mulai' });
        }

        const setting = await prisma.irrigationSetting.create({
            data: {
                dayOfWeek: parseInt(dayOfWeek),
                startTime,
                endTime,
                description: description || null
            }
        });

        res.status(201).json({ message: `Slot ${HARI[dayOfWeek]} ${startTime}-${endTime} berhasil ditambahkan`, data: setting });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambah slot', error: error.message });
    }
};

// PATCH toggle aktif/nonaktif
const toggleSetting = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Akses ditolak' });

        const { id } = req.params;
        const existing = await prisma.irrigationSetting.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ message: 'Setting tidak ditemukan' });

        const updated = await prisma.irrigationSetting.update({
            where: { id: parseInt(id) },
            data: { isActive: !existing.isActive }
        });

        res.status(200).json({ message: `Slot ${updated.isActive ? 'diaktifkan' : 'dinonaktifkan'}`, data: updated });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui setting', error: error.message });
    }
};

// DELETE
const deleteSetting = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Akses ditolak' });

        const { id } = req.params;
        await prisma.irrigationSetting.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ message: 'Slot berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus slot', error: error.message });
    }
};

module.exports = { getSettings, createSetting, toggleSetting, deleteSetting };
