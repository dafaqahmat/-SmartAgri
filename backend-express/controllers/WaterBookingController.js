const prisma = require('../prisma/client');

// Buat Pengajuan Booking Air (Bisa Petani atau Admin on-behalf)
const createBooking = async (req, res) => {
    try {
        const { targetUserId, blockName, bookingDate, startTime, endTime, durationHours } = req.body;
        
        const userIdToBook = req.userRole === 'ADMIN' && targetUserId ? parseInt(targetUserId) : req.userId;
        const createdByRole = req.userRole === 'ADMIN' ? 'ADMIN' : 'SELF';
        const initialStatus = req.userRole === 'ADMIN' ? 'APPROVED' : 'PENDING';

        const bDate = new Date(bookingDate);
        
        // === VALIDASI TANGGAL ===
        // Tanggal booking tidak boleh di masa lalu (kurang dari hari ini)
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const today = new Date(`${y}-${m}-${d}`); // Hasilnya UTC midnight, persis seperti bDate
        
        const bookingDateNormalized = new Date(bDate);

        if (bookingDateNormalized < today) {
            return res.status(400).json({
                message: 'Tanggal booking tidak valid. Anda tidak bisa memilih tanggal yang sudah lewat.'
            });
        }
        
        // === VALIDASI JAM HARI INI ===
        // Jika booking untuk hari ini, jam mulai tidak boleh lewat dari jam saat ini
        if (bookingDateNormalized.getTime() === today.getTime()) {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const [startH, startM] = startTime.split(':');
            const startMinsReq = parseInt(startH) * 60 + parseInt(startM);
            
            if (startMinsReq <= currentMins) {
                return res.status(400).json({
                    message: 'Waktu tidak valid. Jam yang Anda pilih sudah lewat untuk hari ini.'
                });
            }
        }

        const dayOfWeek = bDate.getDay(); // 0=Minggu, 1=Senin, dst

        const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const toMins = (t) => { const [h, m] = t.split(':'); return parseInt(h) * 60 + parseInt(m); };

        // === VALIDASI JADWAL IRIGASI ===
        // Cek apakah ada slot untuk hari ini
        const allowedSlots = await prisma.irrigationSetting.findMany({
            where: { dayOfWeek }
        });

        if (allowedSlots.length === 0) {
            return res.status(400).json({
                message: `Booking pada hari ${HARI[dayOfWeek]} tidak diizinkan. Silakan pilih hari yang sesuai jadwal irigasi.`
            });
        }

        const startMinsReq = toMins(startTime);
        const endMinsReq = toMins(endTime);

        // Cek apakah rentang jam masuk dalam salah satu slot yang diizinkan
        const isTimeAllowed = allowedSlots.some(slot => {
            const slotStart = toMins(slot.startTime);
            const slotEnd = toMins(slot.endTime);
            return startMinsReq >= slotStart && endMinsReq <= slotEnd;
        });

        if (!isTimeAllowed) {
            const slotList = allowedSlots.map(s => `${s.startTime}-${s.endTime} WIB`).join(', ');
            return res.status(400).json({
                message: `Jam booking tidak sesuai. Slot yang diizinkan hari ${HARI[dayOfWeek]}: ${slotList}`
            });
        }

        // Validasi Pencegahan Bentrok Jam Global (Hanya boleh 1 sawah dialiri pada satu waktu)
        const existingBookings = await prisma.waterBooking.findMany({
            where: {
                bookingDate: bDate,
                status: 'APPROVED'
            },
            include: { user: true }
        });

        // Simple time collision logic (asumsi format HH:mm misal "08:00")
        const convertToMinutes = (timeStr) => {
            const [h, m] = timeStr.split(':');
            return parseInt(h) * 60 + parseInt(m);
        };
        const startMins = convertToMinutes(startTime);
        const endMins = convertToMinutes(endTime);

        let hasConflict = false;
        let conflictDetails = '';
        for (const existing of existingBookings) {
            const exStart = convertToMinutes(existing.startTime);
            const exEnd = convertToMinutes(existing.endTime);
            
            // Cek overlap rentang waktu
            if (startMins < exEnd && endMins > exStart) {
                hasConflict = true;
                const ownerName = existing.user?.name || 'Petani lain';
                conflictDetails = `${existing.blockName} milik ${ownerName}`;
                break;
            }
        }

        if (hasConflict) {
            return res.status(409).json({ message: `Jadwal bentrok! Aliran air sedang digunakan oleh ${conflictDetails} pada rentang jam tersebut. Hanya 1 sawah yang boleh diairi dalam satu waktu.` });
        }

        const booking = await prisma.waterBooking.create({
            data: {
                userId: userIdToBook,
                blockName,
                bookingDate: bDate,
                startTime,
                endTime,
                durationHours: parseInt(durationHours),
                status: initialStatus,
                createdBy: createdByRole
            }
        });

        res.status(201).json({ message: 'Booking berhasil diajukan', data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengajukan booking air', error: error.message });
    }
};

// Ambil Daftar Booking
const getBookings = async (req, res) => {
    try {
        const where = req.userRole === 'ADMIN' ? {} : { userId: req.userId };
        const bookings = await prisma.waterBooking.findMany({
            where: where,
            include: { user: { select: { name: true } } },
            orderBy: [{ bookingDate: 'desc' }, { startTime: 'asc' }]
        });
        res.status(200).json({ data: bookings });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data booking', error: error.message });
    }
};

// Admin Approve/Reject Booking
const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        const bookingToUpdate = await prisma.waterBooking.findUnique({ where: { id: parseInt(id) } });
        if (!bookingToUpdate) return res.status(404).json({ message: 'Booking tidak ditemukan' });

        if (status === 'APPROVED') {
            const existingBookings = await prisma.waterBooking.findMany({
                where: {
                    bookingDate: bookingToUpdate.bookingDate,
                    status: 'APPROVED',
                    id: { not: parseInt(id) }
                },
                include: { user: true }
            });

            const convertToMinutes = (timeStr) => {
                const [h, m] = timeStr.split(':');
                return parseInt(h) * 60 + parseInt(m);
            };
            const startMins = convertToMinutes(bookingToUpdate.startTime);
            const endMins = convertToMinutes(bookingToUpdate.endTime);

            let hasConflict = false;
            let conflictDetails = '';
            for (const existing of existingBookings) {
                const exStart = convertToMinutes(existing.startTime);
                const exEnd = convertToMinutes(existing.endTime);
                if (startMins < exEnd && endMins > exStart) {
                    hasConflict = true;
                    const ownerName = existing.user?.name || 'Petani lain';
                    conflictDetails = `${existing.blockName} milik ${ownerName}`;
                    break;
                }
            }

            if (hasConflict) {
                const autoReason = `Sistem Otomatis: Ditolak karena aliran air sedang digunakan oleh ${conflictDetails} pada jam tersebut.`;
                await prisma.waterBooking.update({
                    where: { id: parseInt(id) },
                    data: { status: 'REJECTED', reason: autoReason }
                });
                return res.status(409).json({ 
                    message: `Gagal disetujui! Aliran air sedang digunakan oleh ${conflictDetails} pada jam tersebut.\n\nBooking ini telah otomatis diubah menjadi REJECTED.` 
                });
            }
        }

        const booking = await prisma.waterBooking.update({
            where: { id: parseInt(id) },
            data: { status, reason }
        });
        res.status(200).json({ message: `Status berhasil diubah menjadi ${status}`, data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Gagal merubah status', error: error.message });
    }
};

// Fitur Selesai Manual Lebih Awal (Finish Early)
const finishBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await prisma.waterBooking.update({
            where: { id: parseInt(id) },
            data: { status: 'FINISHED' }
        });
        res.status(200).json({ message: 'Pengairan selesai. Saluran air kembali kosong.', data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menyelesaikan pengairan', error: error.message });
    }
};

// Fitur Majukan Jam (Reschedule to available slot)
const rescheduleBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { newStartTime, newEndTime } = req.body;
        const booking = await prisma.waterBooking.update({
            where: { id: parseInt(id) },
            data: { startTime: newStartTime, endTime: newEndTime }
        });
        res.status(200).json({ message: 'Jadwal pengairan berhasil dimajukan!', data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Gagal merubah jadwal pengairan', error: error.message });
    }
};

const editBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { blockName, bookingDate, startTime, endTime, durationHours } = req.body;

        const booking = await prisma.waterBooking.findUnique({ where: { id: parseInt(id) } });
        if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan' });

        if (req.userRole !== 'ADMIN') {
            if (booking.userId !== req.userId) return res.status(403).json({ message: 'Akses ditolak' });
            if (booking.status === 'APPROVED' || booking.status === 'FINISHED' || booking.status === 'REJECTED') {
                return res.status(400).json({ message: 'Tidak dapat mengedit booking yang sudah disetujui, ditolak, atau selesai.' });
            }
        } else {
            if (booking.createdBy === 'SELF') {
                return res.status(403).json({ message: 'Admin tidak dapat mengedit pengajuan yang dibuat oleh Petani.' });
            }
            if (booking.status === 'FINISHED') {
                return res.status(400).json({ message: 'Admin tidak dapat mengedit booking yang sudah selesai.' });
            }
        }

        const bDate = new Date(bookingDate);

        // Validasi Pencegahan Bentrok Jam Global (Hanya boleh 1 sawah dialiri pada satu waktu)
        const existingBookings = await prisma.waterBooking.findMany({
            where: {
                bookingDate: bDate,
                status: 'APPROVED',
                id: { not: parseInt(id) }
            },
            include: { user: true }
        });

        const convertToMinutes = (timeStr) => {
            const [h, m] = timeStr.split(':');
            return parseInt(h) * 60 + parseInt(m);
        };
        const startMins = convertToMinutes(startTime);
        const endMins = convertToMinutes(endTime);

        let hasConflict = false;
        let conflictDetails = '';
        for (const existing of existingBookings) {
            const exStart = convertToMinutes(existing.startTime);
            const exEnd = convertToMinutes(existing.endTime);
            
            if (startMins < exEnd && endMins > exStart) {
                hasConflict = true;
                const ownerName = existing.user?.name || 'Petani lain';
                conflictDetails = `${existing.blockName} milik ${ownerName}`;
                break;
            }
        }

        if (hasConflict) {
            return res.status(409).json({ message: `Jadwal bentrok! Aliran air sedang digunakan oleh ${conflictDetails} pada rentang jam tersebut. Hanya 1 sawah yang boleh diairi dalam satu waktu.` });
        }

        const updated = await prisma.waterBooking.update({
            where: { id: parseInt(id) },
            data: { blockName, bookingDate: new Date(bookingDate), startTime, endTime, durationHours: parseInt(durationHours) }
        });
        res.status(200).json({ message: 'Booking berhasil diupdate', data: updated });
    } catch(err) { res.status(500).json({ message: 'Gagal update' }) }
};

const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await prisma.waterBooking.findUnique({ where: { id: parseInt(id) } });
        if (!booking) return res.status(404).json({ message: 'Booking tidak ditemukan' });

        if (req.userRole !== 'ADMIN') {
            if (booking.userId !== req.userId) return res.status(403).json({ message: 'Akses ditolak' });
            if (booking.status === 'APPROVED' || booking.status === 'FINISHED' || booking.status === 'REJECTED') {
                return res.status(400).json({ message: 'Tidak dapat menghapus booking yang sudah disetujui, ditolak, atau selesai.' });
            }
        } else {
            if (booking.createdBy === 'SELF') {
                return res.status(403).json({ message: 'Admin tidak dapat menghapus pengajuan yang dibuat oleh Petani.' });
            }
            if (booking.status === 'FINISHED') {
                return res.status(400).json({ message: 'Admin tidak dapat menghapus booking yang sudah selesai.' });
            }
        }

        await prisma.waterBooking.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ message: 'Booking berhasil dihapus' });
    } catch(err) { res.status(500).json({ message: 'Gagal hapus' }) }
};

module.exports = {
    createBooking,
    getBookings,
    updateBookingStatus,
    finishBooking,
    rescheduleBooking,
    editBooking,
    deleteBooking
};
