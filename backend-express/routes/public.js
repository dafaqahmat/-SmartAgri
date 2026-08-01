const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

router.get('/map-status', async (req, res) => {
    try {
        // Get all farm fields
        const fields = await prisma.farmField.findMany({
            include: {
                user: { select: { name: true } }
            }
        });

        // Get currently active bookings (APPROVED, today, time matches)
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const today = new Date(`${y}-${m}-${d}`);

        const activeBookings = await prisma.waterBooking.findMany({
            where: {
                bookingDate: today,
                status: 'APPROVED'
            }
        });

        // Current time in minutes
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const convertToMinutes = (timeStr) => {
            const [h, m] = timeStr.split(':');
            return parseInt(h) * 60 + parseInt(m);
        };

        // Filter bookings that are currently flowing
        const currentlyFlowing = activeBookings.filter(b => {
            const startMins = convertToMinutes(b.startTime);
            const endMins = convertToMinutes(b.endTime);
            return currentMins >= startMins && currentMins < endMins;
        });

        // Map fields and check if they are flowing
        const mapData = fields.map(field => {
            const isFlowing = currentlyFlowing.some(
                b => b.userId === field.userId && b.blockName === field.name
            );

            return {
                id: field.id,
                lat: field.latitude,
                lng: field.longitude,
                ownerName: field.user.name,
                blockName: field.name,
                isFlowing: isFlowing
            };
        });

        res.status(200).json({ data: mapData });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch map data', error: error.message });
    }
});

module.exports = router;
