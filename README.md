# SecureLens 🔍

**Website Vulnerability & Security Analysis Platform**

A passive security scanner built with the MERN stack. Submit any URL and get a full security report covering SSL/TLS, HTTP headers, DNS recon, and breach exposure — with real-time progress via WebSocket.

---

## Quick Start

### Prerequisites
- Node.js 18+
- Redis (install via `brew install redis` on Mac or `sudo apt install redis-server` on Linux)
- MongoDB Atlas account (free tier) — or local MongoDB

### 1. Clone & install root deps
```bash
npm install
```

### 2. Setup the server
```bash
cd server
npm install
cp .env.example .env
# Fill in your .env values (MongoDB URI, API keys etc.)
```

### 3. Setup the client
```bash
cd client
npm install
```

### 4. Start Redis (in a separate terminal)
```bash
redis-server
```

### 5. Run everything
```bash
# From root folder
npm run dev
```

Frontend runs at: http://localhost:5173  
Backend runs at: http://localhost:5000

---

## API Keys You Need

| Service | Where to get it | Required? |
|---|---|---|
| MongoDB Atlas | https://cloud.mongodb.com | ✅ Yes |
| Shodan | https://shodan.io | ✅ Yes |
| HaveIBeenPwned | https://haveibeenpwned.com/API/Key | ✅ Yes |
| Google Safe Browsing | https://console.cloud.google.com | ✅ Yes |
| SSL Labs | No key needed | — |

---

## Project Structure

```
securelens/
├── client/          # React + Vite frontend
├── server/          # Express + Node.js backend
├── package.json     # Root scripts
└── README.md
```

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Socket.io-client, Axios
- **Backend:** Node.js, Express.js, Mongoose, Bull, Socket.io
- **Database:** MongoDB
- **Queue:** Bull + Redis
- **Auth:** JWT + bcryptjs
