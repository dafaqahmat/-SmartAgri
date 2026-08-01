const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');
const cropRoutes = require('./routes/crop');
const userRoutes = require('./routes/user');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Smart Agri Desa API" });
});

// Import Routes
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/users', userRoutes);
app.use('/api/water-bookings', require('./routes/waterBooking'));
app.use('/api/irrigation-settings', require('./routes/irrigationSetting'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/public', require('./routes/public'));
app.use('/api/report', require('./routes/report'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
