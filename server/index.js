require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 4000;

// Start server without waiting for DB connection
console.log('\n[ITraX API Server]');
console.log('Starting server on port', PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server listening on http://localhost:${PORT}`);
  console.log('Database: Using in-memory mock database');
  console.log('');
  
  // Optional: Try to connect to MongoDB in background
  const connectDB = require('./src/config/db');
  connectDB()
    .then(() => console.log('✓ MongoDB connected'))
    .catch(() => {
      // This is OK - we have mock DB as fallback
      // console.log('⚠ MongoDB unavailable - using mock database');
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
