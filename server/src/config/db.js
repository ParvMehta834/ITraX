const mongoose = require('mongoose');
let isMongoConnected = false;

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required in environment variables');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 20000,
  });
  isMongoConnected = true;
  console.log('MongoDB connected');
}

function isConnected() {
  return isMongoConnected;
}

module.exports = connectDB;
module.exports.isConnected = isConnected;

