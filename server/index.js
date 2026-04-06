#!/usr/bin/env node

try {
  require('dotenv').config();
  console.log('[1/4] Dotenv configured');
  
  const connectDB = require('./src/config/db');
  console.log('[2/4] DB module loaded');
  
  const app = require('./src/app');
  console.log('[3/4] App loaded');

  const PORT = process.env.PORT || 5000;
  console.log('[4/4] Connecting MongoDB and starting server on port', PORT);

  const startServer = () => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n═══════════════════════════════════════════');
      console.log('✓ ITraX API Server');
      console.log('═══════════════════════════════════════════');
      console.log(`URL: http://localhost:${PORT}`);
      console.log('Status: Ready');
      console.log('═══════════════════════════════════════════\n');
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
  };

  connectDB().then(() => {
    startServer();
  }).catch((err) => {
    console.warn('MongoDB connection failed, starting in mock mode:', err.message);
    startServer();
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

