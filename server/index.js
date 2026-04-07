#!/usr/bin/env node

require('dotenv').config();

console.log('[1/4] Dotenv configured');

const connectDB = require('./src/config/db');
console.log('[2/4] DB module loaded');

const app = require('./src/app');
console.log('[3/4] App loaded');

const PORT = process.env.PORT || 10000;
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

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
};

connectDB()
  .then(() => startServer())
  .catch((err) => {
    console.warn('MongoDB failed, starting anyway:', err.message);
    startServer();
  });

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});