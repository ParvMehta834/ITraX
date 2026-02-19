console.log('Starting test server...');

try {
  console.log('Loading app...');
  const app = require('./src/app');
  console.log('App loaded successfully');
  
  const PORT = process.env.PORT || 4000;
  const server = app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
