const prisma = require('../prisma/client');

// --- TANAMAN (CROP) ---

// Tambah Tanaman Baru & Harga Awal (Khusus Admin)
const createCrop = async (req, res) => {
    try {
        const { name, durationDays, yieldPerHaInTon, pricePerKg } = req.body;
        
        // Cek apakah komoditas dengan nama yang sama sudah ada
        const existingCrop = await prisma.crop.findFirst({
            where: { name }
        });

        if (existingCrop) {
            return res.status(400).json({ message: 'Nama komoditas sudah terdaftar di sistem.' });
        }

        let cropData = { 
            name, 
            durationDays: parseInt(durationDays), 
            yieldPerHaInTon: parseFloat(yieldPerHaInTon) 
        };

        // Hanya tambahkan harga jika input harga tersedia & valid
        if (pricePerKg && !isNaN(parseInt(pricePerKg))) {
            cropData.prices = {
                create: { pricePerKg: parseInt(pricePerKg) }
            };
        }

        const crop = await prisma.crop.create({
            data: cropData
        });
        res.status(201).json({ message: 'Tanaman berhasil ditambahkan', data: crop });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambah tanaman', error: error.message });
    }
};

// Update Data Tanaman & Harga (Khusus Admin)
const updateCrop = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, durationDays, yieldPerHaInTon, pricePerKg } = req.body;
        
        // Cek apakah komoditas dengan nama yang sama sudah ada dan bukan milik id ini
        const existingCrop = await prisma.crop.findFirst({
            where: { 
                name,
                id: { not: parseInt(id) }
            }
        });

        if (existingCrop) {
            return res.status(400).json({ message: 'Nama komoditas tersebut sudah digunakan.' });
        }

        // Update data dasar crop
        await prisma.crop.update({
            where: { id: parseInt(id) },
            data: { 
                name, 
                durationDays: parseInt(durationDays), 
                yieldPerHaInTon: parseFloat(yieldPerHaInTon) 
            }
        });

        // Cek harga terakhir
        if (pricePerKg && !isNaN(parseInt(pricePerKg))) {
            const latestPrice = await prisma.marketPrice.findFirst({
                where: { cropId: parseInt(id) },
                orderBy: { createdAt: 'desc' }
            });

            // Hanya insert record harga baru jika harganya BERBEDA dengan harga terakhir
            if (!latestPrice || latestPrice.pricePerKg !== parseInt(pricePerKg)) {
                await prisma.marketPrice.create({
                    data: {
                        cropId: parseInt(id),
                        pricePerKg: parseInt(pricePerKg)
                    }
                });
            }
        }

        res.status(200).json({ message: 'Data tanaman berhasil diupdate!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengupdate tanaman', error: error.message });
    }
};

// Ambil Semua Tanaman
const getAllCrops = async (req, res) => {
    try {
        const crops = await prisma.crop.findMany({
            include: { prices: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });
        res.status(200).json({ data: crops });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data tanaman', error: error.message });
    }
};


// --- HARGA PASAR ACUAN (MARKET PRICE) ---

// Tambah Harga Acuan Terbaru (Khusus Admin)
const updateMarketPrice = async (req, res) => {
    try {
        const { cropId, pricePerKg } = req.body;
        const price = await prisma.marketPrice.create({
            data: { cropId: parseInt(cropId), pricePerKg: parseInt(pricePerKg) }
        });
        res.status(201).json({ message: 'Harga pasar berhasil diupdate', data: price });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengupdate harga pasar', error: error.message });
    }
};

module.exports = {
    createCrop,
    updateCrop,
    getAllCrops,
    updateMarketPrice
};
