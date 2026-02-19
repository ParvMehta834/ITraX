ITraX - IT Asset Management & Tracking System

This repository contains a full-stack demo for ITraX: a SaaS-style IT Asset Management & Tracking System.

Structure:
- /client - React (Vite) frontend
- /server - Express + MongoDB backend

Quick start

1. Install server deps

```bash
cd server
npm install
```

2. Create `.env` from `.env.example` and set values.

3. Seed demo data (creates admin + sample employees/assets)

```bash
npm run seed
```

4. Start server

```bash
npm run dev
```

5. Install client deps and start client

```bash
cd ../client
npm install
npm run dev
```

Server runs on `http://localhost:4000` by default. Client runs on `http://localhost:5173`.

Notes:
- Paid plan UI shows "Coming Soon" only; no payment logic.
- First signup becomes ADMIN automatically.
