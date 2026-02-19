#!/usr/bin/env node

try {
  console.log('[1/3] Initializing application...');
  const app = require('./src/app');
  console.log('[2/3] Application loaded successfully');

  const PORT = process.env.PORT || 4000;
  
  const server = app.listen(PORT, () => {
    console.log('[3/3] ✓ Server started successfully');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('ITraX API Server');
    console.log('═══════════════════════════════════════════');
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Status: ✓ Running`);
    console.log(`Database: In-Memory (Mock DB)`);
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('');
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[SHUTDOWN] Closing server...');
    server.close(() => {
      console.log('[SHUTDOWN] Server closed');
      process.exit(0);
    });
    
    // Force exit after 5 seconds
    setTimeout(() => {
      console.log('[SHUTDOWN] Force exiting...');
      process.exit(1);
    }, 5000);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('[ERROR] Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

} catch (err) {
  console.error('[FATAL] Failed to start server:');
  console.error(err.message);
  console.error('');
  console.error('Stack trace:');
  console.error(err.stack);
  process.exit(1);
}
