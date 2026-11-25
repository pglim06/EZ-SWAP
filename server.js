require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const initSocketIO = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

// ─── CORS origins (shared between Express and Socket.IO) ─────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

// ─── Socket.IO initialization (T11: Real-Time Messaging) ────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Allow session cookies
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));   // T15: Mutual Rating & Review System
app.use('/api/admin', require('./routes/adminRoutes'));      // T16: Admin Dashboard & Moderation
app.use('/api/chat', require('./routes/chatRoutes'));

// Initialize Socket.IO event handlers
initSocketIO(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`EZ Swap Server running on port ${PORT}`);
  console.log(`Socket.IO ready for real-time messaging`);
});

module.exports = app;
