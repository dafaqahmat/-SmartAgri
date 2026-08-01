const prisma = require('../prisma/client');

const getReportData = async (req, res) => {
    try {
        const { userRole, userId } = req;
        const isPetani = userRole === 'PETANI';

        if (isPetani) {
            const schedules = await prisma.schedule.findMany({
                where: { userId },
                include: { crop: true }
            });

            const cropMap = {};
            schedules.forEach(s => {
                const cropName = s.crop.name;
                if (!cropMap[cropName]) {
                    cropMap[cropName] = { 
                        cropName, 
                        totalArea: 0, 
                        totalYieldKg: 0 
                    };
                }
                cropMap[cropName].totalArea += s.areaSizeInHa;
                cropMap[cropName].totalYieldKg += s.estYieldInKg;
            });

            const reportData = Object.values(cropMap);
            return res.status(200).json({ type: 'PETANI_REPORT', data: reportData });
        }

        // For ADMIN
        const users = await prisma.user.findMany({
            where: { role: 'PETANI' },
            include: {
                fields: true,
                bookings: {
                    where: { status: 'FINISHED' } 
                },
                schedules: true
            }
        });

        const reportData = users.map(u => {
            const totalFields = u.fields.length;
            const totalWaterings = u.bookings.length;
            const totalEstYield = u.schedules.reduce((sum, s) => sum + s.estYieldInKg, 0);

            return {
                id: u.id,
                name: u.name,
                email: u.email,
                totalFields,
                totalWaterings,
                totalYieldKg: totalEstYield
            };
        });

        res.status(200).json({ type: 'ADMIN_REPORT', data: reportData });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat laporan', error: error.message });
    }
};

module.exports = { getReportData };
