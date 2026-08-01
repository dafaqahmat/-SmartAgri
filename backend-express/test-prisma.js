const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const crop = await prisma.crop.create({
      data: {
        name: 'Test Crop',
        durationDays: 10,
        yieldPerHaInTon: 1.5,
        prices: {
          create: {
            pricePerKg: parseInt("5000")
          }
        }
      }
    });
    console.log("Success:", crop);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
