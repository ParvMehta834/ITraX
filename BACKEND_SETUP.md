# ITraX Backend Setup Guide

## Quick Start (No Database Setup Required)

If you just want to test the application quickly, use the in-memory mock database:

```bash
cd c:\6th-Sem\ITraX\server
node server.js
```

The API will start on `http://localhost:4000` with an in-memory database. All data will be lost when the server restarts.

---

## Option 1: MongoDB Atlas (Cloud - Recommended for Production)

### Prerequisites
- Free MongoDB Atlas account: https://www.mongodb.com/cloud/atlas

### Steps:

1. **Create a MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account
   - Create a free tier cluster

2. **Get Connection String**
   - In MongoDB Atlas, go to "Clusters" → Click "Connect"
   - Choose "Drivers"
   - Copy the connection string
   - It will look like: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/itrax?retryWrites=true&w=majority`

3. **Update Server .env File**
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/itrax?retryWrites=true&w=majority
   JWT_SECRET=your_secret_key
   PORT=4000
   CLIENT_URL=http://localhost:5173
   ```

4. **Start Server**
   ```bash
   cd c:\6th-Sem\ITraX\server
   npm start
   ```

---

## Option 2: MongoDB Local Installation

### Windows Installation:

1. **Download MongoDB Community**
   - Download from: https://www.mongodb.com/try/download/community
   - Choose Windows
   - Download the MSI installer

2. **Install MongoDB**
   - Run the installer
   - Choose "Complete" installation
   - Choose "Install as a Service"

3. **Start MongoDB Service**
   ```bash
   # PowerShell (as Administrator)
   net start MongoDB
   ```

4. **Update Server .env File**
   ```
   MONGO_URI=mongodb://localhost:27017/itrax
   JWT_SECRET=change_me
   PORT=4000
   CLIENT_URL=http://localhost:5173
   ```

5. **Start Server**
   ```bash
   cd c:\6th-Sem\ITraX\server
   npm start
   ```

---

## Verifying Server is Running

### Option 1: Test API Endpoint
```bash
# In a new PowerShell window
$ErrorActionPreference = "SilentlyContinue"
$response = Invoke-WebRequest -Uri "http://localhost:4000" -Method GET -UseBasicParsing
$response.Content
```

Should return:
```json
{"ok":true,"app":"ITraX API"}
```

### Option 2: Check Port Usage
```bash
netstat -ano | findstr :4000
```

If you see output, the server is listening.

---

## Common Issues

### "Cannot connect to server"
1. **Server not running**: Make sure you ran `npm start` or `node server.js`
2. **Wrong port**: Check that server is on port 4000
3. **Firewall**: Allow Node.js through Windows Firewall

### "MongoDB connection failed"
1. **Using in-memory DB**: Use `node server.js` instead of `npm start`
2. **MongoDB Atlas**: Check username/password in connection string
3. **Local MongoDB**: Make sure MongoDB service is running: `net start MongoDB`

### "Port 4000 already in use"
```bash
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process (replace PROCESSID with the PID)
taskkill /PID PROCESSID /F
```

---

## Running Frontend and Backend Together

### Terminal 1: Backend Server
```bash
cd c:\6th-Sem\ITraX\server
node server.js
```

### Terminal 2: Frontend Dev Server
```bash
cd c:\6th-Sem\ITraX\client
npm run dev
```

Then open: `http://localhost:5175`

---

## Database Options Comparison

| Feature | In-Memory (Mock) | MongoDB Local | MongoDB Atlas |
|---------|-----------------|---------------|--------------|
| Storage | RAM (lost on restart) | Local disk | Cloud |
| Setup Time | 0 min | 10 min | 5 min |
| Production Ready | No | Yes | Yes |
| Free | Yes | Yes | Yes (limits) |
| Performance | Fast | Medium | Variable |

---

## Next Steps

1. Choose your database option above
2. Follow the setup steps for your choice
3. Start the server with appropriate command
4. Open `http://localhost:5175` in your browser
5. Sign up with your details
6. Access the admin dashboard

---

## Support

If you have issues:
1. Check the terminal output for error messages
2. Make sure both frontend (5175) and backend (4000) are running
3. Check firewall/antivirus settings
4. Restart both services

