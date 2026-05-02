require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { init: initSocket } = require('./utils/socket');

const app = express();
const server = http.createServer(app);

// Init Socket.io
initSocket(server);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://secure-lens-six.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use('/api/', limiter);

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/scans',   require('./routes/scans'));
app.use('/api/results', require('./routes/results'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Connect DB then start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
    // Start queue workers
    require('./workers/index');
    console.log('✅ Workers started');
  })
  .catch((err) => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });
