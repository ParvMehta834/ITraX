#!/usr/bin/env node

try {
  require('dotenv').config();
  console.log('[1/3] Dotenv configured');
  
  const app = require('./src/app');
  console.log('[2/3] App loaded');

  const PORT = process.env.PORT || 4000;
  console.log('[3/3] Starting server on port', PORT);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n═══════════════════════════════════════════');
    console.log('✓ ITraX API Server');
    console.log('═══════════════════════════════════════════');
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Status: Ready`);
    console.log('═══════════════════════════════════════════\n');
    
    // Optional: Try to connect to MongoDB in background
    const connectDB = require('./src/config/db');
    connectDB()
      .then(() => console.log('✓ MongoDB connected'))
      .catch((err) => {
        // This is OK - we have mock DB as fallback
        console.log('⚠ Using mock database (MongoDB unavailable)');
      });
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 3000);
  });

  // Handle errors
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
  });

} catch (err) {
  console.error('[ERROR] Failed to start:', err.message);
  console.error(err.stack);
  process.exit(1);
}

