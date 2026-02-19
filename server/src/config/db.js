const mongoose = require('mongoose');
let isMongoConnected = false;

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/itrax';
  try {
    await Promise.race([
      mongoose.connect(uri, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 2000,
        socketTimeoutMS: 2000,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      )
    ]);
    isMongoConnected = true;
    console.log('✓ MongoDB connected');
  } catch (err) {
    console.warn('⚠ MongoDB not available, using in-memory database for testing');
    console.warn(`  Error: ${err.message}`);
    console.warn('  To use MongoDB: Install MongoDB or use MongoDB Atlas');
    isMongoConnected = false;
  }
}

function isConnected() {
  return isMongoConnected;
}

module.exports = connectDB;
module.exports.isConnected = isConnected;

