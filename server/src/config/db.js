const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  try {
    if (mongoUri && !mongoUri.includes('127.0.0.1') && !mongoUri.includes('localhost')) {
      // Direct remote Atlas connection
      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ Connected to MongoDB Atlas successfully.');
      return;
    }

    // Try local / specified URI
    if (mongoUri) {
      try {
        console.log(`Attempting connection to MongoDB at ${mongoUri}...`);
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 3000,
        });
        console.log('✅ Connected to MongoDB successfully.');
        return;
      } catch (localErr) {
        console.warn('⚠️ Local/configured MongoDB unreachable:', localErr.message);
      }
    }

    // Fallback: Use MongoMemoryServer so the server always boots seamlessly
    console.log('ℹ️ Starting in-memory MongoDB fallback...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`✅ Connected to In-Memory MongoDB (${uri}). Ready for development and testing.`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
