const prisma = require('../prisma/client');

// Tambah Jadwal Tanam (Petani)
const createSchedule = async (req, res) => {
    try {
        const { cropId, areaSizeInHa, plantDate } = req.body;
        
        // Ambil data tanaman untuk tahu durasi & standar tonase
        const crop = await prisma.crop.findUnique({ where: { id: parseInt(cropId) } });
        if (!crop) return res.status(404).json({ message: 'Tanaman tidak ditemukan' });

        // Kalkulasi Otomatis Backend
        const startDate = new Date(plantDate);
        const estHarvestDate = new Date(startDate);
        estHarvestDate.setDate(startDate.getDate() + crop.durationDays);

        const estYieldInKg = parseFloat(areaSizeInHa) * crop.yieldPerHaInTon * 1000;

        const schedule = await prisma.schedule.create({
            data: {
                userId: req.userId,
                cropId: parseInt(cropId),
                areaSizeInHa: parseFloat(areaSizeInHa),
                plantDate: startDate,
                estHarvestDate: estHarvestDate,
                estYieldInKg: estYieldInKg
            }
        });

        res.status(201).json({ message: 'Jadwal Tanam Berhasil Dibuat', data: schedule });
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat jadwal tanam', error: error.message });
    }
};

// Ambil Jadwal Tanam beserta Estimasi Rupiah (Dinamis)
const getSchedules = async (req, res) => {
    try {
        // Jika Petani: ambil jadwalnya sendiri. Jika Admin: ambil semua
        const where = req.userRole === 'ADMIN' ? {} : { userId: req.userId };

        const schedules = await prisma.schedule.findMany({
            where: where,
            include: {
                crop: {
                    include: {
                        prices: { orderBy: { createdAt: 'desc' }, take: 1 } // Ambil harga terbaru
                    }
                },
                user: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Mapping Data untuk menambahkan Estimasi Rupiah secara dinamis atau mengunci Nilai jika sudah panen
        const dataWithEstimates = schedules.map(sched => {
            const latestPrice = sched.crop.prices.length > 0 ? sched.crop.prices[0].pricePerKg : 0;
            return {
                ...sched,
                currentPriceRef: latestPrice,
                estRevenueRupiah: sched.status === 'HARVESTED' && sched.realRevenueRupiah != null 
                    ? sched.realRevenueRupiah 
                    : sched.estYieldInKg * latestPrice
            };
        });

        res.status(200).json({ data: dataWithEstimates });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil jadwal tanam', error: error.message });
    }
};

// Update Jadwal Tanam (Misal edit hasil panen nyata)
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { estYieldInKg, status, realPricePerKg } = req.body; 

        // Cek kepemilikan jadwal (Hanya pemilik yang boleh update)
        const schedule = await prisma.schedule.findUnique({ where: { id: parseInt(id) } });
        if (!schedule) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        
        if (schedule.userId !== req.userId) {
            return res.status(403).json({ message: 'Tidak diizinkan mengubah jadwal milik orang lain' });
        }

        // Kalkulasi pendapatan final berdasarkan harga riil dari petani
        let realRevenueRupiah = null;
        if (status === 'HARVESTED' || (!status && schedule.status === 'HARVESTED')) {
            // Jika ada harga riil yang diinput petani, pakai itu, kalau tidak ambil harga master terakhir
            let finalPrice = 0;
            if (realPricePerKg && !isNaN(parseInt(realPricePerKg))) {
                finalPrice = parseInt(realPricePerKg);
            } else {
                const cropData = await prisma.crop.findUnique({
                    where: { id: schedule.cropId },
                    include: { prices: { orderBy: { createdAt: 'desc' }, take: 1 } }
                });
                finalPrice = cropData?.prices.length > 0 ? cropData.prices[0].pricePerKg : 0;
            }
            realRevenueRupiah = parseFloat(estYieldInKg) * finalPrice;
        }

        const updated = await prisma.schedule.update({
            where: { id: parseInt(id) },
            data: {
                estYieldInKg: parseFloat(estYieldInKg),
                realRevenueRupiah: realRevenueRupiah,
                status: status || schedule.status
            }
        });

        res.status(200).json({ message: 'Jadwal tanam berhasil diupdate', data: updated });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengupdate jadwal', error: error.message });
    }
};

module.exports = {
    createSchedule,
    getSchedules,
    updateSchedule
};
