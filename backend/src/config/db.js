const dns = require('dns');
const mongoose = require('mongoose');

let mongodInstance = null;

const autoSeedIfEmpty = async () => {
  if (process.env.NODE_ENV !== 'development') return;

  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Auto-seeding demo data...');
      const seedDatabaseInline = require('../utils/seedInline');
      await seedDatabaseInline();
      console.log('✨ Auto-seeding completed!');
    }
  } catch (err) {
    console.warn('Auto-seed check note:', err.name);
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI?.trim();

  if (mongoUri) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      await autoSeedIfEmpty();
      return conn;
    } catch (error) {
      const errorType = error.name || 'Error';
      throw new Error(
        `MongoDB connection failed for configured MONGO_URI (${errorType}); refusing temporary fallback. Check the URI, database credentials, Atlas network access list, and cluster status.`
      );
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    throw new Error('MONGO_URI is missing. Configure persistent MongoDB before starting outside local development.');
  }

  console.warn(
    '⚠️ MONGO_URI is not configured. Persistent MongoDB is unavailable; using temporary in-memory MongoDB for local development only. Data will not survive restart.'
  );

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const conn = await mongoose.connect(mongodInstance.getUri());
    console.log('✅ Connected to temporary in-memory MongoDB (data is ephemeral).');
    await autoSeedIfEmpty();
    return conn;
  } catch (error) {
    console.error(`❌ Temporary local MongoDB could not start: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
