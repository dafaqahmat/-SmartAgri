const prisma = require('../prisma/client');

const getReportData = async (req, res) => {
    try {
        const { userRole, userId } = req;
        const isPetani = userRole === 'PETANI';

        // Base where for users
        const userWhere = isPetani ? { id: userId } : { role: 'PETANI' };

        const users = await prisma.user.findMany({
            where: userWhere,
            include: {
                fields: true,
                bookings: {
                    where: { status: 'FINISHED' } // Laporan air yang sudah selesai
                },
                schedules: true
            }
        });

        // Format data
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

        res.status(200).json({ data: reportData });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat laporan', error: error.message });
    }
};

module.exports = { getReportData };
