const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Menyiapkan DATA MASTER saja untuk testing...');

  // 1. Bersihkan database secara berurutan
  await prisma.waterBooking.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.marketPrice.deleteMany();
  await prisma.farmField.deleteMany();
  await prisma.irrigationSetting.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash password default
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedPetaniPassword = await bcrypt.hash('petani123', 10);

  // 3. Buat Data Master User (Admin & Petani)
  await prisma.user.create({
    data: {
      name: 'Bapak Kepala Desa',
      email: 'admin@desa.com',
      password: hashedAdminPassword,
      phone: '081200000001',
      role: 'ADMIN'
    }
  });

  const petanisData = [
    { name: 'Pak Budi', email: 'petani1@desa.com', phone: '08123450001' },
    { name: 'Pak Anton', email: 'petani2@desa.com', phone: '08123450002' },
    { name: 'Bu Siti', email: 'petani3@desa.com', phone: '08123450003' },
  ];

  let blockCounter = 1;

  for (const p of petanisData) {
    const petani = await prisma.user.create({
      data: { name: p.name, email: p.email, password: hashedPetaniPassword, phone: p.phone, role: 'PETANI' }
    });

    // Buat 1-2 titik sawah (FarmField) untuk masing-masing petani
    const fieldCount = Math.floor(Math.random() * 2) + 1; // 1 atau 2 lahan
    for (let i = 0; i < fieldCount; i++) {
      await prisma.farmField.create({
        data: {
          userId: petani.id,
          name: `Blok ${String.fromCharCode(64 + blockCounter)} (${i+1})`, // Contoh: Blok A (1)
          address: 'Dsn Watuduwur Wangkal, Ds Tengger Lor, Kec Kunjang',
          latitude: -7.6740000 + (Math.random() * 0.005), // Variasi koordinat
          longitude: 112.1710000 + (Math.random() * 0.005)
        }
      });
      blockCounter++;
    }
  }

  // 4. Buat Master Data Tanaman (Crops) & Harga (MarketPrices)
  const cropsData = [
    { name: 'Padi Ciherang', durationDays: 100, yieldPerHaInTon: 6.0, price: 7500 },
    { name: 'Padi IR64', durationDays: 110, yieldPerHaInTon: 7.0, price: 7200 },
    { name: 'Cabai Merah Keriting', durationDays: 85, yieldPerHaInTon: 4.5, price: 35000 },
    { name: 'Bawang Merah', durationDays: 60, yieldPerHaInTon: 9.0, price: 25000 },
    { name: 'Jagung Manis', durationDays: 75, yieldPerHaInTon: 12.0, price: 4000 },
    { name: 'Tomat Sayur', durationDays: 70, yieldPerHaInTon: 15.0, price: 8000 }
  ];

  for (const c of cropsData) {
    const crop = await prisma.crop.create({
      data: { name: c.name, durationDays: c.durationDays, yieldPerHaInTon: c.yieldPerHaInTon }
    });
    
    // Harga Saat Ini
    await prisma.marketPrice.create({
      data: { cropId: crop.id, pricePerKg: c.price }
    });
    // History Harga Lama
    await prisma.marketPrice.create({
      data: { cropId: crop.id, pricePerKg: c.price * 0.9, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
  }

  // 5. Setup Master Irrigation Settings (Jadwal Buka Irigasi dari Admin)
  const activeDays = [1, 3, 5]; // Senin, Rabu, Jumat
  for (const day of activeDays) {
    await prisma.irrigationSetting.create({
      data: {
        dayOfWeek: day,
        startTime: '06:00',
        endTime: '18:00',
        description: 'Jadwal Reguler Desa',
        isActive: true
      }
    });
  }

  console.log('✅ DATA MASTER & DATA LAHAN (FarmField) berhasil di-generate!');
  console.log('--------------------------------------------------');
  console.log('📝 Jadwal Tanam (Schedule) dan Antrean Irigasi (WaterBooking) dibiarkan KOSONG.');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
