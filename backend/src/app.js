const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const pickupRoutes = require('./routes/pickupRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const repairRoutes = require('./routes/repairRoutes');
const reuseRoutes = require('./routes/reuseRoutes');
const recyclingRoutes = require('./routes/recyclingRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'ReTech API is up and running!',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/reuse', reuseRoutes);
app.use('/api/recycling', recyclingRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('🌿 ReTech E-Waste Management & Tracking API Server');
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
