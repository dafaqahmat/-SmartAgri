const prisma = require('../prisma/client');

const getDashboardStats = async (req, res) => {
    try {
        const { userRole, userId } = req;
        const isPetani = userRole === 'PETANI';

        // 1. Total Panen (Estimasi)
        // Jika Petani, lihat panen dia sendiri. Jika admin, panen sedesa.
        const scheduleWhere = isPetani ? { userId } : {};
        const schedules = await prisma.schedule.findMany({ where: scheduleWhere });
        const totalYieldKg = schedules.reduce((sum, s) => sum + s.estYieldInKg, 0);
        const totalYieldTon = (totalYieldKg / 1000).toFixed(1);

        // 2. Irigasi Aktif / Booking Anda
        // Jika Petani, lihat total booking PENDING/APPROVED miliknya bulan ini
        // Jika admin, lihat total booking APPROVED seluruh desa hari ini
        let irigasiCount = 0;
        let irigasiLabel = '';
        let irigasiDesc = '';
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const today = new Date(`${y}-${m}-${d}`);
        
        if (isPetani) {
            irigasiCount = await prisma.waterBooking.count({
                where: { userId, status: { in: ['PENDING', 'APPROVED'] } }
            });
            irigasiLabel = 'Booking Aktif';
            irigasiDesc = 'Menunggu & Disetujui';
        } else {
            irigasiCount = await prisma.waterBooking.count({
                where: { bookingDate: today, status: 'APPROVED' }
            });
            irigasiLabel = 'Irigasi Aktif';
            irigasiDesc = 'Blok diairi hari ini';
        }

        // 3. Harga Pasar Terbaru
        const latestPrice = await prisma.marketPrice.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { crop: true }
        });
        const priceValue = latestPrice ? `Rp ${latestPrice.pricePerKg.toLocaleString('id-ID')}` : 'Rp 0';
        const priceCrop = latestPrice ? latestPrice.crop.name : 'Komoditas';

        // 4. Jadwal Booking Terdekat (Tabel Dashboard)
        const bookingWhere = {
            status: 'APPROVED',
            bookingDate: { gte: today }
        };
        if (isPetani) {
            bookingWhere.userId = userId;
        }

        const recentBookings = await prisma.waterBooking.findMany({
            where: bookingWhere,
            orderBy: [
                { bookingDate: 'asc' },
                { startTime: 'asc' }
            ],
            take: 5,
            include: { user: { select: { name: true } } }
        });

        res.status(200).json({
            data: {
                panen: {
                    title: isPetani ? 'Total Panen Anda' : 'Total Panen Desa',
                    value: `${totalYieldTon} Ton`,
                    desc: 'Estimasi total'
                },
                irigasi: {
                    title: irigasiLabel,
                    value: `${irigasiCount} Jadwal`,
                    desc: irigasiDesc
                },
                harga: {
                    title: `Harga ${priceCrop}`,
                    value: priceValue,
                    desc: 'Per kg (terbaru)'
                },
                recentBookings
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data dashboard', error: error.message });
    }
};

module.exports = { getDashboardStats };
